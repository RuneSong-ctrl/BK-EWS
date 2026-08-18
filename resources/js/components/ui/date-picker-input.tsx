import * as React from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface DatePickerInputProps {
  value: string // YYYY-MM-DD
  onChange: (val: string) => void
  label?: string
  className?: string
  disabled?: boolean
  min?: string
  max?: string
  size?: "sm" | "md" | "lg"
  showQuickStepper?: boolean
  showDayName?: boolean
}

function getDayAndFormattedDate(dateStr?: string): { dayName: string; formattedDate: string; isToday: boolean; isYesterday: boolean } {
  if (!dateStr) {
    return { dayName: "", formattedDate: "Pilih Tanggal...", isToday: false, isYesterday: false }
  }

  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    if (!year || !month || !day) {
      return { dayName: "", formattedDate: dateStr, isToday: false, isYesterday: false }
    }

    const targetDate = new Date(year, month - 1, day)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    const isToday =
      targetDate.getFullYear() === today.getFullYear() &&
      targetDate.getMonth() === today.getMonth() &&
      targetDate.getDate() === today.getDate()

    const isYesterday =
      targetDate.getFullYear() === yesterday.getFullYear() &&
      targetDate.getMonth() === yesterday.getMonth() &&
      targetDate.getDate() === yesterday.getDate()

    const dayName = targetDate.toLocaleDateString("id-ID", { weekday: "long" })
    const formattedDate = targetDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

    return { dayName, formattedDate, isToday, isYesterday }
  } catch {
    return { dayName: "", formattedDate: dateStr, isToday: false, isYesterday: false }
  }
}

function adjustDays(dateStr: string, deltaDays: number): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() + deltaDays)
    return d.toISOString().split("T")[0]
  } catch {
    return dateStr
  }
}

export function DatePickerInput({
  value,
  onChange,
  label,
  className,
  disabled = false,
  min,
  max,
  size = "md",
  showQuickStepper = true,
  showDayName = true,
}: DatePickerInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { dayName, formattedDate, isToday, isYesterday } = React.useMemo(
    () => getDayAndFormattedDate(value),
    [value]
  )

  const handleStepDay = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    const newDate = adjustDays(value || new Date().toISOString().split("T")[0], delta)
    onChange(newDate)
  }

  const handleJumpToToday = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    const todayStr = new Date().toISOString().split("T")[0]
    onChange(todayStr)
  }

  const sizeClasses = {
    sm: "h-8 px-2.5 text-xs gap-1.5 rounded-xl",
    md: "h-9 sm:h-10 px-3 text-xs sm:text-sm gap-2 rounded-xl",
    lg: "h-11 sm:h-12 px-4 text-sm sm:text-base gap-3 rounded-2xl",
  }[size]

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-4.5 h-4.5",
  }[size]

  return (
    <div className={cn("inline-flex flex-col gap-1 select-none", className)}>
      {label && (
        <span className="text-xs font-bold text-slate-700 block">
          {label}
        </span>
      )}

      <div className="flex items-center gap-1">
        {/* Main Interactive Date Display */}
        <div
          onClick={() => {
            if (!disabled && inputRef.current) {
              try {
                inputRef.current.showPicker?.()
              } catch {
                inputRef.current.focus()
              }
            }
          }}
          className={cn(
            "relative flex items-center justify-between font-bold text-slate-800 transition-all cursor-pointer",
            "neo-inset bg-[#E7EDF4] border border-slate-300/40 hover:border-blue-400/80 shadow-inner",
            "focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500",
            sizeClasses,
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
          title="Klik untuk membuka kalender"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
              <CalendarIcon className={iconSizes} />
            </div>

            <div className="flex items-baseline gap-1.5 min-w-0 truncate">
              {showDayName && dayName && (
                <span className="text-blue-700 font-extrabold tracking-tight shrink-0">
                  {dayName},
                </span>
              )}
              <span className="font-bold text-slate-900 tracking-tight truncate">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Quick Relative Badge */}
          {isToday && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100/90 text-emerald-800 border border-emerald-300/60 shrink-0 shadow-2xs">
              Hari Ini
            </span>
          )}
          {isYesterday && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100/90 text-amber-800 border border-amber-300/60 shrink-0 shadow-2xs">
              Kemarin
            </span>
          )}

          <ChevronDown className={cn("text-slate-400 shrink-0 ml-1 opacity-60", iconSizes)} />

          {/* Native Date Input Overlay */}
          <input
            ref={inputRef}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={min}
            max={max}
            disabled={disabled}
            tabIndex={0}
            aria-label={label || "Pilih Tanggal KBM"}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer -z-0 focus:outline-none"
          />
        </div>

        {/* Quick Day Stepper Controls (< Kemarin, > Besok, Hari Ini) */}
        {showQuickStepper && !disabled && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={(e) => handleStepDay(-1, e)}
              className="w-7 sm:w-8 h-7 sm:h-8 rounded-xl neo-btn bg-[#EEF2F7] hover:bg-white text-slate-700 hover:text-blue-700 border border-white/90 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Hari Sebelumnya (H-1)"
            >
              <ChevronLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={(e) => handleStepDay(1, e)}
              className="w-7 sm:w-8 h-7 sm:h-8 rounded-xl neo-btn bg-[#EEF2F7] hover:bg-white text-slate-700 hover:text-blue-700 border border-white/90 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Hari Berikutnya (H+1)"
            >
              <ChevronRight className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>

            {!isToday && (
              <button
                type="button"
                onClick={handleJumpToToday}
                className="h-7 sm:h-8 px-2 rounded-xl neo-btn bg-blue-50/80 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Kembali ke Tanggal Hari Ini"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Hari Ini</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
