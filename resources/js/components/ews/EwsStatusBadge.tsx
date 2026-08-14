import { cn } from "@/lib/utils"

export type EwsStatus = "NORMAL" | "BERISIKO" | "WASPADA" | "KRITIS" | "DATA_KURANG"

interface EwsStatusBadgeProps {
  status: EwsStatus
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
  const getStatusConfig = (s: EwsStatus) => {
    switch (s) {
      case "NORMAL":
        return {
          label: "Normal",
          classes: "bg-emerald-50 text-emerald-800 border-emerald-200/90",
          dotColor: "bg-emerald-500",
        }
      case "BERISIKO":
        return {
          label: "Berisiko",
          classes: "bg-amber-50 text-amber-800 border-amber-200/90",
          dotColor: "bg-amber-500",
        }
      case "WASPADA":
        return {
          label: "Waspada",
          classes: "bg-orange-50 text-orange-800 border-orange-200/90",
          dotColor: "bg-orange-500 animate-pulse",
        }
      case "KRITIS":
        return {
          label: "Kritis",
          classes: "bg-rose-50 text-rose-800 border-rose-300 shadow-sm",
          dotColor: "bg-rose-600 animate-ping",
        }
      case "DATA_KURANG":
      default:
        return {
          label: "Data Kurang",
          classes: "bg-slate-100 text-slate-700 border-slate-200",
          dotColor: "bg-slate-400",
        }
    }
  }

  const config = getStatusConfig(status)

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] font-semibold gap-1.5",
    md: "px-2.5 py-1 text-xs font-semibold gap-2",
    lg: "px-3.5 py-1.5 text-sm font-bold gap-2.5",
  }[size]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border transition-all select-none",
        config.classes,
        sizeClasses,
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {status === "KRITIS" && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
          )}
          <span className={cn("relative inline-flex rounded-full h-2 w-2", config.dotColor)} />
        </span>
      )}
      <span>{config.label}</span>
    </span>
  )
}
