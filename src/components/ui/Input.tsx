import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            'input',
            error && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-error-600" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };