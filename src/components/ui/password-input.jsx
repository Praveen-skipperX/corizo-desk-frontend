import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const PasswordInput = forwardRef(function PasswordInput(
  {
    className,
    inputClassName,
    value,
    onChange,
    placeholder = 'Password',
    disabled,
    id,
    ...props
  },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <Input
        ref={ref}
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn('pr-10', inputClassName)}
        autoComplete={props.autoComplete || 'current-password'}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});

export default PasswordInput;
