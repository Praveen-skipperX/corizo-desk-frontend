import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import LoadingButton from '@/components/ui/loading-button';
import { Button } from '@/components/ui/button';
import PasswordInput from '@/components/ui/password-input';
import api from '@/lib/api';
import { useToast } from '@/components/ui/toast';

export default function ResetPasswordModal({ open, onClose, user, onSuccess }) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/users/${user._id}/reset-password`, { password, confirmPassword });
      toast.success('Password reset', user?.name || user?.email);
      reset();
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Failed to reset password');
      toast.error('Could not reset password', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Reset password
          </DialogTitle>
          <DialogDescription>
            Set a temporary password for <strong>{user?.name}</strong>. They must choose a new password on their next sign in.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Temporary password</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Confirm password</label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              One-time change is required. The employee cannot continue until they update this password after signing in.
            </p>
          </DialogBody>
          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <LoadingButton type="submit" loading={loading} loadingText="Resetting password...">
              Reset password
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
