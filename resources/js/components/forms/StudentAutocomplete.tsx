import * as React from "react"
import { Search, User, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { EwsStatusBadge, type EwsStatus } from "@/components/ews/EwsStatusBadge"

export interface StudentOption {
  id: number
  name: string
  nisn: string
  class_name: string
  avatar?: string
  ews_status: EwsStatus
}

export interface StudentAutocompleteProps {
  students: StudentOption[]
  selectedStudent: StudentOption | null
  onSelect: (student: StudentOption | null) => void
  placeholder?: string
  label?: string
  className?: string
}

export function StudentAutocomplete({
  students,
  selectedStudent,
  onSelect,
  placeholder = "Ketik nama siswa atau NISN...",
  label,
  className,
}: StudentAutocompleteProps) {
  const [query, setQuery] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  const filteredStudents = React.useMemo(() => {
    if (!query.trim()) return students.slice(0, 6)
    const q = query.toLowerCase()
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        s.class_name.toLowerCase().includes(q)
    )
  }, [students, query])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className={cn("relative space-y-1.5", className)}>
      {label && <label className="text-sm font-semibold text-slate-800">{label}</label>}

      {selectedStudent ? (
        <div className="flex items-center justify-between p-2.5 rounded-xl neo-card border border-blue-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
              {selectedStudent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{selectedStudent.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  {selectedStudent.class_name}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">NISN: {selectedStudent.nisn}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <EwsStatusBadge status={selectedStudent.ews_status} size="sm" />
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Ganti Siswa"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full h-11 pl-10 pr-4 rounded-xl neo-inset bg-[#F0F3F8] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            />
          </div>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl neo-card bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
              <div className="p-2 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {filteredStudents.length > 0 ? "Pilih Siswa Terdaftar" : "Siswa Tidak Ditemukan"}
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        onSelect(student)
                        setIsOpen(false)
                        setQuery("")
                      }}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-blue-50/80 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-200 text-slate-700 group-hover:text-blue-800 flex items-center justify-center text-xs font-bold transition-colors">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">
                              {student.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {student.class_name}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono">NISN: {student.nisn}</span>
                        </div>
                      </div>

                      <EwsStatusBadge status={student.ews_status} size="sm" />
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Tidak ada siswa yang cocok dengan kata kunci &quot;{query}&quot;
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
