import * as React from "react"
import { router } from "@inertiajs/react"
import {
  IconClose,
  IconCheck,
  IconExclamation,
  IconAlert,
  IconUser,
  IconFile,
  IconHandshake,
  IconCalendar,
  IconSend,
  IconMagicWand,
  IconSave,
  IconLoader,
} from "@/components/ui/storage-icon"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export interface EwsNotificationDetail {
  id: number
  student_id: number | null
  moodle_student_id: string
  student_name: string
  class_name: string | null
  course_code: string
  academic_period: string
  risk_level: "TINGGI" | "SEDANG" | "RENDAH"
  risk_probability: number
  risk_percentage: string
  decision_threshold: number
  intervention_urgency: string | null
  moodle_metrics: {
    days_inactive?: number
    total_clicks?: number
    active_days?: number
    missing_assignments?: number
    tasks_submitted?: number
    late_submission_count?: number
    avg_submission_gap?: number
    avg_score?: number
    min_score?: number
  }
  risk_factors: string[]
  ai_narration: string | null
  wa_message: string | null
  audience: string
  target_phone: string | null
  status: "pending" | "generating" | "ready" | "sent" | "failed"
  sent_at: string | null
  interventions?: Array<{
    id: number
    intervention_type: string
    action_notes: string
    student_progress: string
    follow_up_date: string | null
    created_at: string
    counselor?: {
      name: string
    }
  }>
}

interface EwsDetailModalProps {
  notification: EwsNotificationDetail | null
  isOpen: boolean
  onClose: () => void
  userRole?: string
}

