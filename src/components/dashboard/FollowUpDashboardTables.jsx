import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ExternalLink,
  CalendarClock,
  CheckCircle2,
  Sun,
  CalendarDays,
  AlertTriangle,
  Phone,
  Clock,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { PriorityIndicator } from '@/components/ui/priority-indicator';
import { FollowUpItemCard } from '@/components/ui/compact-cards';
import { useGetFollowUpDashboardQuery, useUpdateLeadMutation } from '@/store/api/apiSlice';
import { useToast } from '@/components/ui/toast';
import { cn, formatDateTime } from '@/lib/utils';
import { ENABLE_DEPARTMENTS } from '@/lib/features';

const SECTION_CONFIG = {
  today: {
    shell: 'border-primary/40 bg-white shadow-md ring-1 ring-primary/10',
    header: 'border-b border-primary/20 bg-primary/10',
    iconWrap: 'bg-secondary text-primary',
    title: 'text-secondary',
    Icon: Sun,
  },
  tomorrow: {
    shell: 'border-blue-300 bg-white shadow-md ring-1 ring-blue-100',
    header: 'border-b border-blue-200 bg-blue-50',
    iconWrap: 'bg-blue-600 text-white',
    title: 'text-blue-950',
    Icon: CalendarDays,
  },
  overdue: {
    shell: 'border-red-300 bg-white shadow-md ring-1 ring-red-100',
    header: 'border-b border-red-200 bg-red-50',
    iconWrap: 'bg-red-600 text-white',
    title: 'text-red-950',
    Icon: AlertTriangle,
  },
};

function FollowUpTable({ title, items, emptyMessage, variant, onEdit, onComplete, onCancel }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const cfg = SECTION_CONFIG[variant] || SECTION_CONFIG.today;
  const { Icon } = cfg;

  const filtered = useMemo(() => {
    if (!search.trim()) return items || [];
    const q = search.toLowerCase();
    return (items || []).filter(
      (lead) =>
        lead.name?.toLowerCase().includes(q) ||
        lead.phone?.includes(q) ||
        lead.leadId?.toLowerCase().includes(q) ||
        lead.assignedTo?.name?.toLowerCase().includes(q) ||
        lead.department?.name?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const actionButtons = (lead) => (
    <div className="flex justify-end gap-0.5">
      <Button variant="outline" size="icon" className="h-7 w-7" asChild title="Open lead">
        <Link to={`/leads/${lead._id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
      </Button>
      <Button variant="outline" size="icon" className="h-7 w-7 border-violet-200 bg-violet-50 text-violet-700" title="Reschedule" onClick={() => onEdit(lead)}>
        <CalendarClock className="h-3.5 w-3.5" />
      </Button>
      <Button variant="outline" size="icon" className="h-7 w-7 border-emerald-200 bg-emerald-50 text-emerald-700" title="Mark completed" onClick={() => onComplete(lead)}>
        <CheckCircle2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
        title="Cancel next follow-up"
        onClick={() => onCancel(lead)}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div className={cn('overflow-hidden rounded-xl', cfg.shell)}>
      <div className={cn('flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between', cfg.header)}>
        <h3 className={cn('flex items-center gap-2.5 font-sans text-[14px] font-semibold tracking-tight', cfg.title)}>
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-md shadow-sm', cfg.iconWrap)}>
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
          {title}
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[12px] font-bold tabular-nums text-muted-foreground ring-1 ring-border/60">
            {items?.length || 0}
          </span>
        </h3>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-8 border-border/80 bg-white pl-8 text-xs"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {paginated.length === 0 ? (
        <p className="bg-slate-50/80 px-4 py-10 text-center font-sans text-[13px] text-muted-foreground">{emptyMessage}</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto bg-slate-50/80 md:block">
            <table className="w-full min-w-max text-xs">
              <thead className="sticky top-0 z-10 border-b border-border/80 bg-muted/90 backdrop-blur">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide text-muted-foreground">Priority</th>
                  <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
                  <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide text-muted-foreground">Phone</th>
                  <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide text-muted-foreground">Counselor</th>
                  {ENABLE_DEPARTMENTS && (
                    <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide text-muted-foreground">Department</th>
                  )}
                  <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide text-muted-foreground">Follow-up</th>
                  <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-2 py-2 text-right font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginated.map((lead) => (
                  <tr key={lead._id} className="bg-white transition-colors hover:bg-primary/5">
                    <td className="whitespace-nowrap px-2 py-1.5"><PriorityIndicator priority={lead.priority} size="sm" /></td>
                    <td className="whitespace-nowrap px-2 py-1.5">
                      <Link to={`/leads/${lead._id}`} className="font-medium text-primary hover:underline">
                        {lead.name}
                      </Link>
                      <p className="text-[10px] text-muted-foreground">{lead.leadId}</p>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />{lead.phone}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">{lead.assignedTo?.name || '—'}</td>
                    {ENABLE_DEPARTMENTS && (
                      <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">{lead.department?.name || '—'}</td>
                    )}
                    <td className="whitespace-nowrap px-2 py-1.5">
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Clock className="h-3 w-3 text-primary" />
                        {formatDateTime(lead.nextFollowUpDate)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5"><StatusBadge status={lead.status} /></td>
                    <td className="whitespace-nowrap px-2 py-1.5">
                      {actionButtons(lead)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-1.5 bg-slate-50/80 p-2 md:hidden">
            {paginated.map((lead) => (
              <FollowUpItemCard
                key={lead._id}
                lead={lead}
                variant={variant}
                actions={actionButtons(lead)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/80 bg-white px-3 py-2">
              <p className="font-sans text-[12px] text-muted-foreground">
                {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function FollowUpDashboardTables({ onEditLead }) {
  const toast = useToast();
  const { data, isLoading, refetch } = useGetFollowUpDashboardQuery();
  const [updateLead] = useUpdateLeadMutation();
  const dashboard = data?.data || {};

  const clearNextFollowUp = async (lead, { completed }) => {
    try {
      await updateLead({
        id: lead._id,
        nextFollowUpDate: null,
        status: lead.status === 'follow_up' ? 'connected' : lead.status,
      }).unwrap();
      toast.success(
        completed ? 'Follow-up completed' : 'Next follow-up cancelled',
        lead.leadId || lead.name
      );
      refetch();
    } catch (err) {
      toast.error(
        completed ? 'Could not complete follow-up' : 'Could not cancel follow-up',
        err.data?.message || err.message
      );
    }
  };

  const handleComplete = (lead) => clearNextFollowUp(lead, { completed: true });
  const handleCancel = (lead) => {
    if (!window.confirm(`Cancel next follow-up for ${lead.name || lead.leadId}?`)) return;
    clearNextFollowUp(lead, { completed: false });
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const sections = [
    { key: 'today', title: "Today's Follow-ups", items: dashboard.today, empty: 'No follow-ups scheduled for today.' },
    { key: 'tomorrow', title: "Tomorrow's Follow-ups", items: dashboard.tomorrow, empty: 'No follow-ups scheduled for tomorrow.' },
    ...(dashboard.overdue?.length > 0
      ? [{ key: 'overdue', title: 'Overdue Follow-ups', items: dashboard.overdue, empty: 'No overdue follow-ups.' }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-10">
      {sections.map((section, index) => (
        <div key={section.key}>
          {index > 0 && <div className="mb-10 h-1 shrink-0 rounded-full bg-border shadow-sm" aria-hidden />}
          <FollowUpTable
            title={section.title}
            items={section.items}
            emptyMessage={section.empty}
            variant={section.key}
            onEdit={onEditLead}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        </div>
      ))}
    </div>
  );
}
