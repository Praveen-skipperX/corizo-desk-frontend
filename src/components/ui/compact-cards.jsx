import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  ChevronRight,
  Phone,
  Sun,
  CalendarDays,
  UserRound,
} from 'lucide-react';
import { cn, formatDateTime, formatLeadGettingDate } from '@/lib/utils';
import { ENABLE_DEPARTMENTS } from '@/lib/features';
import { KeyValue, PairedDetailRows, CardActionFooter } from '@/components/ui/detail-grid';
import { StatusBadge } from '@/components/ui/badge';
import { PriorityIndicator } from '@/components/ui/priority-indicator';
import { Button } from '@/components/ui/button';
import { KeyRound, Pencil } from 'lucide-react';

export function LeadSummaryCard({ lead, onEdit, className, showActions = true, showAssignedTo = true }) {
  return (
    <div className={cn('rounded-lg border bg-card p-3 shadow-sm', className)}>
      <PairedDetailRows
        rows={[
          { left: { label: 'Name', value: lead.name }, right: { label: 'Priority', children: <PriorityIndicator priority={lead.priority} size="md" /> } },
          { left: { label: 'Phone', value: lead.phone }, right: { label: 'Status', children: <StatusBadge status={lead.status} /> } },
          ...(showAssignedTo
            ? [{ left: { label: 'Email', value: lead.email || '—' }, right: { label: 'Assigned Counselor', value: lead.assignedTo?.name || '—' } }]
            : [{ left: { label: 'Email', value: lead.email || '—' }, right: null }]),
          ...(ENABLE_DEPARTMENTS
            ? [{ left: { label: 'Department', value: lead.department?.name || '—' }, right: null }]
            : []),
          ...(lead.nextFollowUpDate
            ? [{ left: { label: 'Follow-up', value: formatDateTime(lead.nextFollowUpDate) }, right: { label: 'Date', value: formatLeadGettingDate(lead) } }]
            : [{ left: { label: 'Date', value: formatLeadGettingDate(lead) }, right: null }]),
        ]}
      />
      {showActions && (
        <CardActionFooter>
          <Link to={`/leads/${lead._id}`} className="text-xs font-medium text-primary hover:underline">
            View details
          </Link>
          {onEdit && (
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEdit(lead)}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </Button>
          )}
        </CardActionFooter>
      )}
    </div>
  );
}

const FOLLOWUP_VARIANT = {
  overdue: {
    Icon: AlertTriangle,
    accent: 'border-l-red-500',
    iconWrap: 'bg-red-100 text-red-700',
    hover: 'hover:border-red-300 hover:shadow-md',
  },
  today: {
    Icon: Sun,
    accent: 'border-l-primary',
    iconWrap: 'bg-primary/20 text-amber-900',
    hover: 'hover:border-primary/40 hover:shadow-md',
  },
  tomorrow: {
    Icon: CalendarDays,
    accent: 'border-l-blue-500',
    iconWrap: 'bg-blue-100 text-blue-800',
    hover: 'hover:border-blue-300 hover:shadow-md',
  },
};

function MetaChip({ icon: Icon, children, className }) {
  return (
    <span className={cn('inline-flex max-w-[160px] items-center gap-1 truncate text-[13px] text-muted-foreground', className)}>
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-75" />
      <span className="truncate">{children}</span>
    </span>
  );
}

export function FollowUpItemCard({ lead, variant, actions, asLink = false }) {
  const cfg = FOLLOWUP_VARIANT[variant] || FOLLOWUP_VARIANT.today;
  const { Icon } = cfg;

  const content = (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', cfg.iconWrap)}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 sm:flex-nowrap sm:gap-x-3">
        <div className="flex min-w-[120px] max-w-[200px] items-center gap-1.5">
          <UserRound className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block" />
          <div className="min-w-0">
            <p className="truncate font-sans text-[14px] font-semibold text-secondary">{lead.name}</p>
            <p className="truncate font-sans text-[11px] text-muted-foreground">{formatLeadGettingDate(lead)}</p>
          </div>
        </div>

        <span className="hidden h-4 w-px shrink-0 bg-border sm:block" />

        {lead.phone && (
          <MetaChip icon={Phone} className="hidden md:inline-flex">{lead.phone}</MetaChip>
        )}

        <MetaChip icon={CalendarClock} className="font-medium text-foreground">
          {formatDateTime(lead.nextFollowUpDate)}
        </MetaChip>

        {ENABLE_DEPARTMENTS && lead.department?.name && (
          <MetaChip icon={Building2} className="hidden lg:inline-flex">{lead.department.name}</MetaChip>
        )}

        {variant === 'overdue' && (
          <StatusBadge status={lead.status} />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <PriorityIndicator priority={lead.priority} size="sm" />
        {actions}
        {asLink && <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />}
      </div>
    </div>
  );

  const cardClass = cn(
    'block rounded-md border border-border/80 border-l-[3px] bg-white px-2.5 py-2 shadow-sm transition-all',
    cfg.accent,
    cfg.hover
  );

  if (asLink) {
    return (
      <Link to={`/leads/${lead._id}`} className={cardClass}>
        {content}
      </Link>
    );
  }

  return <div className={cardClass}>{content}</div>;
}

export function UserItemCard({ user, roleLabel, onEdit, onResetPassword, onToggleActive, onUnlock, onDelete, isActive, isLocked }) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <PairedDetailRows
        rows={[
          { left: { label: 'Name', value: user.name }, right: { label: 'Role', value: roleLabel } },
          { left: { label: 'Email', value: user.email }, right: ENABLE_DEPARTMENTS ? { label: 'Department', value: user.department?.name || '—' } : null },
          { left: { label: 'Status', value: isActive ? 'Active' : 'Inactive' }, right: isLocked ? { label: 'Locked', value: 'Yes' } : null },
        ]}
      />
      <CardActionFooter>
        {onEdit && <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onEdit}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>}
        {onResetPassword && <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onResetPassword}><KeyRound className="mr-1 h-3.5 w-3.5" /> Reset</Button>}
        {onToggleActive && <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onToggleActive}>{isActive ? 'Deactivate' : 'Activate'}</Button>}
        {onUnlock && <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onUnlock}>Unlock</Button>}
        {onDelete && <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={onDelete}>Delete</Button>}
      </CardActionFooter>
    </div>
  );
}
