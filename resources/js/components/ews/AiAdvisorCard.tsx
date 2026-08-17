import * as React from "react"
import {
  IconUserCheck,
  IconHandshake,
  IconKepsek,
  IconAlert,
  IconCheck,
  IconAi,
  IconShieldCheck,
  IconRefresh,
} from "@/components/ui/storage-icon"
import { router } from "@inertiajs/react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

export interface AiAdvisorData {
  risk_overview: string
  primary_concerns: string[]
  recommendation_guru_kelas: string
  recommendation_guru_bk: string
  recommendation_kepsek: string
  last_updated?: string
  confidence_score?: string
}

interface AiAdvisorCardProps {
  data: AiAdvisorData
  studentId?: number | string
  studentName?: string
  className?: string
  ews_status?: "NORMAL" | "BERISIKO" | "WASPADA" | "KRITIS" | "DATA_BELUM_LENGKAP"
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function AiAdvisorCard({
  data,
  studentId,
  studentName = "Siswa",
  className,
  ews_status = "DATA_BELUM_LENGKAP",
  onRefresh,
  isRefreshing: externalIsRefreshing,
}: AiAdvisorCardProps) {
  const [internalLoading, setInternalLoading] = React.useState(false)
  const isRefreshing = externalIsRefreshing ?? internalLoading

  const handleRefreshAi = () => {
    if (onRefresh) {
      onRefresh()
      return
    }

    if (!studentId) return

    setInternalLoading(true)
    router.post(
      `/students/${studentId}/ai-advice`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "AI Advisor Diperbarui",
            description: `Rekomendasi intervensi untuk ${studentName} berhasil disintesis ulang.`,
            variant: "success",
          })
        },
        onError: () => {
          toast({
            title: "Gagal Memperbarui",
            description: "Terjadi kesalahan saat memproses data AI Advisor.",
            variant: "destructive",
          })
        },
        onFinish: () => {
          setInternalLoading(false)
        },
      }
    )
  }

  const getStatusBorder = () => {
    switch (ews_status) {
      case "KRITIS":
        return "border-rose-300"
      case "WASPADA":
        return "border-orange-300"
      case "BERISIKO":
        return "border-amber-300"
      default:
        return "border-blue-200/80"
    }
  }

  return (
    <div
      className={cn(
        "p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] space-y-6 shadow-sm border transition-all",
        getStatusBorder(),
        className
      )}
    >
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/40 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl neo-btn bg-[#EEF2F7] text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
            <IconAi className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
                AI Early Warning System Advisor
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/90 text-blue-700">
                Analisis Otomatis EWS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Sintesis rekomendasi aksi preventif &amp; kuratif berbasis 4 pilar longitudinal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {data.confidence_score && (
            <span className="text-xs text-slate-500 font-medium hidden md:inline">
              Tingkat Keyakinan: <strong>{data.confidence_score}</strong>
            </span>
          )}
          <button
            type="button"
            onClick={handleRefreshAi}
            disabled={isRefreshing}
            className="text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl neo-btn bg-[#EEF2F7] text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-60 cursor-pointer"
          >
            <IconRefresh className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-blue-600")} />
            <span>{isRefreshing ? "Menyintesis..." : "Sintesis Ulang AI"}</span>
          </button>
        </div>
      </div>

      {/* Main Risk Overview & Diagnostic Narrative */}
      <div className="space-y-4">
        <div className="p-5 sm:p-6 rounded-2xl neo-inset bg-[#E7EDF4] space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Diagnosa Risiko Pedagogis &amp; Tren Perilaku:</span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-slate-800 font-medium">
            {data.risk_overview}
          </p>
        </div>

        {/* Primary Concerns List */}
        {data.primary_concerns && data.primary_concerns.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-slate-200/70 space-y-2.5">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <IconAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Poin Atensi &amp; Pemicu Risiko Terdeteksi:</span>
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              {data.primary_concerns.map((concern, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl neo-inset bg-[#E7EDF4] text-xs sm:text-sm text-slate-700 flex items-start gap-2.5 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{concern}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3-Perspective Stakeholder Action Guidance Grid */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
            Panduan Aksi Intervensi Lintas Peran:
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Terkoordinasi 3 Sektor
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Wali / Guru Kelas */}
          <div className="p-5 sm:p-6 rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-blue-200/80 flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl neo-btn bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <IconUserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-blue-950">
                      Wali / Guru Kelas
                    </h3>
                    <span className="text-[11px] text-blue-600 font-medium">Observasi &amp; Dialog</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  Harian
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {data.recommendation_guru_kelas}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold">
              <IconCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Pendekatan empatik di ruang kelas</span>
            </div>
          </div>

          {/* Card 2: Guru BK / Konselor */}
          <div className="p-5 sm:p-6 rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-indigo-200/80 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl neo-btn bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <IconHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-indigo-950">
                      Guru BK / Konselor
                    </h3>
                    <span className="text-[11px] text-indigo-600 font-medium">Bimbingan Terarah</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  Konseling
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {data.recommendation_guru_bk}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-indigo-700 font-semibold">
              <IconCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Rekam konseling verbatim terenkripsi</span>
            </div>
          </div>

          {/* Card 3: Kepala Sekolah */}
          <div className="p-5 sm:p-6 rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-amber-200/80 flex flex-col justify-between space-y-4 hover:border-amber-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl neo-btn bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <IconKepsek className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-amber-950">
                      Kepala Sekolah
                    </h3>
                    <span className="text-[11px] text-amber-600 font-medium">Disposisi &amp; Evaluasi</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  Manajemen
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {data.recommendation_kepsek}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold">
              <IconCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Monitoring berkala iklim sekolah</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Legal & Privacy */}
      <div className="pt-4 border-t border-slate-300/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <IconShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Kerahasiaan Terjamin • Kepatuhan Privasi Data Siswa UU PDP No. 27/2022</span>
        </div>
        {data.last_updated && (
          <span className="font-mono text-[11px] text-slate-400">
            Sintesis Terakhir: {data.last_updated}
          </span>
        )}
      </div>
    </div>
  )
}

