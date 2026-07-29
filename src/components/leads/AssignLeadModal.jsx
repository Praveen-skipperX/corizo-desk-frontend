import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import LoadingButton from '@/components/ui/loading-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { useGetUsersQuery } from '@/store/api/apiSlice';
import { ENABLE_DEPARTMENTS } from '@/lib/features';
import { useToast } from '@/components/ui/toast';

export default function AssignLeadModal({ open, onClose, lead, onSuccess }) {
  const toast = useToast();
  const [assignedTo, setAssignedTo] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: usersData } = useGetUsersQuery({ limit: 100, role: 'employee' });
  const employees = (usersData?.data || []).filter((u) => u.isActive);

  const handleAssign = async () => {
    if (!assignedTo) {
      setError('Select a counselor');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post(`/leads/${lead._id}/assign`, {
        assignedTo,
        reason,
      });
      const counselor = employees.find((u) => u._id === assignedTo);
      const isReassign = Boolean(lead?.assignedTo);
      toast.success(
        isReassign ? 'Lead reassigned' : 'Lead assigned',
        counselor?.name
          ? `${lead?.leadId || 'Lead'} → ${counselor.name}`
          : lead?.leadId,
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      const message = err.message || 'Assignment failed';
      setError(message);
      toast.error(lead?.assignedTo ? 'Could not reassign lead' : 'Could not assign lead', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {lead?.assignedTo ? 'Reassign Lead' : 'Assign Lead'}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {lead?.leadId} — {lead?.name}
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="mb-1 block text-sm font-medium">Assigned Counselor</label>
            <select
              className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Select counselor</option>
              {employees.map((u) => (
                <option key={u._id} value={u._id}>
                  {ENABLE_DEPARTMENTS && u.department?.name ? `${u.name} — ${u.department.name}` : u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Reason (optional)</label>
            <Input
              placeholder="Why is this lead being assigned?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <LoadingButton onClick={handleAssign} loading={loading} loadingText={lead?.assignedTo ? 'Reassigning lead...' : 'Assigning lead...'}>
            {lead?.assignedTo ? 'Reassign' : 'Assign'}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AssigneeCell({ user, department }) {
  if (!user?.name) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      {user.avatar ? (
        <img src={user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
          {initials}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{user.name}</p>
        {ENABLE_DEPARTMENTS && (
          <p className="truncate text-xs text-muted-foreground">
            {department?.name || user.department?.name || '—'}
          </p>
        )}
      </div>
    </div>
  );
}

export function AssignmentHistory({ history = [] }) {
  if (!history.length) {
    return <p className="text-sm text-muted-foreground">No assignment history yet.</p>;
  }

  return (
    <div className="space-y-0 divide-y">
      {history.map((entry) => {
        const typeLabel = entry.type === 'reassign' ? 'Reassigned' : entry.type === 'transfer' ? 'Transferred' : 'Assigned';
        const assigneeName = entry.assignedTo?.name || 'Unknown';
        const assignerName = entry.assignedBy?.name || 'System';
        const prevName = entry.previousAssignee?.name;

        return (
          <div key={entry._id} className="py-3 first:pt-0">
            <p className="text-sm font-medium">
              {typeLabel} to {assigneeName} by {assignerName}
            </p>
            {prevName && (
              <p className="text-xs text-muted-foreground">Previously: {prevName}</p>
            )}
            {entry.reason && (
              <p className="mt-1 text-xs text-muted-foreground">Reason: {entry.reason}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(entry.createdAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        );
      })}
    </div>
  );
}
