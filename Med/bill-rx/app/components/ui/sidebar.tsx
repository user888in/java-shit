'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Home, FileText, Settings, Users, ShieldCheck, ChevronLeft, ChevronRight, PieChart, Menu } from 'lucide-react';
import { cn } from '@/app/lib/utils';

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'dashboard';

    const items = [
        { icon: Home, label: 'Dashboard', id: 'dashboard' },
        { icon: FileText, label: 'My Claims', id: 'claims' },
        { icon: Users, label: 'Patients', id: 'patients' },
        { icon: PieChart, label: 'Reports', id: 'reports' },
        { icon: Settings, label: 'Settings', id: 'settings' },
    ];

    const handleNav = (viewId: string) => {
        const params = new URLSearchParams(window.location.search);
        params.set('view', viewId);
        router.push(`/?${params.toString()}`);
        setMobileOpen(false);
    };

    return (
        <>
            {/* Mobile Trigger */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-zinc-200"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                <Menu className="w-5 h-5 text-zinc-600" />
            </button>

            {/* Sidebar Overlay (Mobile) */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside className={cn(
                "fixed md:static inset-y-0 left-0 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 transition-all duration-300 z-50 flex flex-col shadow-2xl",
                collapsed ? "w-20" : "w-64",
                mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {/* Brand */}
                <div className="h-16 flex items-center justify-center border-b border-slate-800 shrink-0 bg-slate-900/50">
                    <div className="flex items-center gap-2 font-bold text-xl text-white">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        {!collapsed && <span className="tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">BillRx</span>}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {items.map((item) => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNav(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-blue-600/10 text-blue-400 font-semibold shadow-sm ring-1 ring-blue-500/20"
                                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
                                {!collapsed && (
                                    <span className="whitespace-nowrap font-medium text-sm">
                                        {item.label}
                                    </span>
                                )}
                                {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-l-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                            </button>
                        );
                    })}
                </div>

                {/* User */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 shrink-0 border border-white/20 shadow-inner" />
                        {!collapsed && (
                            <div className="overflow-hidden text-left">
                                <p className="text-sm font-semibold text-white truncate">Dr. Administrator</p>
                                <p className="text-xs text-slate-400 truncate">Pro License</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 bg-slate-800 border border-slate-700 p-1.5 rounded-full shadow-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all hidden md:flex hover:scale-110"
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            </aside>
        </>
    );
}

