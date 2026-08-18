import * as React from "react"
import { IconSearch, IconUser, IconCheck, IconClose } from "@/components/ui/storage-icon"
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
      {label && <label className="text-xs sm:text-sm font-bold text-slate-800">{label}</label>}

      {selectedStudent ? (
        <div className="flex items-center justify-between p-3.5 rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neo-btn bg-[#EEF2F7] text-blue-700 font-extrabold text-xs flex items-center justify-center border border-white/90 shrink-0">
              {selectedStudent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{selectedStudent.name}</span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white/90 text-slate-700 border border-slate-200/80 shadow-2xs">
                  {selectedStudent.class_name}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">NISN: {selectedStudent.nisn}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <EwsStatusBadge status={selectedStudent.ews_status} size="sm" />
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              title="Ganti Siswa"
              aria-label="Ganti Siswa Terpilih"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative" role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
          <div className="relative flex items-center">
            <IconSearch className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              aria-label={label || placeholder}
              className="w-full h-11 pl-10 pr-4 rounded-2xl neo-inset bg-[#E7EDF4] text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 transition-all"
            />
          </div>

          {isOpen && (
            <div
              role="listbox"
              className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl neo-card bg-[#EEF2F7] border border-white/90 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
            >
              <div className="px-3.5 py-2.5 bg-[#E7EDF4] border-b border-slate-200/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {filteredStudents.length > 0 ? "Pilih Siswa Binaan" : "Siswa Tidak Ditemukan"}
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-200/60">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        onSelect(student)
                        setIsOpen(false)
                        setQuery("")
                      }}
                      className="w-full flex items-center justify-between p-3 px-3.5 text-left hover:bg-white transition-colors group cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl neo-btn text-blue-700 bg-[#EEF2F7] group-hover:bg-blue-50 flex items-center justify-center text-xs font-bold transition-colors border border-white/90">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800 group-hover:text-blue-700">
                              {student.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-white text-slate-700 border border-slate-200">
                              {student.class_name}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono">NISN: {student.nisn}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <EwsStatusBadge status={student.ews_status} size="sm" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Tidak ditemukan siswa dengan kata kunci "{query}".
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
