import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isInsideDatePicker } from '@/components/ui/date-time-picker';

export function Dialog({ ...props }) {
  return <DialogPrimitive.Root {...props} />;
}

export function DialogTrigger({ ...props }) {
  return <DialogPrimitive.Trigger {...props} />;
}

export function DialogPortal({ ...props }) {
  return <DialogPrimitive.Portal {...props} />;
}

export function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  );
}

function preventDismissForDatePicker(event) {
  const target =
    event.detail?.originalEvent?.target
    ?? event.detail?.originalEvent?.composedPath?.()?.[0]
    ?? event.target;
  if (isInsideDatePicker(target)) {
    event.preventDefault();
  }
}

export function DialogContent({
  className,
  children,
  showClose = true,
  onPointerDownOutside,
  onInteractOutside,
  onFocusOutside,
  ...props
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        {...props}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 flex max-h-[95vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-background shadow-2xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'sm:max-h-[90vh] md:max-w-4xl',
          'max-sm:inset-0 max-sm:h-full max-sm:max-h-full max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none',
          className
        )}
        onPointerDownOutside={(event) => {
          preventDismissForDatePicker(event);
          onPointerDownOutside?.(event);
        }}
        onInteractOutside={(event) => {
          preventDismissForDatePicker(event);
          onInteractOutside?.(event);
        }}
        onFocusOutside={(event) => {
          preventDismissForDatePicker(event);
          onFocusOutside?.(event);
        }}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }) {
  return (
    <div className={cn('shrink-0 border-b px-4 py-4 pr-12 sm:px-5 md:px-6', className)} {...props} />
  );
}

export function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold text-secondary sm:text-xl', className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      className={cn('mt-1 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function DialogBody({ className, ...props }) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-4 py-4 sm:px-5 md:px-6', className)} {...props} />
  );
}

export function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        'sticky bottom-0 flex shrink-0 flex-col-reverse gap-2 border-t bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 md:px-6',
        className
      )}
      {...props}
    />
  );
}
