import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoadingState({
  message = 'Loading...',
  className,
  fullPage = false,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-muted-foreground',
        fullPage ? 'min-h-[50vh]' : 'py-12',
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
