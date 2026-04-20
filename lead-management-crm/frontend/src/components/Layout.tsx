import { LayoutDashboard, PlusCircle, Users } from 'lucide-react';
import React from 'react';

// Simple navigation
interface NavItem {
    icon: React.ElementType;
    label: string;
    view: 'list' | 'add';
}

const navItems: NavItem[] = [
    { icon: Users, label: 'Leads', view: 'list' },
    { icon: PlusCircle, label: 'Add Lead', view: 'add' },
];

export const Layout = ({ currentView, onViewChange, children }: { currentView: string, onViewChange: (v: 'list' | 'add') => void, children: React.ReactNode }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
                <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-white">
                    <LayoutDashboard className="h-6 w-6 text-indigo-600 mr-2" />
                    <span className="font-bold text-lg tracking-tight text-gray-900">AI Sales Doctor</span>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.view}
                            onClick={() => onViewChange(item.view)}
                            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${currentView === item.view
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon className={`h-5 w-5 mr-3 transition-colors ${currentView === item.view ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <div className="text-xs text-center text-gray-400">
                        &copy; 2024 AI Sales Doctor
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-20 flex items-center px-8 justify-between">
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                        {currentView === 'list' ? 'Lead Management' : 'Add New Lead'}
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs ring-2 ring-white shadow-sm">JD</span>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 sm:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
