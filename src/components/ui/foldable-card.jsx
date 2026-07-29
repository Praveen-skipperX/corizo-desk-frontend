import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Card section with a clickable header that expands/collapses the body.
 */
export default function FoldableCard({
  title,
  icon: Icon,
  badge,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  className,
  headerClassName,
  contentClassName,
  children,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const toggle = () => {
    const next = !open;
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className={cn('py-0', headerClassName)}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex w-full items-center gap-2 py-3.5 text-left transition-colors hover:bg-muted/40"
        >
          <CardTitle className="flex min-w-0 flex-1 items-center gap-2 font-sans text-[15px] font-semibold tracking-tight text-secondary">
            {Icon && <Icon className="h-4 w-4 shrink-0 text-primary" />}
            <span className="truncate">{title}</span>
            {badge}
          </CardTitle>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>
      </CardHeader>
      {open && (
        <CardContent className={cn('pt-4', contentClassName)}>
          {children}
        </CardContent>
      )}
    </Card>
  );
}
