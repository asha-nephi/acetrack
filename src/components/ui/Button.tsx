import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    fullWidth?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    fullWidth = false,
    className = '',
    ...props
}: ButtonProps) {
    const baseClasses =
        'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
    const sizeClasses = 'py-3.5 px-6 text-[15px]';

    const variants = {
        primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20',
        secondary: 'bg-surface-muted hover:bg-gray-100 text-text-main border border-border',
        danger: 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20',
        ghost: 'hover:bg-primary-50 text-primary-600',
    };

    return (
        <button
            className={`${baseClasses} ${sizeClasses} ${variants[variant]} ${fullWidth ? 'w-full' : ''
                } ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
