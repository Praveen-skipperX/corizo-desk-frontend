import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import LoadingButton from '@/components/ui/loading-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { useSelector } from 'react-redux';
import { canAddCreatorRemark, canAddAdminRemark } from '@/lib/remarkPermissions';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useToast } from '@/components/ui/toast';

export default function QuickRemarkModal({ open, onClose, lead, onSuccess }) {
  const toast = useToast();
  const { user } = useSelector((state) => state.auth);
  const { adminRemarksEnabled } = useAppSettings();
  const [content, setContent] = useState('');
  const [type, setType] = useState('creator');
  const [loading, setLoading] = useState(false);

  const allowCreator = canAddCreatorRemark(user, lead);
  const allowAdmin = canAddAdminRemark(user, { adminRemarksEnabled });

  useEffect(() => {
    if (!open) return;
    if (allowCreator) setType('creator');
    else if (allowAdmin) setType('admin');
  }, [open, allowCreator, allowAdmin]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const endpoint = type === 'admin'
        ? `/leads/${lead._id}/admin-remarks`
        : `/leads/${lead._id}/creator-remarks`;
      await api.post(endpoint, { content: content.trim() });
      setContent('');
      toast.success(
        type === 'admin' ? 'Admin remark added' : 'Remark added',
        lead?.leadId ? `Saved on ${lead.leadId}` : undefined,
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Could not add remark', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const showTypeToggle = allowCreator && allowAdmin;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Quick Remark
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {lead?.leadId} — {lead?.name}
          </p>
          {showTypeToggle && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('creator')}
                className={`rounded-lg border px-3 py-1.5 text-sm ${type === 'creator' ? 'border-primary bg-primary/10' : ''}`}
              >
                Remark
              </button>
              {/* Admin Remark option — only when feature enabled in System Settings */}
              <button
                type="button"
                onClick={() => setType('admin')}
                className={`rounded-lg border px-3 py-1.5 text-sm ${type === 'admin' ? 'border-primary bg-primary/10' : ''}`}
              >
                Admin Remark
              </button>
            </div>
          )}
          {!showTypeToggle && allowAdmin && (
            <p className="text-xs text-muted-foreground">Adding as admin instruction for the assigned counselor.</p>
          )}
          <Input
            placeholder={type === 'admin' ? 'Add instruction for counselor...' : 'Enter remark...'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          />
        </DialogBody>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <LoadingButton onClick={handleSubmit} loading={loading} loadingText="Saving remark..." disabled={!content.trim()}>
            Add Remark
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
