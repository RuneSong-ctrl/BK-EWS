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

export function formatLocalDateToYMD(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getDayAndFormattedDate(dateStr?: string): { dayName: string; formattedDate: string; isToday: boolean } {
  if (!dateStr) {
    return { dayName: "", formattedDate: "Pilih Tanggal...", isToday: false }
  }

  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    if (!year || !month || !day) {
      return { dayName: "", formattedDate: dateStr, isToday: false }
    }

    const targetDate = new Date(year, month - 1, day, 12, 0, 0)
    const today = new Date()
    today.setHours(12, 0, 0, 0)

    const targetTime = new Date(year, month - 1, day, 12, 0, 0).getTime()
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0).getTime()
    const diffDays = Math.round((targetTime - todayTime) / (1000 * 60 * 60 * 24))

    const isToday = diffDays === 0
    const dayName = targetDate.toLocaleDateString("id-ID", { weekday: "long" })
    const formattedDate = targetDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

    return { dayName, formattedDate, isToday }
  } catch {
    return { dayName: "", formattedDate: dateStr, isToday: false }
  }
}

function adjustDays(dateStr: string, deltaDays: number): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    if (!year || !month || !day) return dateStr
    // Use noon 12:00 to completely avoid any midnight timezone UTC shifts
    const d = new Date(year, month - 1, day, 12, 0, 0)
    d.setDate(d.getDate() + deltaDays)
    return formatLocalDateToYMD(d)
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
  const { dayName, formattedDate, isToday } = React.useMemo(
    () => getDayAndFormattedDate(value),
    [value]
  )

  const handleStepDay = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    const current = value || formatLocalDateToYMD(new Date())
    const newDate = adjustDays(current, delta)
    onChange(newDate)
  }

  const handleJumpToToday = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    const todayStr = formatLocalDateToYMD(new Date())
    onChange(todayStr)
  }

  const sizeClasses = {
    sm: "h-8 px-2.5 text-xs gap-2 rounded-xl w-[205px] sm:w-[220px]",
    md: "h-9 sm:h-10 px-3 text-xs sm:text-sm gap-2.5 rounded-xl w-[235px] sm:w-[250px]",
    lg: "h-11 sm:h-12 px-4 text-sm sm:text-base gap-3 rounded-2xl w-[265px] sm:w-[285px]",
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

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Main Interactive Date Display - Spacious, Fixed Width, Zero Truncation */}
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
            "relative flex items-center justify-between font-bold text-slate-800 transition-all cursor-pointer shrink-0 select-none",
            "neo-inset bg-[#E7EDF4] border border-slate-300/40 hover:border-blue-400/80 shadow-inner",
            "focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500",
            sizeClasses,
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
          title="Klik untuk memilih tanggal dari kalender"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
              <CalendarIcon className={iconSizes} />
            </div>

            <div className="flex items-baseline gap-1.5 min-w-0 tabular-nums whitespace-nowrap text-slate-800">
              {showDayName && dayName && (
                <span className="text-blue-700 font-extrabold tracking-tight shrink-0">
                  {dayName},
                </span>
              )}
              <span className="font-bold text-slate-900 tracking-tight">
                {formattedDate}
              </span>
            </div>
          </div>

          <ChevronDown className={cn("text-slate-400 shrink-0 opacity-60 ml-1", iconSizes)} />

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
            aria-label={label || "Pilih Tanggal"}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer -z-0 focus:outline-none"
          />
        </div>

        {/* Quick Day Stepper Controls (< Prev, > Next, ↺ Hari Ini) */}
        {showQuickStepper && !disabled && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => handleStepDay(-1, e)}
              className="w-7 sm:w-8 h-7 sm:h-8 rounded-xl neo-btn bg-[#EEF2F7] hover:bg-white text-slate-700 hover:text-blue-700 border border-white/90 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title="Hari Sebelumnya (H-1)"
            >
              <ChevronLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={(e) => handleStepDay(1, e)}
              className="w-7 sm:w-8 h-7 sm:h-8 rounded-xl neo-btn bg-[#EEF2F7] hover:bg-white text-slate-700 hover:text-blue-700 border border-white/90 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title="Hari Berikutnya (H+1)"
            >
              <ChevronRight className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>

            {/* Permanent "Hari Ini" Button - Always occupies its exact slot so layout never shifts */}
            <button
              type="button"
              onClick={handleJumpToToday}
              disabled={isToday}
              className={cn(
                "h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 select-none",
                isToday
                  ? "bg-slate-100/60 text-slate-400 border border-slate-200/50 cursor-not-allowed opacity-35 shadow-none pointer-events-none"
                  : "neo-btn bg-white/95 hover:bg-blue-50 text-blue-700 hover:text-blue-800 border border-slate-200/80 hover:border-blue-300 shadow-2xs cursor-pointer active:scale-95"
              )}
              title={isToday ? "Sedang di tanggal Hari Ini" : "Kembali ke Tanggal Hari Ini"}
            >
              <RotateCcw className={cn("w-3 h-3 shrink-0", !isToday && "text-blue-600")} />
              <span className="shrink-0 font-bold">Hari Ini</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

