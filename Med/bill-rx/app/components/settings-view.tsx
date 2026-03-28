import { GlassCard } from "./ui/glass-card";
import { Button } from "./ui/button";
import { User, Bell, Lock, CreditCard } from "lucide-react";

export function SettingsView() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Settings</h2>
                    <p className="text-slate-400">Manage your account preferences and subscription.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white">Save Changes</Button>
            </div>

            <div className="grid gap-6">
                {/* Profile Section */}
                <GlassCard className="p-6 bg-slate-900/40 border-white/5">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                            <User className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Profile Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Full Name</label>
                            <input type="text" defaultValue="Dr. Administrator" className="w-full px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800/50 text-white placeholder-slate-500" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Email Address</label>
                            <input type="email" defaultValue="admin@billrx.com" className="w-full px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800/50 text-white placeholder-slate-500" />
                        </div>
                    </div>
                </GlassCard>

                {/* Notifications */}
                <GlassCard className="p-6 bg-slate-900/40 border-white/5">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
                            <Bell className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Notifications</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="font-medium text-white">Email Alerts</p>
                                <p className="text-sm text-slate-400">Receive analysis reports via email.</p>
                            </div>
                            <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer ring-1 ring-blue-500/50">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-2 border-t border-slate-800">
                            <div>
                                <p className="font-medium text-white">Dispute Updates</p>
                                <p className="text-sm text-slate-400">Get notified when a dispute status changes.</p>
                            </div>
                            <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer ring-1 ring-blue-500/50">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Subscription */}
                <GlassCard className="p-6 border-blue-500/20 bg-blue-600/5">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Subscription</h3>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-white">BillRx Pro Plan</p>
                            <p className="text-sm text-slate-400">Next billing date: Feb 15, 2026</p>
                        </div>
                        <Button variant="outline" className="text-blue-400 border-blue-500/20 hover:bg-blue-600/10 hover:text-blue-300">Manage Billing</Button>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
