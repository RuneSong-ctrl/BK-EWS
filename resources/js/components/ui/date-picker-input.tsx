import * as React from "react"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"
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
}

function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return "Pilih Tanggal..."
  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    if (!year || !month || !day) return dateStr
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
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
}: DatePickerInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: "h-8 px-2.5 text-xs gap-2 rounded-xl",
    md: "h-9 sm:h-10 px-3.5 text-xs sm:text-sm gap-2.5 rounded-xl",
    lg: "h-11 sm:h-12 px-4 text-sm sm:text-base gap-3 rounded-2xl",
  }[size]

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size]

  return (
    <div className={cn("relative inline-flex flex-col gap-1 select-none", className)}>
      {label && (
        <span className="text-xs font-bold text-slate-700 block">
          {label}
        </span>
      )}

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
          "neo-inset bg-[#E7EDF4] border border-slate-300/40 hover:border-blue-400/60 shadow-inner",
          "focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500",
          sizeClasses,
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className={cn("text-blue-600 shrink-0", iconSizes)} />
          <span className="font-semibold text-slate-800 tracking-tight truncate">
            {formatDateDisplay(value)}
          </span>
        </div>

        <ChevronDown className={cn("text-slate-400 shrink-0 ml-1.5 opacity-60", iconSizes)} />

        {/* Hidden native input overlay that handles actual native datepicker and accessibility */}
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
    </div>
  )
}
