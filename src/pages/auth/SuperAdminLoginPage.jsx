import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import LoadingButton from '@/components/ui/loading-button';
import LoginShell from '@/components/auth/LoginShell';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import OtpInput from '@/components/ui/OtpInput';
import api from '@/lib/api';
import { setUser } from '@/store/authSlice';

const loginSchema = z.object({
  username: z.string().min(3, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function SuperAdminLoginPage() {
  const [step, setStep] = useState('credentials');
  const [tempToken, setTempToken] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [totpError, setTotpError] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const loginForm = useForm({ resolver: zodResolver(loginSchema) });

  const handleLogin = async (data) => {
    setLoading(true);
    setLoadingMessage('Verifying administrator credentials...');
    setError('');
    try {
      const response = await api.post('/auth/super-admin/login', data);
      setTempToken(response.data.tempToken);

      if (response.data.requiresTotpSetup) {
        setQrCodeUrl(response.data.qrCodeUrl);
        setStep('setup');
      } else {
        setStep('totp');
      }
      setTotpCode('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleTotp = async (code) => {
    const totpValue = code || totpCode;
    if (totpValue.length !== 6 || loading) return;

    setLoading(true);
    setLoadingMessage('Signing in securely...');
    setError('');
    setTotpError(false);
    try {
      const response = await api.post('/auth/super-admin/verify-totp', {
        tempToken,
        totpCode: totpValue,
      });
      api.setToken(response.data.accessToken);
      dispatch(setUser(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setTotpCode('');
      setTotpError(true);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setTotpCode('');
    setError('');
    setTotpError(false);
    setQrCodeUrl('');
    setTempToken('');
  };

  const titles = {
    credentials: 'Administrator sign in',
    totp: 'Authenticator verification',
    setup: 'Set up authenticator',
  };

  const subtitles = {
    credentials: 'Restricted access for authorized Corizo administrators only.',
    totp: 'Enter the 6-digit code from your authenticator app.',
    setup: 'Scan the QR code with your authenticator app, then enter the verification code.',
  };

  return (
    <LoginShell
      badge="Administrator access"
      brandTitle="Corizo Desk Admin"
      brandDescription="Restricted administrative access with password and authenticator verification."
      title={titles[step]}
      subtitle={subtitles[step]}
      footer={(
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Employee sign in
        </Link>
      )}
    >
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 'credentials' && (
        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-secondary">Username</label>
            <Input id="username" placeholder="Administrator username" autoComplete="username" className="h-10" {...loginForm.register('username')} />
            {loginForm.formState.errors.username && (
              <p className="mt-1.5 text-sm text-destructive">{loginForm.formState.errors.username.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-secondary">Password</label>
            <PasswordInput id="password" placeholder="Enter password" autoComplete="current-password" className="h-10" {...loginForm.register('password')} />
            {loginForm.formState.errors.password && (
              <p className="mt-1.5 text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
            )}
          </div>
          <LoadingButton type="submit" className="h-10 w-full" loading={loading} loadingText={loadingMessage || 'Verifying administrator credentials...'}>
            Next
          </LoadingButton>
        </form>
      )}

      {(step === 'totp' || step === 'setup') && (
        <div className="space-y-4">
          {step === 'setup' && qrCodeUrl && (
            <div className="rounded-md border bg-muted/20 p-3 text-center">
              <img src={qrCodeUrl} alt="Authenticator QR Code" className="mx-auto h-32 w-32 rounded-md border bg-white p-1.5" />
            </div>
          )}

          <OtpInput
            value={totpCode}
            onChange={setTotpCode}
            onComplete={handleTotp}
            error={totpError}
            disabled={loading}
            autoFocus
          />

          {loading && (
            <div className="flex flex-col items-center gap-2 py-1">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{loadingMessage}</p>
            </div>
          )}

          <LoadingButton
            type="button"
            className="h-10 w-full"
            onClick={() => handleTotp()}
            loading={loading}
            loadingText="Signing in securely..."
            disabled={totpCode.length !== 6}
          >
            Sign in
          </LoadingButton>

          <button
            type="button"
            onClick={handleBackToCredentials}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Use a different account
          </button>
        </div>
      )}
    </LoginShell>
  );
}
