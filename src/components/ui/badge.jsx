import { cn, PRIORITY_COLORS, STATUS_COLORS, formatStatus, PRIORITY_CONFIG, LEAD_STATUSES } from '@/lib/utils';
import { PriorityIndicator } from '@/components/ui/priority-indicator';

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-primary/10 text-primary',
    priority: PRIORITY_COLORS[children] || 'bg-gray-100 text-gray-800',
    status: STATUS_COLORS[children] || 'bg-gray-100 text-gray-800',
    destructive: 'bg-destructive/10 text-destructive',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  const statusLabel = LEAD_STATUSES.find((s) => s.value === children)?.label;
  const label = variant === 'status' ? (statusLabel || formatStatus(children)) : children;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        variants[variant],
        className
      )}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority, showLabel = true }) {
  return <PriorityIndicator priority={priority} showLabel={showLabel} size="sm" />;
}

export function StatusBadge({ status }) {
  return <Badge variant="status">{status}</Badge>;
}
