import React from 'react';
import { cn } from '../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export function Input({
    className,
    label,
    error,
    icon,
    id,
    ...props
}: InputProps) {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        {icon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={cn(
                        'block w-full rounded-xl border-0 bg-neutral-800 text-white shadow-sm',
                        'ring-1 ring-inset ring-neutral-700',
                        'placeholder:text-gray-500',
                        'focus:ring-2 focus:ring-inset focus:ring-indigo-500',
                        'transition-all duration-200',
                        'text-base py-3.5',
                        icon ? 'pl-10 pr-4' : 'px-4',
                        error && 'ring-red-500 focus:ring-red-500',
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-red-400">{error}</p>
            )}
        </div>
    );
}
