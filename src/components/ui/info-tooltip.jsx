import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

export function InfoTooltip({ content, className }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className={cn('inline-flex text-muted-foreground hover:text-foreground', className)}>
          <Info className="h-4 w-4" />
          <span className="sr-only">More info</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm text-left leading-relaxed">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

export function FeatureTooltip({ label, description, children }) {
  return (
    <div className="flex items-center gap-1.5">
      {children || <span>{label}</span>}
      <InfoTooltip content={description} />
    </div>
  );
}
