import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

const OTP_LENGTH = 6;

export default function OtpInput({
  value = '',
  onChange,
  onComplete,
  error = false,
  disabled = false,
  autoFocus = true,
  id = 'otp-input',
}) {
  const inputsRef = useRef([]);

  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || '');

  const focusInput = (index) => {
    if (index >= 0 && index < OTP_LENGTH) {
      inputsRef.current[index]?.focus();
      inputsRef.current[index]?.select();
    }
  };

  const updateValue = useCallback(
    (nextDigits) => {
      const otp = nextDigits.join('').slice(0, OTP_LENGTH);
      onChange?.(otp);
      if (!disabled && otp.length === OTP_LENGTH && /^\d{6}$/.test(otp)) {
        onComplete?.(otp);
      }
    },
    [onChange, onComplete, disabled]
  );

  useEffect(() => {
    if (autoFocus && !disabled) {
      focusInput(0);
    }
  }, [autoFocus, disabled]);

  const handleChange = (index, raw) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    updateValue(next);
    if (digit && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (digits[index]) {
        next[index] = '';
        updateValue(next);
      } else if (index > 0) {
        next[index - 1] = '';
        updateValue(next);
        focusInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] || '');
    updateValue(next);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  return (
    <div
      role="group"
      aria-label="One-time password"
      className="flex justify-center gap-2 sm:gap-3"
      id={id}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputsRef.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          aria-invalid={error || undefined}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-12 w-10 rounded-lg border-2 bg-background text-center text-xl font-semibold tabular-nums',
            'transition-all duration-150 sm:h-14 sm:w-12 sm:text-2xl',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            disabled && 'cursor-not-allowed opacity-50',
            error
              ? 'border-destructive focus:border-destructive focus:ring-destructive/30'
              : digit
                ? 'border-primary/60 bg-primary/5 focus:border-primary focus:ring-primary/40'
                : 'border-input focus:border-primary focus:ring-primary/40'
          )}
        />
      ))}
    </div>
  );
}

export { OTP_LENGTH };
