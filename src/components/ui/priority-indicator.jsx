import { cn, PRIORITY_CONFIG } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const SIZE_CLASSES = {
  xs: 'h-2.5 w-2.5',
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

export function PriorityIndicator({ priority = 'yellow', showLabel = false, size = 'md', className }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.yellow;

  const indicator = (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn('shrink-0 rounded-full ring-2 ring-white dark:ring-card', SIZE_CLASSES[size])}
        style={{ backgroundColor: config.color }}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-sm font-medium" style={{ color: config.softText }}>
          {config.label}
        </span>
      )}
    </span>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-default" role="img" aria-label={config.label}>
          {indicator}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[240px] border px-3 py-2 shadow-elevated"
        style={{
          backgroundColor: config.color,
          borderColor: config.border,
          color: '#fff',
        }}
      >
        <p className="text-[12px] font-semibold leading-tight text-white">{config.label}</p>
        <p className="mt-1 text-[11px] leading-snug text-white/90">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function PrioritySelector({ value, onChange, className }) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="radiogroup" aria-label="Priority">
      {Object.entries(PRIORITY_CONFIG).map(([key, config]) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all',
              !selected && 'border-input bg-background hover:bg-muted/50'
            )}
            style={
              selected
                ? {
                    borderColor: config.color,
                    backgroundColor: config.softBg,
                    color: config.softText,
                    boxShadow: `0 0 0 2px ${config.color}33`,
                  }
                : undefined
            }
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
