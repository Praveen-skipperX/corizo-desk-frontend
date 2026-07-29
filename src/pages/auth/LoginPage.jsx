import LoadingButton from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import OtpInput from '@/components/ui/OtpInput';
import { formatCountdown, useCountdown } from '@/hooks/useCountdown';
import api from '@/lib/api';
import { setUser } from '@/store/authSlice';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, Clock, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const REMEMBER_KEY = 'corizo_desk_remember_email';

const credentialsSchema = z.object({
  email: z.string().min(3, 'Enter your email or username'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

const STEP_COPY = {
  credentials: {
    title: 'Welcome back',
    subtitle: 'Sign in to Corizo Desk to continue',
  },
  otp: {
    title: 'Check your email',
    subtitle: null,
  },
  totp: {
    title: 'Authenticator',
    subtitle: 'Enter the 6-digit code from your authenticator app',
  },
  setup: {
    title: 'Set up authenticator',
    subtitle: 'Scan the QR code with your authenticator app, then enter the 6-digit code',
  },
};

export default function LoginPage() {
  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [mfaPreference, setMfaPreference] = useState('otp');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [totpError, setTotpError] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [otpSessionActive, setOtpSessionActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { seconds: expirySeconds, start: startExpiry, reset: resetExpiry, isActive: expiryActive } = useCountdown(0);
  const { seconds: resendSeconds, start: startResend, reset: resetResend, isActive: resendActive } = useCountdown(0);

  const rememberedEmail = typeof window !== 'undefined' ? localStorage.getItem(REMEMBER_KEY) || '' : '';

  const credentialsForm = useForm({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: rememberedEmail,
      password: '',
      remember: Boolean(rememberedEmail),
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const finishLogin = (payload) => {
    api.setToken(payload.accessToken);
    dispatch(setUser(payload.user));
    setPassword('');
    if (payload.requiresPasswordSetup) {
      navigate('/setup-password');
    } else {
      navigate('/dashboard');
    }
  };

  const syncOtpStatus = useCallback(async (targetEmail) => {
    try {
      const res = await api.get('/auth/otp/status', { email: targetEmail });
      const { expiresIn, cooldownRemaining, attemptsRemaining: remaining } = res.data;
      if (expiresIn > 0) startExpiry(expiresIn);
      if (cooldownRemaining > 0) startResend(cooldownRemaining);
      if (remaining !== undefined) setAttemptsRemaining(remaining);
    } catch {
      /* status unavailable */
    }
  }, [startExpiry, startResend]);

  const submitCredentials = async (data) => {
    setLoading(true);
    setLoadingMessage('Verifying your credentials…');
    setError('');
    setOtpError(false);
    setTotpError(false);
    try {
      if (data.remember) {
        localStorage.setItem(REMEMBER_KEY, data.email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      const response = await api.post('/auth/employee/login', {
        email: data.email,
        password: data.password,
      });
      const payload = response.data;
      setEmail(data.email);
      setPassword(data.password);
      setMfaPreference(payload.mfaPreference || 'otp');

      if (payload.requiresTotpSetup) {
        setTempToken(payload.tempToken);
        setQrCodeUrl(payload.qrCodeUrl || '');
        setTotpCode('');
        setStep('setup');
        return;
      }

      if (payload.requiresTotp && !payload.requiresEmailOtp) {
        setTempToken(payload.tempToken);
        setStep('totp');
        return;
      }

      setOtp('');
      setAttemptsRemaining(payload.maxAttempts ?? 3);
      setOtpSessionActive(true);
      setStep('otp');
      startExpiry(payload.expiresIn ?? 300);
      startResend(payload.resendCooldown ?? 60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const resendOtp = async () => {
    if (!email || !password) return;
    await submitCredentials({ email, password, remember: credentialsForm.getValues('remember') });
  };

  useEffect(() => {
    if (step === 'otp' && email) {
      syncOtpStatus(email);
    }
  }, [step, email, syncOtpStatus]);

  const verifyEmailOtp = async (code) => {
    const otpValue = code || otp;
    if (otpValue.length !== 6 || loading) return;

    setLoading(true);
    setLoadingMessage('Verifying email code…');
    setError('');
    setOtpError(false);
    try {
      const response = await api.post('/auth/otp/verify', { email, otp: otpValue });
      const payload = response.data;

      if (payload.requiresTotp) {
        setTempToken(payload.tempToken);
        setTotpCode('');
        setStep('totp');
        return;
      }

      finishLogin(payload);
    } catch (err) {
      setOtp('');
      setOtpError(true);
      setError(err.message);
      if (err.meta?.attemptsRemaining !== undefined) {
        setAttemptsRemaining(err.meta.attemptsRemaining);
      }
      if (err.code === 'ACCOUNT_LOCKED' || err.code === 'OTP_MAX_ATTEMPTS') {
        setAttemptsRemaining(0);
      }
      if (err.code === 'OTP_EXPIRED' || err.code === 'PASSWORD_VERIFICATION_REQUIRED') {
        resetExpiry();
        setOtpSessionActive(false);
        setStep('credentials');
      }
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const verifyAuthenticator = async (code) => {
    const value = code || totpCode;
    if (value.length !== 6 || loading) return;

    setLoading(true);
    setLoadingMessage('Verifying authenticator code…');
    setError('');
    setTotpError(false);
    try {
      // Same verify endpoint for employees and Super Admin
      const response = await api.post('/auth/employee/verify-totp', {
        tempToken,
        totpCode: value,
      });
      finishLogin(response.data);
    } catch (err) {
      setTotpCode('');
      setTotpError(true);
      setError(err.message);
      if (err.code === 'SESSION_EXPIRED') {
        setStep('credentials');
        setTempToken('');
        setQrCodeUrl('');
      }
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setOtp('');
    setTotpCode('');
    setError('');
    setOtpError(false);
    setTotpError(false);
    setOtpSessionActive(false);
    setTempToken('');
    setQrCodeUrl('');
    setPassword('');
    resetExpiry();
    resetResend();
  };

  const isExpired = otpSessionActive && !expiryActive;
  const otpDisabled = loading || attemptsRemaining === 0 || isExpired;
  const stepCopy = STEP_COPY[step];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(110, 37, 164, 0.08), transparent)',
        }}
      />

      <div
        className={cn(
          'relative z-10 w-full max-w-[400px] transition-all duration-500 ease-out',
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        )}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src="/logo.jpg"
            alt="Corizo"
            className="mb-5 h-12 w-auto max-w-[200px] object-contain"
          />
          <p className="text-[13px] font-semibold tracking-wide text-primary">Corizo Desk</p>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-foreground">
            {stepCopy.title}
          </h1>
          <p className="mt-2 max-w-[320px] text-[15px] leading-relaxed text-muted-foreground">
            {step === 'otp' ? (
              <>
                We sent a code to <span className="font-medium text-foreground">{email}</span>
                {mfaPreference === 'both' && '. Then you will verify with your authenticator.'}
              </>
            ) : (
              stepCopy.subtitle
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-7 shadow-elevated sm:p-8">
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50 px-3.5 py-3 text-[13px] leading-snug text-red-700 animate-in fade-in duration-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'credentials' && (
            <form onSubmit={credentialsForm.handleSubmit(submitCredentials)} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[13px] font-medium text-foreground">
                  Email or username
                </label>
                <Input
                  id="email"
                  placeholder="name@corizo.in or username"
                  type="text"
                  autoComplete="username"
                  className="h-11 rounded-xl"
                  {...credentialsForm.register('email')}
                />
                {credentialsForm.formState.errors.email && (
                  <p className="pt-0.5 text-[13px] text-red-600">
                    {credentialsForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-[13px] font-medium text-foreground">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[13px] font-medium text-primary transition-opacity hover:opacity-80"
                    onClick={() =>
                      setError('Contact your administrator to reset your password.')
                    }
                  >
                    Forgot password?
                  </button>
                </div>
                <PasswordInput
                  id="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  inputClassName="h-11 rounded-xl"
                  {...credentialsForm.register('password')}
                />
                {credentialsForm.formState.errors.password && (
                  <p className="pt-0.5 text-[13px] text-red-600">
                    {credentialsForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
                  {...credentialsForm.register('remember')}
                />
                <span className="text-[13px] text-muted-foreground">Remember me</span>
              </label>

              <LoadingButton
                type="submit"
                className="h-11 w-full rounded-xl text-[15px] font-semibold"
                loading={loading}
                loadingText={loadingMessage || 'Signing in…'}
              >
                Sign in
              </LoadingButton>
            </form>
          )}

          {step === 'otp' && (
            <div className="space-y-5">
              <OtpInput
                value={otp}
                onChange={setOtp}
                onComplete={verifyEmailOtp}
                error={otpError}
                disabled={otpDisabled}
                autoFocus
              />

              {expiryActive && (
                <div className="flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Expires in <strong className="font-medium text-secondary">{formatCountdown(expirySeconds)}</strong>
                  </span>
                </div>
              )}

              {isExpired && (
                <p className="text-center text-[13px] text-red-600">
                  This code has expired. Sign in again to receive a new one.
                </p>
              )}

              {attemptsRemaining < 3 && attemptsRemaining > 0 && (
                <p className="text-center text-[13px] text-muted-foreground">
                  {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                </p>
              )}

              {loading && (
                <div className="flex flex-col items-center gap-2 py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                  <p className="text-[13px] text-muted-foreground">{loadingMessage}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 text-[13px]">
                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-secondary"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={resendActive || loading}
                  onClick={resendOtp}
                  className="font-medium text-secondary transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  {resendActive ? `Resend in ${formatCountdown(resendSeconds)}` : 'Resend code'}
                </button>
              </div>
            </div>
          )}

          {step === 'setup' && (
            <div className="space-y-5">
              {qrCodeUrl && (
                <div className="flex justify-center">
                  <img src={qrCodeUrl} alt="Authenticator QR code" className="h-44 w-44 rounded-lg border bg-white p-2" />
                </div>
              )}
              <OtpInput
                value={totpCode}
                onChange={setTotpCode}
                onComplete={verifyAuthenticator}
                error={totpError}
                disabled={loading}
                autoFocus
              />

              {loading && (
                <div className="flex flex-col items-center gap-2 py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                  <p className="text-[13px] text-muted-foreground">{loadingMessage}</p>
                </div>
              )}

              <LoadingButton
                type="button"
                className="h-11 w-full rounded-xl text-[15px] font-medium"
                onClick={() => verifyAuthenticator()}
                loading={loading}
                loadingText="Activating…"
                disabled={totpCode.length !== 6}
              >
                Verify &amp; continue
              </LoadingButton>

              <button
                type="button"
                onClick={handleBackToCredentials}
                className="flex w-full items-center justify-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-secondary"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Use a different account
              </button>
            </div>
          )}

          {step === 'totp' && (
            <div className="space-y-5">
              <OtpInput
                value={totpCode}
                onChange={setTotpCode}
                onComplete={verifyAuthenticator}
                error={totpError}
                disabled={loading}
                autoFocus
              />

              {loading && (
                <div className="flex flex-col items-center gap-2 py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                  <p className="text-[13px] text-muted-foreground">{loadingMessage}</p>
                </div>
              )}

              <LoadingButton
                type="button"
                className="h-11 w-full rounded-xl text-[15px] font-medium"
                onClick={() => verifyAuthenticator()}
                loading={loading}
                loadingText="Signing in…"
                disabled={totpCode.length !== 6}
              >
                Sign in
              </LoadingButton>

              <button
                type="button"
                onClick={handleBackToCredentials}
                className="flex w-full items-center justify-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-secondary"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Use a different account
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[12px] text-muted-foreground">
            © {new Date().getFullYear()} Corizo Desk · v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
