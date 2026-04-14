'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from '../ui/glass-card';

const data = [
    { name: 'Jan', savings: 400 },
    { name: 'Feb', savings: 300 },
    { name: 'Mar', savings: 600 },
    { name: 'Apr', savings: 800 },
    { name: 'May', savings: 500 },
    { name: 'Jun', savings: 900 },
    { name: 'Jul', savings: 1200 },
];

export function SavingsChart() {
    return (
        <GlassCard className="p-6 col-span-1 md:col-span-2 lg:col-span-2 h-[400px] flex flex-col">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-zinc-900">Savings Trend</h3>
                <p className="text-sm text-zinc-500">Cumulative measurement of detected errors.</p>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#1E293B', fontWeight: 600 }}
                            formatter={(value) => [`$${value}`, 'Savings']}
                        />
                        <Area
                            type="monotone"
                            dataKey="savings"
                            stroke="#2563EB"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorSavings)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
