import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { TrendingUp, TrendingDown } from 'lucide-react';

const VARIANTS = {
  default: { iconWrap: 'bg-brand-soft text-primary' },
  open: { iconWrap: 'bg-brand-soft text-primary' },
  closed: { iconWrap: 'bg-emerald-50 text-emerald-600' },
  revenue: { iconWrap: 'bg-brand-soft text-primary' },
  followup: { iconWrap: 'bg-orange-50 text-warm' },
  alert: { iconWrap: 'bg-red-50 text-red-600' },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  tooltip,
  variant = 'default',
  className,
}) {
  const v = VARIANTS[variant] || VARIANTS.default;

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-elevated',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {Icon && (
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', v.iconWrap)}>
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
          )}
          <div className="min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[13px] font-medium text-muted-foreground">{title}</p>
              {tooltip && <InfoTooltip content={tooltip} />}
            </div>
            <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-foreground tabular-nums">
              {value}
            </p>
            {subtitle && (
              <p className="mt-1.5 truncate text-[12px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
              trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            )}
          >
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
