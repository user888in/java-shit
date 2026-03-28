import { GlassCard } from "./ui/glass-card";
import { Construction } from "lucide-react";

export function PlaceholderView({ title }: { title: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4 animate-in fade-in duration-500">
            <GlassCard className="p-12 flex flex-col items-center shadow-none border-dashed border-2 border-zinc-200 bg-transparent">
                <div className="p-4 bg-zinc-100 rounded-full mb-4">
                    <Construction className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">{title}</h3>
                <p className="text-zinc-500 max-w-xs">This module is part of the Pro Enterprise plan. Configure it in settings.</p>
            </GlassCard>
        </div>
    );
}
