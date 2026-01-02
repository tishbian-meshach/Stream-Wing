import React from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    loading?: boolean;
    icon?: React.ReactNode;
}

export function Button({
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:pointer-events-none active:scale-95';

    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500',
        secondary: 'bg-neutral-700 text-white hover:bg-neutral-600 focus:ring-neutral-500',
        ghost: 'bg-transparent text-gray-300 hover:bg-neutral-800 focus:ring-neutral-500',
        danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
        md: 'px-4 py-2.5 text-base rounded-lg gap-2',
        lg: 'px-6 py-3.5 text-lg rounded-xl gap-2.5',
        icon: 'p-3 rounded-full',
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ) : (
                <>
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
}
