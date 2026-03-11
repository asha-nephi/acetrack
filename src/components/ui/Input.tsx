import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', ...props }, ref) => {
        const defaultClasses =
            'w-full bg-surface-muted text-text-main border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-text-muted/60';
        const borderClass = error ? 'border-red-400' : 'border-border';

        return (
            <div className={`flex flex-col gap-1.5 w-full ${className}`}>
                {label && <label className="text-sm font-medium text-text-muted pl-1">{label}</label>}
                <input ref={ref} className={`${defaultClasses} ${borderClass}`} {...props} />
                {error && <span className="text-xs text-red-500 pl-1">{error}</span>}
            </div>
        );
    }
);
Input.displayName = 'Input';
