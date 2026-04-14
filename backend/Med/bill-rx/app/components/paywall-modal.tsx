'use client';

import { GlassCard } from './ui/glass-card';
import { Button } from './ui/button';
import { ShieldCheck, Lock, Check } from 'lucide-react';

interface PaywallModalProps {
    issueCount: number;
    potentialSavings: number;
    onPay: () => void;
}

export function PaywallModal({ issueCount, potentialSavings, onPay }: PaywallModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <GlassCard className="w-full max-w-md p-8 relative overflow-hidden border-2 border-primary/20">

                {/* Glow effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />

                <div className="relative z-10 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                        <Lock className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-zinc-900">Unlock Your Report</h2>
                        <p className="text-zinc-500">
                            We found <strong className="text-red-500">{issueCount} potential errors</strong> in your bill.
                            <br />
                            Unlock the full audit to see details and generate your dispute letter.
                        </p>
                    </div>

                    <div className="py-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <p className="text-sm text-zinc-500 uppercase tracking-widest font-semibold mb-1">Potential Savings</p>
                        <p className="text-4xl font-black text-green-600 tracking-tight">
                            ${potentialSavings.toFixed(0)}
                        </p>
                    </div>

                    <ul className="text-left space-y-3 text-sm text-zinc-600 pl-4">
                        <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" /> Full Line-by-Line Audit
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" /> Plain-English Explanations
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" /> Auto-Generated Dispute Letter
                        </li>
                    </ul>

                    <Button
                        size="lg"
                        className="w-full text-lg font-semibold h-12 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                        onClick={onPay}
                    >
                        Unlock for $29 (Stripe Secure)
                    </Button>

                    <p className="text-xs text-zinc-400">
                        One-time payment. 100% Money-back guarantee if we don't find valid issues.
                    </p>
                </div>
            </GlassCard>
        </div>
    );
}
