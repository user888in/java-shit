import { cn } from "@/app/lib/utils";

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
    status: string;
    variant?: StatusVariant;
    className?: string;
}

export function StatusBadge({ status, variant = 'neutral', className }: StatusBadgeProps) {
    const styles = {
        success: "bg-green-100 text-green-700 border-green-200",
        warning: "bg-amber-100 text-amber-700 border-amber-200",
        error: "bg-red-100 text-red-700 border-red-200",
        info: "bg-blue-100 text-blue-700 border-blue-200",
        neutral: "bg-zinc-100 text-zinc-700 border-zinc-200",
    };

    // Auto-detect variant if not provided based on common keywords
    let autoVariant = variant;
    if (variant === 'neutral') {
        const lower = status.toLowerCase();
        if (lower.includes('paid') || lower.includes('approved') || lower.includes('saved')) autoVariant = 'success';
        else if (lower.includes('review') || lower.includes('pending')) autoVariant = 'warning';
        else if (lower.includes('disputed') || lower.includes('flagged')) autoVariant = 'error';
    }

    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 w-fit",
            styles[autoVariant],
            className
        )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
            {status}
        </span>
    );
}
