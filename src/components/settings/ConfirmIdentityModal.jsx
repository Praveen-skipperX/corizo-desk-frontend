import { useState } from 'react';
import { Shield } from 'lucide-react';
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
import OtpInput from '@/components/ui/OtpInput';

export default function ConfirmIdentityModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Identity',
  description = 'Please confirm your identity before changing security settings.',
  totpEnabled = false,
  loading = false,
}) {
  const [mode, setMode] = useState('password');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setPassword('');
    setTotpCode('');
    setError('');
    setMode('password');
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleConfirm = async () => {
    setError('');
    const payload = mode === 'totp'
      ? { totpCode }
      : { password };

    if (mode === 'totp' && totpCode.length !== 6) {
      setError('Enter the 6-digit authenticator code');
      return;
    }
    if (mode === 'password' && !password.trim()) {
      setError('Password is required');
      return;
    }

    try {
      await onConfirm(payload);
      reset();
    } catch (err) {
      setError(err.message || 'Verification failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {mode === 'password' ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoFocus
              />
            </div>
          ) : (
            <div>
              <label className="mb-3 block text-sm font-medium">Authenticator Code</label>
              <OtpInput value={totpCode} onChange={setTotpCode} autoFocus />
            </div>
          )}
          {totpEnabled && (
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => {
                setMode(mode === 'password' ? 'totp' : 'password');
                setError('');
              }}
            >
              {mode === 'password' ? 'Use authenticator code instead' : 'Use password instead'}
            </button>
          )}
        </DialogBody>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleConfirm}
            loading={loading}
            loadingText="Verifying..."
          >
            Confirm
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
