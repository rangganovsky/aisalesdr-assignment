import { type ReactNode } from 'react';

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => {
    return (
        <div className={`bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl ${className || ''}`}>
            {children}
        </div>
    );
};
