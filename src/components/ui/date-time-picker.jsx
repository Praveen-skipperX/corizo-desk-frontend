import { forwardRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-datepicker/dist/react-datepicker.css';

export const PORTAL_ID = 'datepicker-portal';

function ensurePortalRoot(id = PORTAL_ID) {
  if (typeof document === 'undefined') return null;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.setAttribute('data-datepicker-portal', 'true');
    document.body.appendChild(el);
  }
  // Radix modal sets pointer-events:none on body (inherited). Re-enable for the portal.
  el.style.pointerEvents = 'auto';
  el.style.zIndex = '200';
  el.style.position = 'relative';
  return el;
}

export function isInsideDatePicker(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('[data-datepicker-portal]')
    || target.closest(`#${PORTAL_ID}`)
    || target.closest('.react-datepicker-popper')
    || target.closest('.react-datepicker__portal')
    || target.closest('.react-datepicker')
    || target.closest('.corizo-datepicker-popper')
  );
}

const TriggerInput = forwardRef(function TriggerInput(
  { value, onClick, placeholder, disabled, className, id, onBlur, onFocus, onKeyDown },
  ref
) {
  return (
    <button
      type="button"
      id={id}
      ref={ref}
      onClick={onClick}
      onMouseDown={(e) => {
        // Keep focus from jumping back to dialog before the calendar opens.
        e.preventDefault();
      }}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      disabled={disabled}
      className={cn(
        'flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm transition-colors',
        'hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        !value && 'text-muted-foreground',
        className
      )}
    >
      <CalendarClock className="h-4 w-4 shrink-0 text-primary" />
      <span className="flex-1 truncate">{value || placeholder || 'Select date & time'}</span>
    </button>
  );
});

/**
 * Date + time picker that works inside Radix Dialogs.
 * Calendar is portaled to #datepicker-portal with pointer-events restored
 * (Radix modal otherwise blocks clicks on body portals).
 */
export default function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date & time',
  minDate,
  disabled = false,
  className,
  portalId = PORTAL_ID,
}) {
  const selected = value instanceof Date && !Number.isNaN(value.getTime()) ? value : null;

  useEffect(() => {
    ensurePortalRoot(portalId);
  }, [portalId]);

  return (
    <div className={cn('corizo-datetime-picker w-full', className)}>
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect
        timeIntervals={15}
        timeCaption="Time"
        dateFormat="dd MMM yyyy, hh:mm aa"
        placeholderText={placeholder}
        minDate={minDate}
        disabled={disabled}
        customInput={<TriggerInput />}
        shouldCloseOnSelect={false}
        popperPlacement="bottom-start"
        popperClassName="corizo-datepicker-popper"
        calendarClassName="corizo-datepicker-calendar"
        portalId={portalId}
        popperProps={{ strategy: 'fixed' }}
        preventOpenOnFocus
        enableTabLoop={false}
        isClearable
      />
    </div>
  );
}
