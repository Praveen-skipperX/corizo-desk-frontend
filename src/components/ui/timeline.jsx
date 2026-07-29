import {
  MessageSquare,
  Shield,
  CalendarClock,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  UserPlus,
  RefreshCw,
  IndianRupee,
  Activity,
  Pencil,
  FileText,
  Plus,
  Trash2,
  LogIn,
  LogOut,
  CalendarCheck,
  User,
} from 'lucide-react';
import { formatDateTime, formatStatus, LEAD_STATUSES } from '@/lib/utils';
import { cn } from '@/lib/utils';
import FollowUpCountdown from '@/components/ui/follow-up-countdown';

const SECTION_ICON = {
  creator: { Icon: MessageSquare, bg: 'bg-primary/12 text-primary ring-primary/20' },
  admin: { Icon: Shield, bg: 'bg-secondary/10 text-secondary ring-secondary/20' },
  followup: { Icon: CalendarClock, bg: 'bg-blue-50 text-blue-700 ring-blue-200/70' },
  activity: { Icon: Activity, bg: 'bg-muted text-muted-foreground ring-border' },
};

const ACTIVITY_ICONS = {
  call_initiated: { Icon: Phone, bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70' },
  email_initiated: { Icon: Mail, bg: 'bg-blue-50 text-blue-700 ring-blue-200/70' },
  remark_add: { Icon: MessageSquare, bg: 'bg-primary/12 text-primary ring-primary/20' },
  assign: { Icon: UserPlus, bg: 'bg-violet-50 text-violet-700 ring-violet-200/70' },
  reassign: { Icon: UserPlus, bg: 'bg-violet-50 text-violet-700 ring-violet-200/70' },
  follow_up_create: { Icon: CalendarClock, bg: 'bg-blue-50 text-blue-700 ring-blue-200/70' },
  follow_up_complete: { Icon: CheckCircle2, bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70' },
  status_change: { Icon: RefreshCw, bg: 'bg-amber-50 text-amber-800 ring-amber-200/70' },
  deal_close: { Icon: IndianRupee, bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70' },
  deal_cancel: { Icon: XCircle, bg: 'bg-red-50 text-red-700 ring-red-200/70' },
  imported_from_connector: { Icon: RefreshCw, bg: 'bg-violet-50 text-violet-700 ring-violet-200/70' },
  updated_by_sync: { Icon: RefreshCw, bg: 'bg-sky-50 text-sky-700 ring-sky-200/70' },
  create: { Icon: Plus, bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70' },
  update: { Icon: Pencil, bg: 'bg-muted text-muted-foreground ring-border' },
  delete: { Icon: Trash2, bg: 'bg-red-50 text-red-700 ring-red-200/70' },
  login: { Icon: LogIn, bg: 'bg-muted text-muted-foreground ring-border' },
  logout: { Icon: LogOut, bg: 'bg-muted text-muted-foreground ring-border' },
};

const FOLLOWUP_ROW_ICONS = {
  scheduled: { Icon: CalendarClock, bg: 'bg-blue-50 text-blue-700 ring-blue-200/70' },
  completed: { Icon: CalendarCheck, bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70' },
  overdue: { Icon: AlertTriangle, bg: 'bg-red-50 text-red-600 ring-red-200/70' },
  cancelled: { Icon: XCircle, bg: 'bg-red-50 text-red-600 ring-red-200/70' },
};

function resolveRowIcon(item, section, remarkKind) {
  if (section === 'activity' && item.actionKey) {
    return ACTIVITY_ICONS[item.actionKey] || SECTION_ICON.activity;
  }
  if (section === 'followups' && item.status) {
    const key = item.status.toLowerCase();
    return FOLLOWUP_ROW_ICONS[key] || SECTION_ICON.followup;
  }
  if (section === 'followups') return SECTION_ICON.followup;
  if (section === 'remarks') {
    return remarkKind === 'admin' ? SECTION_ICON.admin : SECTION_ICON.creator;
  }
  return SECTION_ICON.activity;
}

function RowIcon({ item, section, remarkKind }) {
  const { Icon, bg } = resolveRowIcon(item, section, remarkKind);
  return (
    <span
      className={cn(
        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1',
        bg
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

/**
 * @param {'remarks' | 'followups' | 'activity'} section
 * @param {'creator' | 'admin'} remarkKind - only for remarks section
 */
export function Timeline({
  items,
  emptyMessage = 'No records yet',
  renderExtra,
  section = 'remarks',
  remarkKind = 'creator',
}) {
  if (!items?.length) {
    const EmptyIcon = section === 'followups' ? CalendarClock : FileText;
    return (
      <div className="rounded-lg border border-dashed border-border/70 bg-muted/15 px-4 py-10 text-center">
        <EmptyIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" strokeWidth={1.75} />
        <p className="font-sans text-[15px] text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/70 overflow-hidden rounded-lg border border-border/80 bg-card">
      {items.map((item, index) => {
        if (section === 'followups') {
          const isDone = Boolean(
            item.completedAt
            || ['completed', 'cancelled'].includes(String(item.status || '').toLowerCase())
          );

          return (
            <li
              key={item._id || index}
              className="group px-3.5 py-2.5 transition-colors hover:bg-muted/25"
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <p className="font-sans text-[13px] font-semibold tabular-nums text-foreground">
                          {item.scheduledAt ? formatDateTime(item.scheduledAt) : 'No schedule'}
                        </p>
                        {item.scheduledAt && (
                          <FollowUpCountdown date={item.scheduledAt} inactive={isDone} />
                        )}
                      </div>
                      <p className="mt-0.5 font-sans text-[12px] text-muted-foreground">
                        {[
                          item.status ? formatStatus(item.status) : null,
                          item.actor ? `by ${item.actor}` : null,
                        ].filter(Boolean).join(' · ')}
                        {isDone && item.completedAt
                          ? ` · Completed ${formatDateTime(item.completedAt)}`
                          : ''}
                      </p>
                      {item.content && (
                        <p className="mt-1 font-sans text-[13px] leading-snug text-foreground/85">
                          {item.content}
                        </p>
                      )}
                      {item.discussionNotes && (
                        <p className="mt-1.5 rounded-md bg-muted/50 px-2.5 py-1.5 font-sans text-[13px] leading-snug text-foreground">
                          <span className="font-medium text-muted-foreground">Discussion: </span>
                          {item.discussionNotes}
                        </p>
                      )}
                    </div>

                    {item.createdAt && (
                      <time className="shrink-0 whitespace-nowrap pt-0.5 font-sans text-[11px] tabular-nums text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </time>
                    )}
                  </div>
                </div>
              </div>

              {renderExtra?.(item, index)}
            </li>
          );
        }

        return (
          <li
            key={item._id || index}
            className="group px-4 py-3.5 transition-colors hover:bg-muted/25"
          >
            <div className="flex items-start gap-3">
              <RowIcon item={item} section={section} remarkKind={remarkKind} />

              <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  {section === 'activity' && item.action && (
                    <p className="font-sans text-[13px] font-medium text-secondary">
                      {item.action}
                    </p>
                  )}

                  {section === 'activity' && item.actor && (
                    <p className="flex items-center gap-1.5 font-sans text-[12px] font-medium text-secondary">
                      <User className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                      {item.actor}
                    </p>
                  )}

                  {section === 'remarks' && item.statusLabel && (
                    <p className="font-sans text-[12px] font-semibold text-secondary">
                      {item.statusLabel}
                    </p>
                  )}

                  {section === 'remarks' && item.author && (
                    <p className="flex items-center gap-1.5 font-sans text-[12px] font-medium text-secondary">
                      <User className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                      {item.author}
                    </p>
                  )}

                  {item.content ? (
                    <p className="font-sans text-[15px] leading-relaxed text-foreground">
                      {item.content}
                    </p>
                  ) : null}

                  {item.meta && (
                    <p className="flex items-center gap-1.5 font-sans text-[13px] text-muted-foreground">
                      {item.metaIcon === 'edit' && <Pencil className="h-3 w-3 shrink-0" />}
                      {item.metaIcon === 'user' && <User className="h-3 w-3 shrink-0" />}
                      {item.meta}
                    </p>
                  )}
                </div>

                {item.timestamp && (
                  <time className="flex shrink-0 items-center gap-1 whitespace-nowrap pt-0.5 font-sans text-[13px] tabular-nums text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                    {formatDateTime(item.timestamp)}
                  </time>
                )}
              </div>
            </div>

            {renderExtra?.(item, index)}
          </li>
        );
      })}
    </ul>
  );
}

function remarkAuthorLabel(remark, currentUserId) {
  const authorId = (
    remark?.createdBy?._id
    || remark?.createdBy
    || remark?.addedBy?._id
    || remark?.addedBy
    || ''
  ).toString();
  const name = remark?.authorName || remark?.createdBy?.name || remark?.addedBy?.name || 'Unknown';
  if (currentUserId && authorId && authorId === String(currentUserId)) return 'You';
  return name;
}

function labelLeadStatus(value) {
  if (!value) return '';
  return LEAD_STATUSES.find((s) => s.value === value)?.label || formatStatus(value);
}

export function mapCreatorRemarks(remarks, currentUserId) {
  return [...(remarks || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((r) => {
      const author = remarkAuthorLabel(r, currentUserId);
      const edited = r.editHistory?.length
        ? `Edited ${r.editHistory.length} time${r.editHistory.length > 1 ? 's' : ''}`
        : null;
      const from = r.previousStatus ? labelLeadStatus(r.previousStatus) : null;
      const to = r.relatedStatus ? labelLeadStatus(r.relatedStatus) : null;
      const statusLabel = from && to && from !== to
        ? `${from} → ${to}`
        : (to || from || null);
      return {
        _id: r._id,
        content: r.content,
        author,
        statusLabel,
        relatedStatus: r.relatedStatus || null,
        timestamp: r.updatedAt || r.createdAt,
        meta: edited,
        metaIcon: edited ? 'edit' : null,
      };
    });
}

export function mapAdminRemarks(remarks, currentUserId) {
  return [...(remarks || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((r) => ({
      _id: r._id,
      content: r.content,
      author: remarkAuthorLabel(r, currentUserId),
      timestamp: r.createdAt,
    }));
}

export function mapFollowUps(followUps, currentUserId) {
  const now = Date.now();
  return [...(followUps || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((f) => {
      const discussion = f.discussionNotes || null;
      const schedulerId = (f.scheduledBy?._id || f.scheduledBy || '').toString();
      const schedulerName = f.scheduledBy?.name || 'Unknown';
      const actor = currentUserId && schedulerId && schedulerId === String(currentUserId)
        ? 'You'
        : schedulerName;
      const completedByName = f.completedBy?.name
        || (currentUserId && String(f.completedBy?._id || f.completedBy) === String(currentUserId) ? 'You' : null);
      const scheduledAt = f.scheduledDate || null;
      const isDue = Boolean(scheduledAt && new Date(scheduledAt).getTime() <= now);
      const hasDiscussion = Boolean(discussion || (f.completedAt && f.completionNotes));

      return {
        _id: f._id,
        status: f.status,
        content: f.notes && !discussion ? f.notes : null,
        discussionNotes: discussion || (f.completedAt ? f.completionNotes : null) || null,
        scheduledAt,
        createdAt: f.createdAt || null,
        completedAt: f.completedAt || null,
        completedByName: f.completedAt ? completedByName : null,
        actor,
        isDue,
        canDiscuss: isDue && !hasDiscussion,
      };
    });
}

function labelField(key) {
  const map = {
    status: 'status',
    priority: 'priority',
    assignedTo: 'assignee',
    name: 'name',
    email: 'email',
    phone: 'phone',
    course: 'course',
    source: 'source',
    leadDate: 'date',
    address: 'address',
    notes: 'notes',
    customFields: 'custom fields',
  };
  return map[key] || formatStatus(key);
}

function summarizeFieldChange(key, prev, next) {
  if (key === 'status') {
    const from = labelLeadStatus(prev);
    const to = labelLeadStatus(next);
    if (from && to) return `${from} → ${to}`;
    return to || from || null;
  }
  if (key === 'priority') {
    const from = formatStatus(prev);
    const to = formatStatus(next);
    if (from && to && from !== to) return `${from} → ${to}`;
    return to || null;
  }
  if (key === 'assignedTo') {
    return null; // shown via assign/reassign actions
  }
  if (next == null || next === '') return `${labelField(key)} cleared`;
  if (typeof next === 'object') return labelField(key);
  const to = String(next);
  if (prev != null && String(prev) && String(prev) !== to) {
    return `${labelField(key)}: ${String(prev)} → ${to}`;
  }
  return `${labelField(key)}: ${to}`;
}

function describeLeadActivity(a) {
  const who = a.userName || a.user?.name || null;
  const prev = a.previousValues || {};
  const next = a.updatedValues || {};
  const meta = a.metadata || {};

  switch (a.action) {
    case 'status_change': {
      const from = labelLeadStatus(prev.status || meta.from);
      const to = labelLeadStatus(next.status || meta.to);
      return {
        title: 'Status changed',
        detail: from && to ? `${from} → ${to}` : (meta.description || null),
        actor: who,
      };
    }
    case 'update': {
      const skip = new Set(['dealAmount', 'dealNotes', 'closureDate', 'adminRemark', '_id', '__v']);
      const keys = Object.keys(next).filter((k) => !skip.has(k) && next[k] !== undefined);
      // Prefer non-status details when a separate status_change event exists; still show status if that's all we have.
      const preferred = keys.filter((k) => k !== 'status');
      const useKeys = preferred.length ? preferred : keys;
      const parts = useKeys
        .map((k) => summarizeFieldChange(k, prev[k], next[k]))
        .filter(Boolean)
        .slice(0, 4);
      return {
        title: 'Updated',
        detail: parts.length ? parts.join(' · ') : (meta.description || 'Lead details updated'),
        actor: who,
      };
    }
    case 'create':
      return { title: 'Lead created', detail: meta.leadId ? `ID ${meta.leadId}` : null, actor: who };
    case 'assign':
      return {
        title: 'Assigned',
        detail: meta.newAssigneeName || meta.assigneeName
          ? `to ${meta.newAssigneeName || meta.assigneeName}`
          : (meta.description || null),
        actor: who,
      };
    case 'reassign':
      return {
        title: 'Reassigned',
        detail: meta.newAssigneeName || meta.assigneeName
          ? `to ${meta.newAssigneeName || meta.assigneeName}`
          : (meta.description || null),
        actor: who,
      };
    case 'follow_up_create':
      return { title: 'Follow-up scheduled', detail: meta.description || null, actor: who };
    case 'follow_up_complete':
      return { title: 'Follow-up completed', detail: meta.description || null, actor: who };
    case 'deal_close':
      return {
        title: 'Deal closed',
        detail: next.amount != null ? `Amount ${next.amount}` : (meta.description || null),
        actor: who,
      };
    case 'deal_cancel':
      return { title: 'Deal cancelled', detail: meta.reason || meta.description || null, actor: who };
    case 'call_initiated':
      return { title: 'Call initiated', detail: meta.description || null, actor: who };
    case 'email_initiated':
      return { title: 'Email initiated', detail: meta.description || null, actor: who };
    case 'delete':
      return { title: 'Lead deleted', detail: meta.leadId ? `ID ${meta.leadId}` : null, actor: who };
    case 'remark_add':
      return { title: 'Remark added', detail: meta.type === 'admin' ? 'Admin remark' : null, actor: who };
    default:
      return {
        title: formatStatus(a.action),
        detail: meta.description || null,
        actor: who,
      };
  }
}

export function mapActivities(activities) {
  return activities?.map((a) => {
    const described = describeLeadActivity(a);
    return {
      _id: a._id,
      actionKey: a.action,
      action: described.title,
      content: described.detail,
      actor: described.actor,
      timestamp: a.createdAt,
    };
  });
}

export function mapTimelineEvents(events) {
  return events?.map((e) => ({
    _id: e._id,
    actionKey: e.type,
    action: e.title || formatStatus(e.type),
    content: e.description || null,
    actor: e.actorName || null,
    timestamp: e.createdAt,
  }));
}

export function mergeActivityTimeline(activities, timelineEvents) {
  const mapped = [
    ...mapActivities(activities || []),
    ...mapTimelineEvents(timelineEvents || []),
  ];
  const seen = new Set();
  return mapped
    .filter((item) => {
      const key = item._id || `${item.actionKey}-${item.timestamp}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
