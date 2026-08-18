import * as React from "react"
import {
  IconArrowLeft,
  IconGraduationCap,
  IconCalendarCheck,
  IconAlert,
  IconHandshake,
  IconCalendar,
  IconBook,
  IconCheck,
  IconLock,
  IconAi,
  IconChevronRight,
  IconRefresh,
} from "@/components/ui/storage-icon"
import { Link, usePage, router } from "@inertiajs/react"
import { AppLayout } from "@/Layouts/AppLayout"
import { EwsStatusBadge } from "@/components/ews/EwsStatusBadge"
import { AiAdvisorCard, type AiAdvisorData } from "@/components/ews/AiAdvisorCard"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

export interface StudentShowProps {
  student?: any
  bkCases?: any[]
  currentClass?: any
}

export default function StudentShow({
  student,
  bkCases = [],
  currentClass,
}: StudentShowProps = {}) {
  const page = usePage()
  const authUser = (page.props as any)?.auth?.user
  const userRole = (authUser?.role || "guru_kelas") as "guru_kelas" | "guru_bk" | "kepsek"

  // Active Tab for Deep Exploration: "overview" | "cases" | "academic" | "attendance" | "behavior"
  const [activeTab, setActiveTab] = React.useState<"overview" | "cases" | "academic" | "attendance" | "behavior">("overview")

  // Dynamically resolve dashboard back URL and text based on role
  const getDashboardBackInfo = () => {
    switch (userRole) {
      case "guru_bk":
        return {
          href: "/dashboard/guru-bk",
          label: "Kembali ke Dashboard Guru BK",
        }
      case "kepsek":
        return {
          href: "/dashboard/kepsek",
          label: "Kembali ke Dashboard Kepala Sekolah",
        }
      case "guru_kelas":
      default:
        return {
          href: "/dashboard/guru-kelas",
          label: "Kembali ke Dashboard Kelas",
        }
    }
  }

  const backInfo = getDashboardBackInfo()

  // 1. Real Academic Calculations
  const academicRecords: any[] = student?.academic_records || []
  const hasAcademic = academicRecords.length > 0
  const academicAvg = hasAcademic
    ? (
        academicRecords.reduce((acc: number, curr: any) => acc + (Number(curr.score) || 0), 0) /
        academicRecords.length
      ).toFixed(1)
    : "-"

  // Real Lowest & Highest Subject Calculation
  let lowestSubjectText = "-"
  let highestSubjectText = "-"
  let academicTrend = "Menunggu Data"

  if (hasAcademic) {
    const sortedByScore = [...academicRecords].sort((a, b) => Number(a.score) - Number(b.score))
    const lowest = sortedByScore[0]
    const highest = sortedByScore[sortedByScore.length - 1]

    lowestSubjectText = `${lowest?.subject?.name || "Mapel"} (${lowest?.score})`
    highestSubjectText = `${highest?.subject?.name || "Mapel"} (${highest?.score})`

    if (academicRecords.length >= 3) {
      const recent = academicRecords.slice(0, 3)
      const firstScore = Number(recent[recent.length - 1].score)
      const latestScore = Number(recent[0].score)
      if (latestScore > firstScore + 3) academicTrend = "Tren Meningkat"
      else if (latestScore < firstScore - 3) academicTrend = "Tren Menurun"
      else academicTrend = "Tren Stabil"
    } else {
      academicTrend = "Data Awal Tercatat"
    }
  }

  // 2. Real Attendance Calculations (30 days)
  const attendanceRecords: any[] = student?.attendance_records || []
  const hasAttendance = attendanceRecords.length > 0
  const hadirCount = attendanceRecords.filter((r: any) => r.status === "HADIR").length
  const terlambatCount = attendanceRecords.filter((r: any) => r.status === "TERLAMBAT").length
  const sakitCount = attendanceRecords.filter((r: any) => r.status === "SAKIT").length
  const izinCount = attendanceRecords.filter((r: any) => r.status === "IZIN").length
  const alpaCount = attendanceRecords.filter((r: any) => r.status === "ALPA").length

  const attendanceRate = hasAttendance
    ? (((hadirCount + terlambatCount) / attendanceRecords.length) * 100).toFixed(1)
    : "-"

  // Calculate consecutive alpa streak
  let consecutiveAlpa = 0
  for (const r of attendanceRecords) {
    if (r.status === "ALPA") {
      consecutiveAlpa++
    } else {
      break
    }
  }

  // 3. Real Behavior Observations
  const observations: any[] = student?.behavior_observations || []
  const latestObservation = observations[0]

  // 4. Real AI Advisor Data
  const latestAiLog = student?.ai_logs?.[0]
  const aiAdvisorData: AiAdvisorData = {
    risk_overview:
      latestAiLog?.risk_overview ||
      `Sistem EWS memantau profil ${student?.name || "Siswa"}. Status evaluasi 4 pilar EWS saat ini adalah ${student?.ews_score?.status || "DATA_BELUM_LENGKAP"}. Seluruh catatan observasi perilaku guru, nilai akademik, absensi, dan portofolio BK tersinkronisasi.`,
    primary_concerns:
      latestAiLog?.primary_concerns && latestAiLog.primary_concerns.length > 0
        ? latestAiLog.primary_concerns
        : [
            `Status EWS Terkini: ${student?.ews_score?.status || "DATA_BELUM_LENGKAP"}`,
            observations.length > 0
              ? `Observasi Perilaku Terbaru (${latestObservation?.category}): ${latestObservation?.ai_structured_summary || latestObservation?.raw_text}`
              : "Belum terdeteksi pemicu anomali perilaku berat di kelas.",
            bkCases.length > 0
              ? `Penanganan Kasus BK: ${bkCases.length} sesi konseling aktif tercatat.`
              : "Tidak ada riwayat kasus bimbingan konseling berat aktif.",
          ],
    recommendation_guru_kelas: latestAiLog?.recommendations?.for_homeroom_teacher,
    recommendation_guru_bk: latestAiLog?.recommendations?.for_counselor_bk,
    recommendation_kepsek: latestAiLog?.recommendations?.for_principal,
    data_limitation_note: latestAiLog?.data_limitation_note,
    last_updated: latestAiLog?.generated_at || "Sintesis AI Otomatis",
    model_version: latestAiLog?.model_version,
  }

  // 5. Dynamic Longitudinal Timeline
  const timelineLogs: any[] = []
  observations.forEach((obs: any, i: number) => {
    timelineLogs.push({
      id: `obs-${obs.id || i}`,
      raw_date: obs.date || "",
      date: obs.date || "Terbaru",
      actor: obs.confirmed_by_user?.name || "Wali / Guru Kelas",
      title: `Observasi Perilaku: ${obs.category?.replace(/_/g, " ")}`,
      description: obs.ai_structured_summary || obs.raw_text,
      badge: "Jurnal Observasi",
      badgeColor: "bg-blue-100/80 text-blue-800",
      scores: {
        participation: obs.participation_score,
        homework: obs.homework_score,
        quiz: obs.quiz_score,
      },
    })
  })

  bkCases.forEach((cs: any, i: number) => {
    const caseTypeStr = Array.isArray(cs.case_types) ? cs.case_types.join(", ") : cs.case_types || "Konseling"
    timelineLogs.push({
      id: `case-${cs.id || i}`,
      raw_date: cs.incident_date || "",
      date: cs.incident_date || "Terbaru",
      actor: cs.handler?.name || "Guru BK",
      title: `Sesi Bimbingan Konseling (${caseTypeStr})`,
      description: cs.confidential_notes || "Rekam dinamika bimbingan konseling terenkripsi.",
      badge: `Urgensi ${cs.severity || "SEDANG"}`,
      badgeColor: cs.severity === "BERAT" ? "bg-rose-100/80 text-rose-800" : "bg-indigo-100/80 text-indigo-800",
      follow_up: cs.follow_up_actions,
    })
  })

  // Sort timeline chronologically (newest first)
  timelineLogs.sort((a, b) => (b.raw_date > a.raw_date ? 1 : -1))

  const studentName = student?.name || "Siswa Terdaftar"
  const studentNisn = student?.nisn || student?.nis || "-"
  const studentClassName = currentClass?.name || student?.classes?.[0]?.name || "-"
  const homeroomTeacherName = currentClass?.homeroom_teacher?.name || "Wali Kelas"
  const academicYear = currentClass?.academic_year || "2026/2027 Ganjil"
  const ewsStatus = (student?.ews_score?.status || "DATA_BELUM_LENGKAP") as any

  return (
    <AppLayout
      currentRole={userRole}
      activeMenu="siswa_profile"
      title={`Lembar Profil & Portofolio Siswa 360°`}
      subtitle={`Evaluasi komprehensif 4 pilar EWS, riwayat kasus BK, jurnal observasi, dan rekomendasi AI`}
    >
      {/* Top Bar with Dynamic Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backInfo.href}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 neo-btn bg-[#EEF2F7] border border-white/90 p-2.5 px-4 rounded-2xl transition-all shadow-xs"
        >
          <IconArrowLeft className="w-4 h-4 text-slate-600" />
          <span>{backInfo.label}</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Navigasi Tab:</span>
          <div className="flex items-center gap-1 p-1 rounded-2xl neo-inset bg-[#E7EDF4] border border-slate-300/40">
            {(
              [
                { key: "overview", label: "Ringkasan 4 Pilar" },
                { key: "cases", label: `Lembar Kasus BK (${bkCases.length})` },
                { key: "academic", label: `Akademik (${academicRecords.length})` },
                { key: "attendance", label: `Presensi (${attendanceRecords.length})` },
                { key: "behavior", label: `Observasi (${observations.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  activeTab === tab.key
                    ? "neo-btn-primary text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 neo-btn bg-transparent border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Header Profile Card with Neumorphism */}
      <section className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl neo-btn bg-[#EEF2F7] text-blue-700 font-extrabold text-2xl flex items-center justify-center shrink-0 border border-white/90 shadow-sm">
              {studentName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {studentName}
                </h1>
                <span className="px-3 py-1 rounded-xl text-xs font-bold neo-pill bg-white text-slate-700 border border-white/80">
                  {studentClassName}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-mono">
                  NISN: {studentNisn}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
                Wali Kelas: <strong className="text-slate-800">{homeroomTeacherName}</strong> • Tahun Ajaran: {academicYear}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            <div className="text-right hidden sm:block">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                Status EWS Siswa
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {student?.ews_score?.calculated_at ? `Evaluasi: ${student.ews_score.calculated_at}` : "Tersinkronisasi Real-Time"}
              </span>
            </div>
            <EwsStatusBadge status={ewsStatus} size="lg" />
          </div>
        </div>
      </section>

      {/* TAB 1: OVERVIEW (4 Pillars & Radar Bento) */}
      {activeTab === "overview" && (
        <>
          {/* 4 Pilar Evaluation Grid (2x2) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Pilar 1: Akademik */}
            <div className="p-6 sm:p-7 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]">
              <div className="flex items-center justify-between border-b border-slate-300/40 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl neo-btn text-blue-700 flex items-center justify-center shrink-0 border border-white/90">
                    <IconGraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      1. Pilar Akademik (AK)
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      {academicRecords.length} Catatan Penilaian Tercatat
                    </span>
                  </div>
                </div>
                <EwsStatusBadge status={student?.ews_score?.academic_sub_status || "DATA_BELUM_LENGKAP"} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-3.5 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1 border border-slate-300/40">
                  <span className="text-xs text-slate-500 font-medium block">Rata-rata Nilai:</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block font-mono">
                    {academicAvg}
                  </span>
                  <span className="text-xs text-blue-700 font-bold block">
                    {academicTrend}
                  </span>
                </div>

                <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1 border border-slate-300/40">
                  <span className="text-xs text-slate-500 font-medium block">Mapel Terendah:</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                    {lowestSubjectText}
                  </span>
                  <span className="text-xs text-slate-500 block font-medium">
                    Tertinggi: <strong className="text-slate-800">{highestSubjectText}</strong>
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Ambang batas KKM standar: 75.0</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("academic")}
                  className="font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  Lihat Riwayat Nilai &rarr;
                </button>
              </div>
            </div>

            {/* Pilar 2: Kehadiran */}
            <div className="p-6 sm:p-7 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]">
              <div className="flex items-center justify-between border-b border-slate-300/40 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl neo-btn text-orange-600 flex items-center justify-center shrink-0 border border-white/90">
                    <IconCalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      2. Pilar Kehadiran (KH)
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      Rekapitulasi 30 Hari ({attendanceRecords.length} Hari KBM)
                    </span>
                  </div>
                </div>
                <EwsStatusBadge status={student?.ews_score?.attendance_sub_status || "DATA_BELUM_LENGKAP"} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-3.5 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1 border border-slate-300/40">
                  <span className="text-xs text-slate-500 font-medium block">Persentase Hadir:</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block font-mono">
                    {attendanceRate === "-" ? "-" : `${attendanceRate}%`}
                  </span>
                  <span className="text-xs text-orange-700 font-bold block">
                    {alpaCount > 0 ? `${alpaCount} Alpa Tercatat` : "Disiplin Kehadiran Baik"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1 border border-slate-300/40">
                  <span className="text-xs text-slate-500 font-medium block">Alpa Beruntun:</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 block font-mono">
                    {consecutiveAlpa} Hari
                  </span>
                  <span className="text-[11px] text-slate-500 block font-medium">
                    Sakit: {sakitCount} • Izin: {izinCount} • Terlambat: {terlambatCount}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Ambang risiko absensi: &lt;85%</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("attendance")}
                  className="font-bold text-orange-700 hover:text-orange-900 cursor-pointer"
                >
                  Lihat Log Presensi &rarr;
                </button>
              </div>
            </div>

            {/* Pilar 3: Perilaku */}
            <div className="p-6 sm:p-7 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]">
              <div className="flex items-center justify-between border-b border-slate-300/40 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl neo-btn text-amber-600 flex items-center justify-center shrink-0 border border-white/90">
                    <IconAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      3. Pilar Perilaku Kelas (PR)
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      {observations.length} Jurnal Observasi Guru
                    </span>
                  </div>
                </div>
                <EwsStatusBadge status={student?.ews_score?.behavior_sub_status || "NORMAL"} size="sm" />
              </div>

              <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] text-xs sm:text-sm space-y-2 border border-slate-300/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    Kategori Terkini: {latestObservation?.category?.replace(/_/g, " ") || "Belum Ada Catatan"}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-bold uppercase px-2 py-0.5 rounded-lg neo-pill border border-white/80",
                      latestObservation?.severity === "BERAT"
                        ? "bg-rose-100 text-rose-800"
                        : latestObservation?.severity === "SEDANG"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    )}
                  >
                    Tingkat: {latestObservation?.severity || "NORMAL"}
                  </span>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed font-medium line-clamp-3">
                  {latestObservation?.ai_structured_summary || latestObservation?.raw_text || "Belum ada catatan observasi perilaku harian tercatat untuk siswa ini."}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Observasi terintegrasi AI</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("behavior")}
                  className="font-bold text-amber-800 hover:text-amber-900 cursor-pointer"
                >
                  Lihat Riwayat Observasi &rarr;
                </button>
              </div>
            </div>

            {/* Pilar 4: Konseling BK */}
            <div className="p-6 sm:p-7 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]">
              <div className="flex items-center justify-between border-b border-slate-300/40 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl neo-btn text-indigo-700 flex items-center justify-center shrink-0 border border-white/90">
                    <IconHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      4. Pilar Bimbingan Konseling (BK)
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      Portofolio &amp; Lembar Kasus Konselor
                    </span>
                  </div>
                </div>
                <EwsStatusBadge status={student?.ews_score?.bk_sub_status || "NORMAL"} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-3.5 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1 border border-slate-300/40">
                  <span className="text-xs text-slate-500 font-medium block">Kasus Aktif:</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-indigo-700 block font-mono">
                    {bkCases.length} Kasus
                  </span>
                  <span className="text-xs text-slate-500 block font-medium">
                    {bkCases.filter((c: any) => c.status === "DALAM_PROSES").length} Dalam Mediasi
                  </span>
                </div>

                <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1 border border-slate-300/40">
                  <span className="text-xs text-slate-500 font-medium block">Total Sesi Bimbingan:</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block font-mono">
                    {bkCases.length} Kali
                  </span>
                  <span className="text-xs text-slate-500 block font-medium truncate font-mono">
                    {bkCases[0]?.incident_date ? `Terakhir: ${bkCases[0].incident_date}` : "Belum Ada Kasus"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Kerahasiaan terjamin UU PDP</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("cases")}
                  className="font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                >
                  Buka Lembar Kasus BK &rarr;
                </button>
              </div>
            </div>
          </section>

          {/* Grand AI EWS Advisor Panel */}
          <section id="ai-advisor" className="scroll-mt-20">
            <AiAdvisorCard
              studentId={student?.id}
              data={aiAdvisorData}
              studentName={studentName}
              ews_status={ewsStatus}
            />
          </section>
        </>
      )}

      {/* TAB 2: LEMBAR KASUS & KONSELING BK */}
      {activeTab === "cases" && (
        <section className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/40 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl neo-btn text-indigo-700 flex items-center justify-center shrink-0 border border-white/90">
                <IconHandshake className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Lembar Portofolio Kasus &amp; Bimbingan Konseling
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold neo-pill bg-indigo-50/80 text-indigo-800 border border-white/80">
                    {bkCases.length} Kasus Tercatat
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Rekam jejak resmi penanganan kasus bimbingan, mediasi, dan tindak lanjut psikososial siswa
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/guru-bk#kasus"
                className="px-4 py-2 rounded-xl neo-btn-primary text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
              >
                <IconHandshake className="w-3.5 h-3.5" />
                <span>Input Sesi Bimbingan Baru</span>
              </Link>
            </div>
          </div>

          {bkCases.length === 0 ? (
            <div className="p-8 text-center neo-inset bg-[#E7EDF4] rounded-2xl space-y-2 border border-slate-300/40">
              <IconCheck className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Kasus BK Aktif</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Siswa {studentName} tidak memiliki riwayat pelanggaran atau kasus bimbingan konseling berat.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bkCases.map((caseItem: any, idx: number) => {
                const caseTypesList = Array.isArray(caseItem.case_types)
                  ? caseItem.case_types
                  : [caseItem.case_types || "KONSELING_INDIVIDU"]
                const followUps = Array.isArray(caseItem.follow_up_actions)
                  ? caseItem.follow_up_actions
                  : []

                return (
                  <div
                    key={caseItem.id || idx}
                    className="p-5 sm:p-6 rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 space-y-3.5 shadow-xs hover:bg-white/80 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl neo-btn bg-[#EEF2F7] text-indigo-700 font-extrabold flex items-center justify-center shrink-0 text-xs border border-white/90">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {caseTypesList.map((t: string, ti: number) => (
                              <span
                                key={ti}
                                className="px-2.5 py-0.5 rounded-md text-xs font-extrabold neo-pill bg-white text-indigo-800 border border-white/80"
                              >
                                {t.replace(/_/g, " ")}
                              </span>
                            ))}
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[11px] font-bold neo-pill border border-white/90",
                                caseItem.severity === "BERAT"
                                  ? "bg-rose-100 text-rose-800"
                                  : caseItem.severity === "SEDANG"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              )}
                            >
                              Tingkat {caseItem.severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-1">
                            Tanggal Kejadian: <strong>{caseItem.incident_date}</strong> • Dilaporkan: {caseItem.reported_date || caseItem.incident_date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-xl text-xs font-bold uppercase neo-pill border border-white/90",
                            caseItem.status === "DIESKALASI_KE_KEPSEK"
                              ? "bg-rose-100/90 text-rose-800"
                              : caseItem.status === "DALAM_PROSES"
                              ? "bg-amber-100/90 text-amber-800"
                              : "bg-emerald-100/90 text-emerald-800"
                          )}
                        >
                          Status: {caseItem.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* Confidential Notes */}
                    <div className="p-4 rounded-xl neo-inset bg-[#E7EDF4] text-xs sm:text-sm text-slate-800 leading-relaxed font-medium space-y-1.5 border border-slate-300/40">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                        <IconLock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Catatan Sesi Konseling Terenkripsi:</span>
                      </div>
                      <p>{caseItem.confidential_notes || "Tidak ada catatan verbatim tambahan."}</p>
                    </div>

                    {/* Follow-up actions & Counselor */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-600">Rencana Tindak Lanjut:</span>
                        {followUps.length > 0 ? (
                          followUps.map((act: string, ai: number) => (
                            <span
                              key={ai}
                              className="px-2 py-0.5 rounded-md neo-pill bg-white text-indigo-700 border border-white/80 font-semibold"
                            >
                              {act}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic">Konseling berkala rutin</span>
                        )}
                      </div>

                      <span className="text-slate-500 font-medium">
                        Konselor Penanggung Jawab: <strong className="text-slate-800">{caseItem.handler?.name || "Guru BK"}</strong>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: RIWAYAT NILAI AKADEMIK */}
      {activeTab === "academic" && (
        <section className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/40 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl neo-btn text-blue-700 flex items-center justify-center shrink-0 border border-white/90">
                <IconGraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
                  Riwayat Catatan Nilai Akademik Siswa
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Rata-rata: <strong className="text-slate-800 font-mono">{academicAvg}</strong> • Total {academicRecords.length} rekap penilaian tercatat
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold neo-pill bg-white text-blue-800 border border-white/80">
                Pilar AK: {student?.ews_score?.academic_sub_status || "DATA_BELUM_LENGKAP"}
              </span>
            </div>
          </div>

          {academicRecords.length === 0 ? (
            <div className="p-8 text-center neo-inset bg-[#E7EDF4] rounded-2xl space-y-2 border border-slate-300/40">
              <IconBook className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Belum Ada Catatan Nilai</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Gunakan tombol "Input Nilai Akademik" di Dashboard Guru Kelas untuk mencatat nilai tugas, kuis, atau ulangan siswa.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 overflow-hidden">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-[#E7EDF4] text-slate-700 font-bold uppercase tracking-wider text-xs border-b border-slate-200/60">
                  <tr>
                    <th className="py-3 px-4 text-center">No</th>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-4 text-center">Jenis Penilaian</th>
                    <th className="py-3 px-4">Label / Periode</th>
                    <th className="py-3 px-4 text-center">Nilai Siswa</th>
                    <th className="py-3 px-4 text-center">KKM</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {academicRecords.map((rec: any, idx: number) => {
                    const scoreVal = Number(rec.score) || 0
                    const passingGrade = rec.subject?.passing_grade ?? 75
                    const isBelowKkm = scoreVal < passingGrade

                    return (
                      <tr key={rec.id || idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{rec.subject?.name || "Mata Pelajaran"}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold neo-pill bg-white text-slate-700 border border-white/80">
                            {rec.assessment_type || "TUGAS"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{rec.period_name || "-"}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-sm">
                          <span className={cn(isBelowKkm ? "text-rose-600" : "text-slate-900")}>{scoreVal}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-500">{passingGrade}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-lg text-[10px] font-bold neo-pill border border-white/80",
                              isBelowKkm ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            )}
                          >
                            {isBelowKkm ? "Remedial" : "Tuntas"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500 text-xs">
                          {rec.created_at ? new Date(rec.created_at).toLocaleDateString("id-ID") : "-"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 4: RIWAYAT PRESENSI KEHADIRAN */}
      {activeTab === "attendance" && (
        <section className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/40 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl neo-btn text-orange-600 flex items-center justify-center shrink-0 border border-white/90">
                <IconCalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
                  Log Presensi &amp; Kehadiran Siswa (30 Hari Terakhir)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Tingkat Kehadiran: <strong className="text-slate-800 font-mono">{attendanceRate}%</strong> • Total {attendanceRecords.length} data harian
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg neo-pill bg-emerald-50/80 text-emerald-800 border border-white/80">
                Hadir: {hadirCount}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg neo-pill bg-amber-50/80 text-amber-800 border border-white/80">
                Sakit: {sakitCount}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg neo-pill bg-blue-50/80 text-blue-800 border border-white/80">
                Izin: {izinCount}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg neo-pill bg-rose-50/80 text-rose-800 border border-white/80">
                Alpa: {alpaCount}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg neo-pill bg-orange-50/80 text-orange-800 border border-white/80">
                Terlambat: {terlambatCount}
              </span>
            </div>
          </div>

          {attendanceRecords.length === 0 ? (
            <div className="p-8 text-center neo-inset bg-[#E7EDF4] rounded-2xl space-y-2 border border-slate-300/40">
              <IconCalendar className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Belum Ada Data Presensi Harian</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Gunakan tombol "Input Presensi Harian" di Dashboard Guru Kelas untuk mulai mencatat absensi siswa.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 overflow-hidden">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-[#E7EDF4] text-slate-700 font-bold uppercase tracking-wider text-xs border-b border-slate-200/60">
                  <tr>
                    <th className="py-3 px-4 text-center">No</th>
                    <th className="py-3 px-4">Tanggal KBM</th>
                    <th className="py-3 px-4 text-center">Status Presensi</th>
                    <th className="py-3 px-4 text-center">Keterlambatan</th>
                    <th className="py-3 px-4">Keterangan / Catatan Tambahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {attendanceRecords.map((att: any, idx: number) => {
                    const isAbnormal = att.status !== "HADIR"

                    return (
                      <tr key={att.id || idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{att.date}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-lg text-xs font-extrabold neo-pill border border-white/90",
                              att.status === "HADIR"
                                ? "bg-emerald-100 text-emerald-800"
                                : att.status === "ALPA"
                                ? "bg-rose-100 text-rose-800"
                                : att.status === "TERLAMBAT"
                                ? "bg-orange-100 text-orange-800"
                                : att.status === "SAKIT"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            )}
                          >
                            {att.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">
                          {att.status === "TERLAMBAT" && att.late_minutes ? `${att.late_minutes} menit` : "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {att.notes || (isAbnormal ? "-" : "Kehadiran KBM tercatat reguler")}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 5: JURNAL OBSERVASI PERILAKU KELAS */}
      {activeTab === "behavior" && (
        <section className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/40 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl neo-btn text-amber-600 flex items-center justify-center shrink-0 border border-white/90">
                <IconAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
                  Jurnal Observasi Perilaku &amp; Karakter Kelas
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Total {observations.length} observasi tercatat oleh Wali / Guru Kelas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/guru-kelas#observasi"
                className="px-4 py-2 rounded-xl neo-btn-primary text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
              >
                <IconBook className="w-3.5 h-3.5" />
                <span>Tambah Jurnal Observasi</span>
              </Link>
            </div>
          </div>

          {observations.length === 0 ? (
            <div className="p-8 text-center neo-inset bg-[#E7EDF4] rounded-2xl space-y-2 border border-slate-300/40">
              <IconBook className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Belum Ada Catatan Observasi</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Wali / Guru Kelas belum mencatat jurnal observasi perilaku untuk siswa ini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {observations.map((obs: any, idx: number) => (
                <div
                  key={obs.id || idx}
                  className="p-5 sm:p-6 rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 space-y-3 shadow-xs hover:bg-white/80 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{obs.date}</span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold neo-pill bg-white text-slate-800 border border-white/80">
                        {obs.category?.replace(/_/g, " ")}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[11px] font-bold neo-pill border border-white/90",
                          obs.severity === "BERAT"
                            ? "bg-rose-100 text-rose-800"
                            : obs.severity === "SEDANG"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        )}
                      >
                        Tingkat {obs.severity}
                      </span>
                    </div>

                    <span className="text-xs text-slate-500 font-medium">
                      Dicatat oleh: <strong className="text-slate-800">{obs.confirmed_by_user?.name || "Wali Kelas"}</strong>
                    </span>
                  </div>

                  {/* Narrative */}
                  <div className="p-4 rounded-xl neo-inset bg-[#E7EDF4] text-xs sm:text-sm text-slate-800 leading-relaxed font-medium border border-slate-300/40">
                    <p>{obs.ai_structured_summary || obs.raw_text}</p>
                  </div>

                  {/* 3 Scales */}
                  {(obs.participation_score || obs.homework_score || obs.quiz_score) && (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                      <div className="p-2 rounded-xl neo-card-subtle bg-[#EEF2F7] border border-white/90">
                        <span className="text-[10px] text-slate-500 font-sans block">Keaktifan</span>
                        <span className="font-bold text-slate-800">{obs.participation_score || 3}/5</span>
                      </div>
                      <div className="p-2 rounded-xl neo-card-subtle bg-[#EEF2F7] border border-white/90">
                        <span className="text-[10px] text-slate-500 font-sans block">Ketertiban</span>
                        <span className="font-bold text-slate-800">{obs.homework_score || 3}/5</span>
                      </div>
                      <div className="p-2 rounded-xl neo-card-subtle bg-[#EEF2F7] border border-white/90">
                        <span className="text-[10px] text-slate-500 font-sans block">Konsentrasi</span>
                        <span className="font-bold text-slate-800">
                          {obs.quiz_score > 5 ? Math.round(obs.quiz_score / 20) : obs.quiz_score || 3}/5
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Longitudinal Observation & Activity Timeline */}
      <section className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] space-y-5">
        <div className="flex items-center justify-between border-b border-slate-300/40 pb-4">
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
              Rekam Jejak Longitudinal Siswa (Kronologis)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kronologi observasi harian pendidik, perubahan presensi, dan rekam bimbingan konseling
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl neo-btn text-blue-700 flex items-center justify-center shrink-0 border border-white/90">
            <IconCalendar className="w-5 h-5" />
          </div>
        </div>

        <div className="relative pl-7 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300/60">
          {timelineLogs.length === 0 ? (
            <div className="p-6 text-center text-xs sm:text-sm text-slate-400 neo-inset bg-[#E7EDF4] rounded-2xl border border-slate-300/40">
              Belum ada riwayat aktivitas atau observasi longitudinal tercatat untuk siswa ini.
            </div>
          ) : (
            timelineLogs.map((log) => (
              <div key={log.id} className="relative space-y-1.5 group">
                <span className="absolute -left-7 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-[#EEF2F7] shadow-xs" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">{log.date}</span>
                  <span className="text-xs font-bold text-slate-700">• {log.actor}</span>
                  <span className={cn("px-2.5 py-0.5 rounded-md text-[10px] font-bold neo-pill border border-white/80", log.badgeColor)}>
                    {log.badge}
                  </span>
                </div>
                <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] text-xs sm:text-sm space-y-1.5 border border-slate-300/40">
                  <h4 className="font-bold text-slate-900">{log.title}</h4>
                  <p className="text-slate-700 leading-relaxed font-medium">{log.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </AppLayout>
  )
}
