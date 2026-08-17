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
        <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/40 border border-blue-200/90 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
              {selectedStudent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{selectedStudent.name}</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-700 border border-slate-200/80 shadow-2xs">
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
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
              title="Ganti Siswa"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
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
              className="w-full h-11 pl-10 pr-4 rounded-2xl bg-slate-50/80 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs"
            />
          </div>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
              <div className="px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {filteredStudents.length > 0 ? "Pilih Siswa Binaan" : "Siswa Tidak Ditemukan"}
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
                      className="w-full flex items-center justify-between p-3 px-3.5 text-left hover:bg-blue-50/60 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-700 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors border border-slate-200/80">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800 group-hover:text-blue-700">
                              {student.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
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
                  <div className="p-5 text-center text-xs text-slate-500">
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
