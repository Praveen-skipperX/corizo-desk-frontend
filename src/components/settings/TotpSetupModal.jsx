import { useState } from 'react';
import { Copy, CheckCircle2, Smartphone } from 'lucide-react';
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
import OtpInput from '@/components/ui/OtpInput';

export default function TotpSetupModal({
  open,
  onClose,
  setupData,
  onVerify,
  loading = false,
  success = false,
}) {
  const [totpCode, setTotpCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!setupData?.secret) return;
    await navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setTotpCode('');
    setCopied(false);
    onClose?.();
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogBody className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="mb-4 h-14 w-14 text-emerald-500" />
            <h3 className="text-lg font-semibold text-secondary">Authenticator successfully enabled</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is now protected with an authenticator app.
            </p>
            <Button className="mt-6" onClick={handleClose}>Done</Button>
          </DialogBody>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Set Up Authenticator App
          </DialogTitle>
          <DialogDescription>
            Scan the QR code with Google Authenticator, Microsoft Authenticator, or Authy.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-6">
          {setupData?.qrCodeUrl && (
            <div className="flex justify-center">
              <img
                src={setupData.qrCodeUrl}
                alt="TOTP QR Code"
                className="h-48 w-48 rounded-xl border bg-white p-2 shadow-sm"
              />
            </div>
          )}

          {setupData?.secret && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Manual Secret Key
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-background px-3 py-2 text-sm font-mono">
                  {setupData.secret}
                </code>
                <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <div>
            <p className="mb-3 text-sm font-medium">Enter verification code</p>
            <OtpInput value={totpCode} onChange={setTotpCode} autoFocus />
          </div>
        </DialogBody>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton
            onClick={() => onVerify?.(totpCode)}
            loading={loading}
            loadingText="Verifying authenticator..."
            disabled={totpCode.length !== 6}
          >
            Verify & Enable
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
