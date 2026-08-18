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

export interface RoleActionDetail {
  action: string
  focus?: string
  badge?: string
  checklist?: string
}

export type RoleRecommendationInput = string | Partial<RoleActionDetail> | undefined

export interface AiAdvisorData {
  risk_overview: string
  primary_concerns: string[]
  recommendation_guru_kelas: RoleRecommendationInput
  recommendation_guru_bk: RoleRecommendationInput
  recommendation_kepsek: RoleRecommendationInput
  data_limitation_note?: string
  last_updated?: string
  confidence_score?: string
  model_version?: string
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

function formatSynthesisDate(dateStr?: string): string {
  if (!dateStr) return "Sintesis AI Otomatis"
  if (dateStr === "Sintesis AI Otomatis") return dateStr
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return (
      d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) + " WIB"
    )
  } catch {
    return dateStr
  }
}

function resolveRoleRecommendation(
  input: RoleRecommendationInput,
  role: "guru_kelas" | "guru_bk" | "kepsek",
  status: "NORMAL" | "BERISIKO" | "WASPADA" | "KRITIS" | "DATA_BELUM_LENGKAP"
): { action: string; focus: string; badge: string; checklist: string } {
  const isObject = typeof input === "object" && input !== null
  const providedAction = isObject ? input.action : typeof input === "string" ? input : ""
  const providedFocus = isObject ? input.focus : undefined
  const providedBadge = isObject ? input.badge : undefined
  const providedChecklist = isObject ? input.checklist : undefined

  if (role === "guru_kelas") {
    const defaults = {
      KRITIS: {
        focus: "Intervensi Kelas & Pengawasan",
        badge: "Prioritas 1",
        checklist: "Pendampingan intensif & lapor harian ke BK",
        action:
          "Lakukan pengawasan intensif di kelas, amankan dinamika interaksi teman sebaya, dan berikan laporan perkembangan berkala ke Guru BK.",
      },
      WASPADA: {
        focus: "Pendampingan & Presensi",
        badge: "Harian",
        checklist: "Dialog personal & monitoring presensi ketat",
        action:
          "Tingkatkan interaksi empatik harian, pantau ketat kehadiran dan penyelesaian tugas kelas, serta identifikasi kendala belajar awal.",
      },
      BERISIKO: {
        focus: "Remedial & Motivasi",
        badge: "Mingguan",
        checklist: "Bimbingan tugas & penguatan motivasi kelas",
        action:
          "Berikan pendampingan akademik tambahan di kelas, fasilitasi tutor sebaya, dan berikan penguatan motivasi belajar secara berkala.",
      },
      DATA_BELUM_LENGKAP: {
        focus: "Verifikasi & Input Data",
        badge: "Mendesak",
        checklist: "Lengkapi data nilai & presensi di EWS",
        action:
          "Segera verifikasi dan pastikan pengumpulan serta input data nilai akademik dari guru mata pelajaran dan data kehadiran siswa ke sistem EWS.",
      },
      NORMAL: {
        focus: "Observasi & Apresiasi Positif",
        badge: "Rutin",
        checklist: "Pemeliharaan partisipasi aktif di kelas",
        action:
          "Berikan apresiasi atas konsistensi belajar siswa dan pelihara iklim kelas yang inklusif, aman, serta suportif.",
      },
    }[status] || {
      focus: "Observasi & Dialog",
      badge: "Harian",
      checklist: "Pendekatan empatik di ruang kelas",
      action: "Lakukan pemantauan aktif dan komunikasi empatik di ruang kelas.",
    }

    return {
      action: providedAction || defaults.action,
      focus: providedFocus || defaults.focus,
      badge: providedBadge || defaults.badge,
      checklist: providedChecklist || defaults.checklist,
    }
  }

  if (role === "guru_bk") {
    const defaults = {
      KRITIS: {
        focus: "Konseling Krisis & Konferensi Kasus",
        badge: "Segera",
        checklist: "Panggilan orang tua & case conference",
        action:
          "Jadwalkan konferensi kasus (case conference) darurat, lakukan pemanggilan orang tua/wali, serta susun kontrak perilaku dan asesmen mendalam.",
      },
      WASPADA: {
        focus: "Bimbingan Preventif & Asesmen",
        badge: "Konseling",
        checklist: "Sesi konseling individual & pemetaan hambatan",
        action:
          "Lakukan asesmen psikososial terarah dan jadwalkan sesi bimbingan konseling individual terstruktur guna mendalami faktor personal atau keluarga.",
      },
      BERISIKO: {
        focus: "Bimbingan Kelompok & Observasi",
        badge: "Bimbingan",
        checklist: "Identifikasi faktor penurunan & konseling berkala",
        action:
          "Fasilitasi bimbingan kelompok atau konseling suportif singkat guna mendeteksi faktor penghambat belajar dan meningkatkan motivasi.",
      },
      DATA_BELUM_LENGKAP: {
        focus: "Asesmen Awal & Koordinasi",
        badge: "Koordinasi",
        checklist: "Koordinasi wali kelas untuk pemetaan awal",
        action:
          "Berkoordinasi aktif dengan wali kelas dan pihak terkait untuk mempercepat kelengkapan data serta siapkan asesmen diagnostik awal bila diperlukan.",
      },
      NORMAL: {
        focus: "Bimbingan Karir & Minat",
        badge: "Pengembangan",
        checklist: "Eksplorasi potensi & bimbingan perkembangan",
        action:
          "Dukung eksplorasi minat, bakat, pembinaan kepemimpinan, dan perencanaan studi lanjut/karir siswa secara berkesinambungan.",
      },
    }[status] || {
      focus: "Bimbingan Terarah",
      badge: "Konseling",
      checklist: "Rekam konseling verbatim terenkripsi",
      action: "Fasilitasi bimbingan konseling terarah dan pemetaan perkembangan siswa.",
    }

    return {
      action: providedAction || defaults.action,
      focus: providedFocus || defaults.focus,
      badge: providedBadge || defaults.badge,
      checklist: providedChecklist || defaults.checklist,
    }
  }

  // Kepala Sekolah
  const defaults = {
    KRITIS: {
      focus: "Disposisi & Eskalasi Kebijakan",
      badge: "Disposisi",
      checklist: "Penerbitan disposisi khusus & monitoring mitigasi",
      action:
        "Terbitkan lembar disposisi penanganan khusus, tinjau mitigasi risiko kelembagaan, dan pimpin koordinasi terpadu lintas sektor secara berkala.",
    },
    WASPADA: {
      focus: "Evaluasi Tindak Lanjut & Supervisi",
      badge: "Evaluasi",
      checklist: "Review berkala koordinasi wali kelas & BK",
      action:
        "Supervisi efektivitas kolaborasi tindak lanjut antara wali kelas dan guru BK, serta evaluasi tren penurunan risiko mingguan.",
    },
    BERISIKO: {
      focus: "Monitoring Proaktif",
      badge: "Monitoring",
      checklist: "Pantau tren grafik EWS mingguan",
      action:
        "Pantau dinamika indikator risiko siswa secara proaktif melalui dashboard analitik EWS dan pastikan langkah preventif berjalan.",
    },
    DATA_BELUM_LENGKAP: {
      focus: "Supervisi Kepatuhan Data EWS",
      badge: "Manajerial",
      checklist: "Instruksi percepatan kelengkapan 4 pilar",
      action:
        "Terbitkan arahan tegas terkait pemenuhan dan ketepatan waktu penginputan data 4 pilar EWS serta pantau progres penyelesaian status PENDING.",
    },
    NORMAL: {
      focus: "Pengawasan Iklim & Apresiasi",
      badge: "Manajemen",
      checklist: "Pemeliharaan ekosistem belajar kondusif",
      action:
        "Dukung program pengayaan bakat siswa dan pemeliharaan iklim sekolah yang sehat, aman, inklusif, serta kondusif.",
    },
  }[status] || {
    focus: "Disposisi & Evaluasi",
    badge: "Manajemen",
    checklist: "Monitoring berkala iklim sekolah",
    action: "Pantau tata kelola dan evaluasi tindak lanjut penanganan siswa.",
  }

  return {
    action: providedAction || defaults.action,
    focus: providedFocus || defaults.focus,
    badge: providedBadge || defaults.badge,
    checklist: providedChecklist || defaults.checklist,
  }
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

  const homeroomAdvice = resolveRoleRecommendation(data.recommendation_guru_kelas, "guru_kelas", ews_status)
  const bkAdvice = resolveRoleRecommendation(data.recommendation_guru_bk, "guru_bk", ews_status)
  const kepsekAdvice = resolveRoleRecommendation(data.recommendation_kepsek, "kepsek", ews_status)

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

        {/* Optional Data Limitation Warning Banner */}
        {data.data_limitation_note && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex items-start gap-3 text-xs sm:text-sm font-medium">
            <IconAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Catatan Kelengkapan Data: </span>
              <span>{data.data_limitation_note}</span>
            </div>
          </div>
        )}

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
                    <span className="text-[11px] text-blue-600 font-medium">{homeroomAdvice.focus}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  {homeroomAdvice.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {homeroomAdvice.action}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold">
              <IconCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{homeroomAdvice.checklist}</span>
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
                    <span className="text-[11px] text-indigo-600 font-medium">{bkAdvice.focus}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  {bkAdvice.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {bkAdvice.action}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-indigo-700 font-semibold">
              <IconCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{bkAdvice.checklist}</span>
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
                    <span className="text-[11px] text-amber-600 font-medium">{kepsekAdvice.focus}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  {kepsekAdvice.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {kepsekAdvice.action}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold">
              <IconCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{kepsekAdvice.checklist}</span>
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
          <span className="font-mono text-[11px] text-slate-500">
            Sintesis Terakhir: {formatSynthesisDate(data.last_updated)}
          </span>
        )}
      </div>
    </div>
  )
}
