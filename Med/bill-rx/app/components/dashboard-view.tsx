'use client';

import { useEffect, useState } from 'react';
import { Bill, Issue } from '@/app/types';
import { GlassCard } from './ui/glass-card';
import { Button } from './ui/button';
import { cn } from '@/app/lib/utils';
import { SavingsChart } from './analysis/savings-chart';
import { Trash2, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { DatabaseService } from '@/app/lib/db/database-service';

interface DashboardViewProps {
    onOpenBill: (billId: string) => void;
    onNewscan: () => void;
}

export function DashboardView({ onOpenBill, onNewscan }: DashboardViewProps) {
    const [history, setHistory] = useState<{ bill: Bill, issues: Issue[] }[]>([]);
    const [totalSaved, setTotalSaved] = useState(0);

    useEffect(() => {
        // Load from Database (or LocalStorage fallback)
        const db = new DatabaseService();
        db.getHistory().then(parsed => {
            if (!Array.isArray(parsed)) {
                console.error("Invalid history data:", parsed);
                setHistory([]);
                return;
            }
            setHistory(parsed);

            // Calculate potential savings
            const savings = parsed.reduce((acc: number, item: { issues: Issue[] }) => {
                return acc + item.issues.reduce((s: number, i) => s + (i.savingsPotential || 0), 0);
            }, 0);
            setTotalSaved(savings);
        });
    }, []);

    const clearHistory = () => {
        localStorage.removeItem('billrx_history'); // Force clear local
        setHistory([]);
        setTotalSaved(0);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        Overview
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Welcome back, Dr. Administrator</p>
                </div>
                <Button onClick={onNewscan} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 border border-blue-400/20">
                    New Scan
                </Button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Chart takes 2 columns */}
                <SavingsChart />

                {/* Stats Cards */}
                <GlassCard className="p-6 flex flex-col justify-between h-[180px] bg-slate-900/40 border-white/5">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-400">Total Savings</p>
                            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20"><TrendingUp className="w-4 h-4" /></span>
                        </div>
                        <p className="text-4xl font-black text-white tracking-tight">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalSaved)}
                        </p>
                    </div>
                    <div className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 w-fit px-2 py-1 rounded border border-emerald-500/20">
                        +12% from last month
                    </div>
                </GlassCard>

                <GlassCard className="p-6 flex flex-col justify-between h-[180px] bg-slate-900/40 border-white/5">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-400">Bills Processed</p>
                            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20"><FileText className="w-4 h-4" /></span>
                        </div>
                        <p className="text-4xl font-black text-white tracking-tight">{history.length}</p>
                    </div>
                    <div className="flex items-center text-xs font-medium text-blue-400 bg-blue-500/10 w-fit px-2 py-1 rounded border border-blue-500/20">
                        1 pending review
                    </div>
                </GlassCard>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-xl font-semibold text-white">Recent Uploads</h3>
                    {history.length > 0 && (
                        <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300 flex items-center transition-colors">
                            <Trash2 className="w-3 h-3 mr-1" /> Clear History
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                        <p>No bills analyzed yet.</p>
                        <Button variant="link" onClick={onNewscan} className="text-blue-400">Start your first scan</Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((item) => (
                            <GlassCard
                                key={item.bill.id}
                                className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-blue-500/30 hover:bg-slate-800/40 transition-all cursor-pointer group"
                                onClick={() => onOpenBill(item.bill.id)}
                            >
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-blue-900/20 transition-colors">
                                        <FileText className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-white group-hover:text-blue-200 transition-colors">{item.bill.providerName || 'Unknown Provider'}</p>
                                        <p className="text-xs text-slate-500">{new Date(item.bill.uploadDate).toLocaleDateString()} • {item.bill.fileName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className={cn("w-4 h-4", item.issues.length > 0 ? "text-amber-500" : "text-emerald-500")} />
                                        <span className={cn("text-sm font-medium", item.issues.length > 0 ? "text-amber-400" : "text-emerald-400")}>
                                            {item.issues.length} Issues
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-white text-lg">
                                            {item.bill.totalBilled ? `$${item.bill.totalBilled.toFixed(2)}` : '--'}
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