export function EwsDetailModal({
  notification,
  isOpen,
  onClose,
  userRole = "guru_bk",
}: EwsDetailModalProps) {
  const [activeTab, setActiveTab] = React.useState<"ai" | "metrics" | "factors" | "wa" | "interventions">("ai")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isCopied, setIsCopied] = React.useState(false)

  // Form State
  const isWaliKelas = userRole === "guru_kelas"
  const defaultType = isWaliKelas ? "KONFIRMASI_WALI" : "KONSELING_INDIVIDU"
  const [interventionType, setInterventionType] = React.useState(defaultType)
  const [actionNotes, setActionNotes] = React.useState("")
  const [studentProgress, setStudentProgress] = React.useState("DALAM_PEMANTAUAN")
  const [followUpDate, setFollowUpDate] = React.useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )

  React.useEffect(() => {
    if (notification) {
      setInterventionType(userRole === "guru_kelas" ? "KONFIRMASI_WALI" : "KONSELING_INDIVIDU")
      setActionNotes("")
      setStudentProgress("DALAM_PEMANTAUAN")
    }
  }, [notification, userRole])

  if (!isOpen || !notification) return null

  const metrics = notification.moodle_metrics || {}

  const handleCopyWa = () => {
    if (notification.wa_message) {
      navigator.clipboard.writeText(notification.wa_message)
      setIsCopied(true)
      toast({
        title: "Teks Berhasil Disalin",
        description: "Draf pesan WhatsApp telah disalin ke clipboard.",
      })
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleSubmitIntervention = (e: React.FormEvent) => {
    e.preventDefault()
    if (!actionNotes.trim() || actionNotes.trim().length < 5) {
      toast({
        title: "Catatan Terlalu Singkat",
        description: "Mohon tuliskan catatan tindakan minimal 5 karakter.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    router.post(
      "/ews/interventions",
      {
        notification_id: notification.id,
        intervention_type: interventionType,
        action_notes: actionNotes,
        student_progress: studentProgress,
        follow_up_date: followUpDate || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsSubmitting(false)
          setActionNotes("")
          toast({
            title: "Tindak Lanjut Tersimpan",
            description: "Catatan penanganan siswa berhasil diperbarui ke sistem.",
          })
          onClose()
        },
        onError: () => {
          setIsSubmitting(false)
          toast({
            title: "Gagal Menyimpan",
            description: "Terjadi kesalahan saat menyimpan tindak lanjut.",
            variant: "destructive",
          })
        },
      }
    )
  }

  const riskBadgeStyles = {
    TINGGI: "bg-rose-50 text-rose-700 border-rose-200/80",
    SEDANG: "bg-amber-50 text-amber-700 border-amber-200/80",
    RENDAH: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  }[notification.risk_level] || "bg-slate-50 text-slate-700 border-slate-200"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-[#EEF2F7] border border-white/90 shadow-[10px_10px_30px_rgba(166,178,196,0.5),-10px_-10px_30px_rgba(255,255,255,0.9)] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-white/80 border-b border-slate-200/80 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 font-extrabold text-base shrink-0">
              {notification.student_name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {notification.student_name}
                </h3>
                <span className={cn("px-2.5 py-0.5 rounded-lg text-xs font-bold border", riskBadgeStyles)}>
                  Risiko {notification.risk_level} ({notification.risk_percentage})
                </span>
                <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  {notification.class_name || "Kelas Siswa"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                LMS Moodle ID: <span className="font-mono text-slate-700 font-semibold">{notification.moodle_student_id}</span> • Mapel: <span className="text-slate-800 font-medium">{notification.course_code}</span> • Periode: <span className="font-mono text-slate-600">{notification.academic_period}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer shrink-0 transition-all active:scale-95"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 pt-3 bg-white/40 border-b border-slate-200/70 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={cn(
              "px-3.5 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer",
              activeTab === "ai"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            )}
          >
            <IconMagicWand className="w-4 h-4" />
            <span>Rekomendasi AI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("metrics")}
            className={cn(
              "px-3.5 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer",
              activeTab === "metrics"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            )}
          >
            <IconFile className="w-4 h-4" />
            <span>8 Metrik Moodle</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("factors")}
            className={cn(
              "px-3.5 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer",
              activeTab === "factors"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            )}
          >
            <IconAlert className="w-4 h-4" />
            <span>Pemicu Risiko ({notification.risk_factors.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wa")}
            className={cn(
              "px-3.5 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer",
              activeTab === "wa"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            )}
          >
            <IconSend className="w-4 h-4" />
            <span>Draf WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("interventions")}
            className={cn(
              "px-3.5 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer",
              activeTab === "interventions"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            )}
          >
            <IconHandshake className="w-4 h-4" />
            <span>Tindak Lanjut</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: AI NARRATION */}
          {activeTab === "ai" && (
            <div className="space-y-4 animate-in fade-in-0 duration-150">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                      <IconMagicWand className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Analisis Narasi AI (Qwen SLM Model)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Target Komunikasi: {isWaliKelas ? "Pendampingan Santai Wali Kelas" : "Layanan Bimbingan Konseling Sekolah"}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    SLM Generative
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                  {notification.ai_narration || "Belum ada narasi terstruktur yang dihasilkan."}
                </div>

                {notification.intervention_urgency && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900">
                    <IconExclamation className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Urgensi Intervensi Sistem:</span>
                      <span>{notification.intervention_urgency}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 8 MOODLE METRICS */}
          {activeTab === "metrics" && (
            <div className="space-y-3 animate-in fade-in-0 duration-150">
              <p className="text-xs text-slate-500 font-medium">
                Data perilaku ditambang otomatis dari kebiasaan belajar alami siswa di LMS Moodle selama 60 hari semester:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Hari Inaktif</span>
                  <p className="text-lg sm:text-xl font-mono font-extrabold text-slate-900">
                    {metrics.days_inactive ?? "-"} <span className="text-xs font-normal text-slate-500">hari</span>
                  </p>
                  <span className="text-[10px] text-slate-500">Absen dari portal</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Total Klik Materi</span>
                  <p className="text-lg sm:text-xl font-mono font-extrabold text-slate-900">
                    {metrics.total_clicks ?? "-"} <span className="text-xs font-normal text-slate-500">klik</span>
                  </p>
                  <span className="text-[10px] text-slate-500">Aktivitas akses modul</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Tugas Belum Submit</span>
                  <p className={cn("text-lg sm:text-xl font-mono font-extrabold", (metrics.missing_assignments ?? 0) > 0 ? "text-rose-600" : "text-slate-900")}>
                    {metrics.missing_assignments ?? 0} <span className="text-xs font-normal text-slate-500">tugas</span>
                  </p>
                  <span className="text-[10px] text-slate-500">Tugas tertunggak</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Tugas Terlambat</span>
                  <p className={cn("text-lg sm:text-xl font-mono font-extrabold", (metrics.late_submission_count ?? 0) > 0 ? "text-amber-600" : "text-slate-900")}>
                    {metrics.late_submission_count ?? 0} <span className="text-xs font-normal text-slate-500">kali</span>
                  </p>
                  <span className="text-[10px] text-slate-500">Submit lewat batas</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Hari Aktif Login</span>
                  <p className="text-lg sm:text-xl font-mono font-extrabold text-slate-900">
                    {metrics.active_days ?? "-"} <span className="text-xs font-normal text-slate-500">hari</span>
                  </p>
                  <span className="text-[10px] text-slate-500">Frekuensi login unik</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Tugas Selesai</span>
                  <p className="text-lg sm:text-xl font-mono font-extrabold text-slate-900">
                    {metrics.tasks_submitted ?? "-"} <span className="text-xs font-normal text-slate-500">tugas</span>
                  </p>
                  <span className="text-[10px] text-slate-500">Tuntas dikerjakan</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Nilai Rata-rata</span>
                  <p className="text-lg sm:text-xl font-mono font-extrabold text-slate-900">
                    {metrics.avg_score !== undefined ? Number(metrics.avg_score).toFixed(1) : "-"}
                  </p>
                  <span className="text-[10px] text-slate-500">Skala 100</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Nilai Terendah</span>
                  <p className="text-lg sm:text-xl font-mono font-extrabold text-slate-900">
                    {metrics.min_score !== undefined ? Number(metrics.min_score).toFixed(1) : "-"}
                  </p>
                  <span className="text-[10px] text-slate-500">Kuis terlemah</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RISK FACTORS */}
          {activeTab === "factors" && (
            <div className="space-y-3 animate-in fade-in-0 duration-150">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Faktor Pemicu Risiko Terdeteksi (Rule-Based Triggers)
                </h4>
                <div className="space-y-2">
                  {notification.risk_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5 text-xs text-slate-800 font-medium"
                    >
                      <div className="w-5 h-5 rounded-md bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        !
                      </div>
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WHATSAPP MESSAGE */}
          {activeTab === "wa" && (
            <div className="space-y-4 animate-in fade-in-0 duration-150">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Draf Notifikasi WhatsApp Pendidik
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Status: <span className="font-semibold uppercase text-slate-700">{notification.status}</span> • No. Tujuan: <span className="font-mono text-slate-700">{notification.target_phone || "Nomor Guru Terdaftar"}</span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyWa}
                    className="h-8 text-xs font-bold"
                  >
                    {isCopied ? <IconCheck className="w-3.5 h-3.5 text-emerald-600" /> : <IconSend className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Tersalin!" : "Salin Pesan"}</span>
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-[#EFEAE2] border border-slate-300/80 text-xs sm:text-sm text-slate-800 font-sans whitespace-pre-wrap leading-relaxed shadow-inner">
                  {notification.wa_message || "Draf pesan belum diformulasikan."}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INTERVENTIONS & ACTIONS */}
          {activeTab === "interventions" && (
            <div className="space-y-5 animate-in fade-in-0 duration-150">
              
              {/* Existing Interventions */}
              {notification.interventions && notification.interventions.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Riwayat Tindak Lanjut Siswa ({notification.interventions.length})
                  </h4>
                  <div className="space-y-2">
                    {notification.interventions.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            {inv.intervention_type.replace(/_/g, " ")}
                          </span>
                          <span className="text-slate-400 font-medium">
                            {inv.counselor?.name || "Pendidik"} • {new Date(inv.created_at).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                          {inv.action_notes}
                        </p>
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                          <span>Status: <strong className="text-slate-700">{inv.student_progress}</strong></span>
                          {inv.follow_up_date && (
                            <span>Evaluasi: <strong className="text-slate-700">{inv.follow_up_date}</strong></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Intervention Form */}
              <form onSubmit={handleSubmitIntervention} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <IconHandshake className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Catat Tindak Lanjut / Intervensi Baru
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Jenis Tindakan</Label>
                    <select
                      value={interventionType}
                      onChange={(e) => setInterventionType(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                      {isWaliKelas ? (
                        <>
                          <option value="KONFIRMASI_WALI">Konfirmasi Santai di Kelas (Wali Kelas)</option>
                          <option value="PEMANGGILAN">Pendampingan Khusus Belajar</option>
                          <option value="KONSELING_INDIVIDU">Klarifikasi Kendala Gawai/LMS</option>
                          <option value="HOME_VISIT">Rujuk ke Guru BK Sekolah</option>
                          <option value="LAINNYA">Tindakan Lainnya</option>
                        </>
                      ) : (
                        <>
                          <option value="KONSELING_INDIVIDU">Sesi Konseling Individu (BK)</option>
                          <option value="PEMANGGILAN">Pemanggilan Siswa ke Ruang BK</option>
                          <option value="KONFIRMASI_WALI">Koordinasi dengan Wali Kelas</option>
                          <option value="HOME_VISIT">Kunjungan Rumah (Home Visit)</option>
                          <option value="LAINNYA">Tindakan Lainnya</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Perkembangan Siswa</Label>
                    <select
                      value={studentProgress}
                      onChange={(e) => setStudentProgress(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="DALAM_PEMANTAUAN">Dalam Pemantauan Aktif</option>
                      <option value="MEMBAIK">Menunjukkan Perbaikan Belajar</option>
                      <option value="TETAP">Belum Ada Perubahan</option>
                      <option value="MEMBURUK">Kondisi Belajar Memburuk</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Catatan Hasil Tindakan / Konfirmasi</Label>
                  <Textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder={
                      isWaliKelas
                        ? "Contoh: Mengonfirmasi alasan siswa inaktif di LMS. Siswa menyampaikan bahwa kuota internet habis dan gawai dipakai bergantian dengan orang tua..."
                        : "Contoh: Siswa dipanggil ke ruang BK untuk konseling pribadi mengenai penurunan komitmen belajar dan keterlambatan tugas berturut-turut..."
                    }
                    rows={3}
                    className="text-xs resize-none bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Jadwal Evaluasi / Follow-up</Label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-5 sm:pt-0">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 h-10 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                    >
                      {isSubmitting ? <IconLoader className="w-4 h-4 animate-spin" /> : <IconSave className="w-4 h-4" />}
                      <span>Simpan Tindak Lanjut</span>
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white/90 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            E-Jurnal STIKMAS • Early Warning System LMS Moodle
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto h-9 text-xs font-bold"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}
