import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
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
import DateTimePicker from '@/components/ui/date-time-picker';
import api from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';

export default function QuickFollowUpModal({ open, onClose, lead, onSuccess }) {
  const toast = useToast();
  const [scheduledDate, setScheduledDate] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!(scheduledDate instanceof Date) || Number.isNaN(scheduledDate.getTime())) {
      setError('Please select a date and time.');
      return;
    }

    if (scheduledDate <= new Date()) {
      setError('Follow-up must be scheduled in the future.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post(`/leads/${lead._id}/next-follow-up`, {
        scheduledDate: scheduledDate.toISOString(),
        notes: notes.trim() || undefined,
      });
      toast.success('Follow-up scheduled', formatDateTime(scheduledDate));
      setScheduledDate(null);
      setNotes('');
      onSuccess?.();
      onClose();
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to schedule follow-up';
      setError(message);
      toast.error('Could not schedule follow-up', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Schedule Follow-up
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {lead?.leadId} — {lead?.name}
          </p>
          {lead?.nextFollowUpDate && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Current follow-up: {new Date(lead.nextFollowUpDate).toLocaleString()}
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Next follow-up date & time *</label>
            <DateTimePicker
              value={scheduledDate}
              onChange={(date) => { setScheduledDate(date); setError(''); }}
              placeholder="Select date & time"
              minDate={new Date()}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
            <Input
              placeholder="Brief note for this follow-up..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogBody>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <LoadingButton
            onClick={handleSubmit}
            loading={loading}
            loadingText="Scheduling..."
            disabled={!scheduledDate}
          >
            Schedule Follow-up
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
