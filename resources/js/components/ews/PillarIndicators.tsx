import { cn } from "@/lib/utils"
import type { EwsStatus } from "./EwsStatusBadge"

export interface PillarStatuses {
  ak: EwsStatus
  kh: EwsStatus
  pr: EwsStatus
  bk: EwsStatus
}

interface PillarIndicatorsProps {
  pillars: PillarStatuses
  className?: string
  showLabels?: boolean
}

export function PillarIndicators({
  pillars,
  className,
  showLabels = false,
}: PillarIndicatorsProps) {
  const getPillarClass = (status: EwsStatus) => {
    switch (status) {
      case "NORMAL":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "BERISIKO":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "WASPADA":
        return "bg-orange-50 text-orange-700 border-orange-200"
      case "KRITIS":
        return "bg-rose-50 text-rose-700 border-rose-300 font-bold"
      case "DATA_KURANG":
      default:
        return "bg-slate-100 text-slate-500 border-slate-200"
    }
  }

  const items = [
    { key: "ak", code: "AK", name: "Akademik", status: pillars.ak },
    { key: "kh", code: "KH", name: "Kehadiran", status: pillars.kh },
    { key: "pr", code: "PR", name: "Perilaku", status: pillars.pr },
    { key: "bk", code: "BK", name: "Konseling BK", status: pillars.bk },
  ]

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      {items.map((item) => (
        <span
          key={item.key}
          title={`${item.name}: ${item.status}`}
          className={cn(
            "inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border text-[11px] font-mono font-semibold transition-all select-none",
            getPillarClass(item.status)
          )}
        >
          {item.code}
          {showLabels && <span className="ml-1 text-[10px] opacity-80">({item.status})</span>}
        </span>
      ))}
    </div>
  )
}
