import { useEffect, useState } from 'react';
import { cn, formatCountdownLabel } from '@/lib/utils';

/**
 * Compact live countdown — plain text, no badge chrome.
 */
export default function FollowUpCountdown({
  date,
  inactive = false,
  className,
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (inactive || !date) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [date, inactive]);

  if (inactive || !date) return null;

  const info = formatCountdownLabel(date, now);
  if (!info) return null;

  return (
    <span
      className={cn(
        'font-sans text-[12px] tabular-nums',
        info.overdue ? 'font-medium text-destructive' : 'text-muted-foreground',
        className
      )}
      title={info.text}
    >
      {info.text}
    </span>
  );
}
