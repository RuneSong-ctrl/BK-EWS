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

  const getColorClass = (val: number) => {
    if (!colorGradient) return "bg-primary text-primary-foreground"
    const ratio = (val - min) / (max - min)
    if (ratio < 0.3) return "bg-rose-500 text-white border-rose-600 shadow-rose-200"
    if (ratio < 0.6) return "bg-amber-500 text-white border-amber-600 shadow-amber-200"
    if (ratio < 0.8) return "bg-blue-500 text-white border-blue-600 shadow-blue-200"
    return "bg-emerald-600 text-white border-emerald-700 shadow-emerald-200"
  }

  const getTrackColor = (val: number) => {
    const ratio = (val - min) / (max - min)
    if (ratio < 0.3) return "#f43f5e"
    if (ratio < 0.6) return "#f59e0b"
    if (ratio < 0.8) return "#3b82f6"
    return "#10b981"
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {(label || description) && (
        <div className="flex items-baseline justify-between gap-2">
          <div>
            {label && <label className="text-sm font-semibold text-slate-800">{label}</label>}
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
          <div className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200/80 font-mono text-xs font-bold text-slate-800">
            {value} {mode === "continuous" ? "%" : `/ ${max}`}
          </div>
        </div>
      )}

      {mode === "discrete" ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl neo-inset bg-[#F0F3F8]">
            {steps.map((s) => {
              const isSelected = value === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange(s)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                    isSelected
                      ? cn("shadow-md scale-[1.03]", getColorClass(s))
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                  )}
                >
                  {s}
                </button>
              )
            })}
          </div>

          {(minLabel || midLabel || maxLabel) && (
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 px-1">
              <span>{minLabel}</span>
              {midLabel && <span>{midLabel}</span>}
              <span>{maxLabel}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="p-3 rounded-xl neo-inset bg-[#F0F3F8]">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all"
              style={{
                accentColor: getTrackColor(value),
              }}
            />
          </div>
          {(minLabel || maxLabel) && (
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 px-1">
              <span>{minLabel || `${min}`}</span>
              <span>{maxLabel || `${max}`}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
