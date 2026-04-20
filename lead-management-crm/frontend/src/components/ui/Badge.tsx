import clsx from 'clsx';
import { type ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
}

export const Badge = ({ children, variant = 'default' }: BadgeProps) => {
    const variants = {
        default: "bg-gray-100 text-gray-800",
        success: "bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20",
        warning: "bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20",
        destructive: "bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/10",
        outline: "text-gray-600 ring-1 ring-inset ring-gray-200",
    };

    return (
        <span className={clsx("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10", variants[variant])}>
            {children}
        </span>
    );
};
