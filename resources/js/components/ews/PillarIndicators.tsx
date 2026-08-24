import * as React from "react"
import { cn } from "@/lib/utils"
import type { EwsStatus } from "./EwsStatusBadge"

export interface PillarStatuses {
  ak: EwsStatus | string
  kh: EwsStatus | string
  pr: EwsStatus | string
  bk: EwsStatus | string
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
  const [activePillar, setActivePillar] = React.useState<string | null>(null)

  const getPillarClass = (status: EwsStatus | string) => {
    switch (status) {
      case "NORMAL":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "BERISIKO":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "WASPADA":
        return "bg-orange-50 text-orange-700 border-orange-200"
      case "KRITIS":
        return "bg-rose-50 text-rose-700 border-rose-300 font-bold"
      case "DATA_BELUM_LENGKAP":
      case "DATA_KURANG":
      case "PENDING":
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
    <div className={cn("relative inline-flex items-center gap-1.5", className)}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          aria-label={`Pilar ${item.name}: Status ${item.status}`}
          title={`${item.name}: ${item.status}`}
          onClick={(e) => {
            e.stopPropagation()
            setActivePillar(activePillar === item.key ? null : item.key)
          }}
          className={cn(
            "inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border text-[11px] font-mono font-semibold transition-all select-none cursor-pointer",
            "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none active:scale-95",
            getPillarClass(item.status),
            activePillar === item.key && "ring-2 ring-blue-500/40 font-extrabold shadow-2xs"
          )}
        >
          {item.code}
          {showLabels && <span className="ml-1 text-[10px] opacity-80">({item.status})</span>}
        </button>
      ))}

      {/* Floating touch hint when clicked */}
      {activePillar && (
        <div
          role="tooltip"
          className="absolute -top-8 left-0 z-30 px-2 py-1 bg-slate-900 text-white text-[10px] font-medium rounded-md shadow-md whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
        >
          {items.find((i) => i.key === activePillar)?.name}:{" "}
          <span className="font-bold">{items.find((i) => i.key === activePillar)?.status}</span>
        </div>
      )}
    </div>
  )
}
