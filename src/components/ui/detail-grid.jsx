import { cn } from '@/lib/utils';

/** Single label : value pair — inline, compact */
export function KeyValue({ label, value, children, className }) {
  return (
    <div className={cn('flex min-w-0 items-baseline gap-1.5 text-sm', className)}>
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="shrink-0 text-muted-foreground/50">:</span>
      <span className="min-w-0 truncate font-medium text-foreground">
        {children ?? value ?? '—'}
      </span>
    </div>
  );
}

/** Two key-value pairs side by side on one row (desktop) */
export function PairedDetailRows({ rows, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2"
        >
          <KeyValue {...row.left} />
          {row.right ? <KeyValue {...row.right} /> : <span className="hidden sm:block" />}
        </div>
      ))}
    </div>
  );
}

/** Left / right column split inside a card */
export function SplitDetailPanel({ left, right, className }) {
  return (
    <div className={cn('grid gap-x-8 gap-y-3 sm:grid-cols-2', className)}>
      <div className="space-y-1.5">{left}</div>
      <div className="space-y-1.5">{right}</div>
    </div>
  );
}

/** Responsive detail grid: 1 col mobile, 2 tablet, 3 desktop */
export function DetailGrid({ children, columns = 2, className }) {
  const colClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
  }[columns] || 'sm:grid-cols-2';

  return (
    <div className={cn('grid grid-cols-1 gap-x-6 gap-y-1.5', colClass, className)}>
      {children}
    </div>
  );
}

/** Card footer strip for actions */
export function CardActionFooter({ children, className }) {
  return (
    <div className={cn('mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2', className)}>
      {children}
    </div>
  );
}
