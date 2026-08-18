import { cn } from "@/lib/utils"

export type EwsStatus = "NORMAL" | "BERISIKO" | "WASPADA" | "KRITIS" | "DATA_KURANG" | "DATA_BELUM_LENGKAP" | "PENDING"

interface EwsStatusBadgeProps {
  status: EwsStatus | string
  size?: "sm" | "md" | "lg"
  showDot?: boolean
  className?: string
}

export function EwsStatusBadge({
  status,
  size = "md",
  showDot = true,
  className,
}: EwsStatusBadgeProps) {
  const getStatusConfig = (s: EwsStatus | string) => {
    switch (s) {
      case "NORMAL":
        return {
          label: "Normal",
          textColor: "text-emerald-800",
          dotColor: "bg-emerald-500 ring-3 ring-emerald-500/20",
        }
      case "BERISIKO":
        return {
          label: "Berisiko",
          textColor: "text-amber-800",
          dotColor: "bg-amber-500 ring-3 ring-amber-500/20",
        }
      case "WASPADA":
        return {
          label: "Waspada",
          textColor: "text-orange-800",
          dotColor: "bg-orange-500 ring-3 ring-orange-500/20",
        }
      case "KRITIS":
        return {
          label: "Kritis",
          textColor: "text-rose-800 font-extrabold",
          dotColor: "bg-rose-600 ring-3 ring-rose-600/25",
        }
      case "DATA_BELUM_LENGKAP":
      case "DATA_KURANG":
      case "PENDING":
      default:
        return {
          label: "Data Belum Lengkap",
          textColor: "text-slate-600",
          dotColor: "bg-slate-400 ring-3 ring-slate-400/20",
        }
    }
  }

  const config = getStatusConfig(status)

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1.5 rounded-lg",
    md: "px-2.5 py-1 text-xs gap-2 rounded-xl",
    lg: "px-3.5 py-1.5 text-sm gap-2.5 rounded-xl",
  }[size]

  return (
    <span
      className={cn(
        "inline-flex items-center bg-white/95 border border-slate-200/90 font-bold select-none tracking-tight shadow-2xs",
        config.textColor,
        sizeClasses,
        className
      )}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotColor)} />
      )}
      <span>{config.label}</span>
    </span>
  )
}
