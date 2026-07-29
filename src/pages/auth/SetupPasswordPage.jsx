import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import LoadingButton from '@/components/ui/loading-button';
import PasswordInput from '@/components/ui/password-input';
import { setUser } from '@/store/authSlice';
import api from '@/lib/api';

export default function SetupPasswordPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isFirstSetup = user?.mustSetPasswordOnFirstLogin;
  const isOneTimeChange = user?.mustChangePassword;

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/setup-password', form);
      const nextUser = res.data?.user || res.data;
      dispatch(setUser({
        ...nextUser,
        mustChangePassword: false,
        mustSetPasswordOnFirstLogin: false,
      }));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const title = isFirstSetup ? 'Create your password' : 'Update your password';
  const description = isFirstSetup
    ? 'Set a secure password to complete your account setup.'
    : isOneTimeChange
      ? 'Your administrator assigned a temporary password. Choose a new password to continue — this is required once.'
      : 'Set a secure password before accessing the dashboard.';

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/logo.jpg"
            alt="Corizo"
            className="mb-3 h-12 w-auto max-w-[200px] object-contain"
          />
          <h1 className="text-xl font-bold text-secondary">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">New password</label>
            <PasswordInput
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              placeholder="Min 8 chars, upper, lower, number, symbol"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Confirm password</label>
            <PasswordInput
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Re-enter password"
              required
            />
          </div>
          <LoadingButton type="submit" className="w-full" loading={loading} loadingText="Saving password...">
            {isOneTimeChange ? 'Update password and continue' : 'Create password and continue'}
          </LoadingButton>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Password must include uppercase, lowercase, number, and special character.
        </p>
      </div>
    </div>
  );
}
