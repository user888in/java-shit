'use client';

import { GlassCard } from "./ui/glass-card";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar } from "lucide-react";
import { Button } from "./ui/button";

const savingsData = [
    { name: 'Jan', savings: 400 },
    { name: 'Feb', savings: 300 },
    { name: 'Mar', savings: 600 },
    { name: 'Apr', savings: 800 },
    { name: 'May', savings: 500 },
    { name: 'Jun', savings: 900 },
    { name: 'Jul', savings: 1200 },
];

const providerData = [
    { name: 'Gen. Hospital', amount: 12500 },
    { name: 'City Clinic', amount: 4500 },
    { name: 'Quest Labs', amount: 2100 },
    { name: 'Valley Imaging', amount: 3200 },
];

const errorData = [
    { name: 'Upcoding', value: 45 },
    { name: 'Unbundling', value: 25 },
    { name: 'Duplicate', value: 20 },
    { name: 'Other', value: 10 },
];

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'];

export function ReportsView() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Analytics & Reports</h2>
                    <p className="text-slate-400">Deep dive into your medical spending and savings.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"><Calendar className="w-4 h-4" /> This Year</Button>
                    <Button variant="outline" className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"><Download className="w-4 h-4" /> Export PDF</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Savings Trend */}
                <GlassCard className="p-6 h-[400px] lg:col-span-2 flex flex-col bg-slate-900/40 border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6">Cumulative Savings</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={savingsData}>
                                <defs>
                                    <linearGradient id="colorSavingsReport" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)', color: '#fff' }}
                                    formatter={(value) => [`$${value}`, 'Savings']}
                                    labelStyle={{ color: '#94a3b8' }}
                                />
                                <Area type="monotone" dataKey="savings" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorSavingsReport)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Spend by Provider */}
                <GlassCard className="p-6 h-[350px] flex flex-col bg-slate-900/40 border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6">Spending by Provider</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={providerData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={100} />
                                <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#fff' }} />
                                <Bar dataKey="amount" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Error Distribution */}
                <GlassCard className="p-6 h-[350px] flex flex-col bg-slate-900/40 border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6">Error Types Detected</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={errorData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {errorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip itemStyle={{ color: '#fff' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-4">
                            {errorData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-400">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    {entry.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
