import * as React from "react"
import { cn } from "@/app/lib/utils"

const GlassCard = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-2xl",
            "hover:border-white/20 hover:bg-slate-900/70 transition-all duration-300",
            className
        )}
        {...props}
    />
))
GlassCard.displayName = "GlassCard"

export { GlassCard }
