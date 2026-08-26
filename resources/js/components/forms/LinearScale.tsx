import * as React from "react"
import { cn } from "@/lib/utils"

export interface LinearScaleProps {
  label?: string
  description?: string
  min?: number
  max?: number
  step?: number
  value: number
  onChange: (value: number) => void
  minLabel?: string
  midLabel?: string
  maxLabel?: string
  mode?: "discrete" | "continuous"
  colorGradient?: boolean
  className?: string
}

export function LinearScale({
  label,
  description,
  min = 1,
  max = 5,
  step = 1,
  value,
  onChange,
  minLabel,
  midLabel,
  maxLabel,
  mode = "discrete",
  colorGradient = true,
  className,
}: LinearScaleProps) {
  const steps = React.useMemo(() => {
    const list: number[] = []
    for (let i = min; i <= max; i += step) {
      list.push(i)
    }
    return list
  }, [min, max, step])

  const DEFAULT_STEP_HINTS: Record<number, string> = {
    1: "Sangat Rendah / Pasif",
    2: "Kurang / Jarang",
    3: "Cukup / Standar",
    4: "Baik / Konsisten",
    5: "Sangat Baik / Unggul",
  }

  const currentHint = DEFAULT_STEP_HINTS[value] || ""

  const getColorClass = (val: number) => {
    if (!colorGradient) return "bg-blue-600 text-white shadow-xs border-blue-600"
    const ratio = (val - min) / (max - min)
    if (ratio < 0.3) return "bg-rose-600 text-white shadow-xs border-rose-600"
    if (ratio < 0.6) return "bg-amber-500 text-white shadow-xs border-amber-500"
    if (ratio < 0.8) return "bg-blue-600 text-white shadow-xs border-blue-600"
    return "bg-emerald-600 text-white shadow-xs border-emerald-600"
  }

  const getTrackColor = (val: number) => {
    const ratio = (val - min) / (max - min)
    if (ratio < 0.3) return "#e11d48"
    if (ratio < 0.6) return "#f59e0b"
    if (ratio < 0.8) return "#2563eb"
    return "#059669"
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault()
      const next = Math.min(max, value + step)
      onChange(next)
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault()
      const prev = Math.max(min, value - step)
      onChange(prev)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {(label || description) && (
        <div className="flex items-start justify-between gap-3">
          <div>
            {label && (
              <label className="text-xs sm:text-sm font-bold text-slate-800 block">
                {label}
              </label>
            )}
            {description && <p className="text-xs text-slate-500 mt-0.5 leading-snug">{description}</p>}
          </div>
          <div className="flex flex-col items-end">
            <div
              className={cn(
                "px-3 py-1 rounded-xl neo-card-subtle bg-[#EEF2F7] border border-white/90 font-mono text-xs sm:text-sm font-bold shrink-0 transition-all",
                mode === "continuous"
                  ? value >= 75
                    ? "text-emerald-700 font-extrabold"
                    : value >= 60
                    ? "text-blue-700 font-extrabold"
                    : "text-amber-700 font-extrabold"
                  : "text-slate-900"
              )}
            >
              {value} {mode === "continuous" ? "%" : `/ ${max}`}
            </div>
            {mode === "discrete" && currentHint && (
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 select-none">{currentHint}</span>
            )}
          </div>
        </div>
      )}


      {mode === "discrete" ? (
        <div className="space-y-2 pt-0.5">
          <div
            role="radiogroup"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label={label || "Skala Penilaian"}
            className="grid grid-cols-5 gap-1.5 p-1.5 rounded-2xl bg-[#E2E8F0]/80 border border-slate-300/60 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:outline-none"
          >
            {steps.map((s) => {
              const isSelected = value === s
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`Nilai ${s} dari ${max} (${DEFAULT_STEP_HINTS[s] || s})`}
                  onClick={() => onChange(s)}
                  className={cn(
                    "h-10 rounded-xl text-xs sm:text-sm font-number font-extrabold transition-all duration-150 cursor-pointer flex items-center justify-center select-none",
                    "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none active:scale-[0.96]",
                    isSelected
                      ? cn("font-extrabold shadow-sm ring-2 ring-black/5", getColorClass(s))
                      : "bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 shadow-2xs"
                  )}
                >
                  {s}
                </button>
              )
            })}
          </div>

          {(minLabel || midLabel || maxLabel) && (
            <div className="grid grid-cols-3 text-[10px] sm:text-[11px] font-semibold text-slate-500 px-1 select-none">
              <span className="text-left text-slate-500">{minLabel}</span>
              <span className="text-center text-slate-500">{midLabel}</span>
              <span className="text-right text-slate-500">{maxLabel}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5 pt-0.5 max-w-md">
          <div className="p-3.5 rounded-2xl neo-inset bg-[#E7EDF4] flex flex-col justify-center">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              aria-label={label || "Skala Kontinu"}
              className="w-full h-2.5 bg-slate-300/80 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              style={{
                accentColor: getTrackColor(value),
              }}
            />
          </div>
          {(minLabel || maxLabel) && (
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-500 px-1.5 select-none">
              <span>{minLabel || `${min} (Rendah)`}</span>
              <span>{maxLabel || `${max} (Baik)`}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
