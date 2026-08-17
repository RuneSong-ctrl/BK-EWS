import * as React from "react"
import {
  IconArrowLeft,
  IconGraduationCap,
  IconCalendarCheck,
  IconAlert,
  IconHandshake,
  IconCalendar,
} from "@/components/ui/storage-icon"
import { Link, usePage } from "@inertiajs/react"
import { AppLayout } from "@/Layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { EwsStatusBadge } from "@/components/ews/EwsStatusBadge"
import { PillarIndicators } from "@/components/ews/PillarIndicators"
import { AiAdvisorCard, type AiAdvisorData } from "@/components/ews/AiAdvisorCard"
import { cn } from "@/lib/utils"

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

  // Dynamically resolve dashboard back URL and text based on role
  const getDashboardBackInfo = () => {
    switch (userRole) {
      case "guru_bk":
        return {
          href: "/guru-bk/dashboard",
          label: "Kembali ke Dashboard Guru BK",
        }
      case "kepsek":
        return {
          href: "/kepsek/dashboard",
          label: "Kembali ke Dashboard Kepala Sekolah",
        }
      case "guru_kelas":
      default:
        return {
          href: "/guru-kelas/dashboard",
          label: "Kembali ke Dashboard Kelas",
        }
    }
  }

  const backInfo = getDashboardBackInfo()
  const hasAcademic = Boolean(student?.academic_records?.length)
  const academicAvg = hasAcademic
    ? (
      student.academic_records.reduce(
        (acc: number, curr: any) => acc + (Number(curr.score) || 0),
        0
      ) / student.academic_records.length
    ).toFixed(1)
    : "-"

  const hasAttendance = Boolean(student?.attendance_records?.length)
  const attendanceRate = hasAttendance
    ? (
      (student.attendance_records.filter(
        (r: any) => r.status === "HADIR" || r.status === "TERLAMBAT"
      ).length /
        student.attendance_records.length) *
      100
    ).toFixed(1)
    : "-"

  const alpaCount = student?.attendance_records
    ? student.attendance_records.filter((r: any) => r.status === "ALPA").length
    : 0

  const latestAiLog = student?.ai_logs?.[0]
  const observations = student?.behavior_observations || []

  const studentData = {
    id: student?.id || 1,
    name: student?.name || "Siswa Terdaftar",
    nisn: student?.nisn || student?.nis || "-",
    class_name: currentClass?.name || student?.classes?.[0]?.name || "-",
    homeroom_teacher: currentClass?.homeroom_teacher?.name || "Wali Kelas",
    academic_year: currentClass?.academic_year || "2026/2027 Ganjil",
    ews_status: (student?.ews_score?.status || "DATA_BELUM_LENGKAP") as any,
    updated_at: student?.ews_score?.calculated_at || "Belum dievaluasi",
    pillars: {
      ak: (student?.ews_score?.academic_sub_status || "DATA_BELUM_LENGKAP") as any,
      kh: (student?.ews_score?.attendance_sub_status || "DATA_BELUM_LENGKAP") as any,
      pr: (student?.ews_score?.behavior_sub_status || "NORMAL") as any,
      bk: (student?.ews_score?.bk_sub_status || "NORMAL") as any,
    },
    academic: {
      avg_score: hasAcademic ? Number(academicAvg) : "-",
      trend: hasAcademic ? "Stabil" : "Menunggu Data",
      lowest_subject: hasAcademic ? "Tercatat" : "-",
      highest_subject: hasAcademic ? "Tercatat" : "-",
      total_subjects: student?.academic_records?.length || 0,
    },
    attendance: {
      rate: attendanceRate,
      consecutive_alpa: alpaCount,
      total_alpa: alpaCount,
      total_izin: student?.attendance_records?.filter((r: any) => r.status === "IZIN").length || 0,
      total_sakit: student?.attendance_records?.filter((r: any) => r.status === "SAKIT").length || 0,
    },
    behavior: {
      total_observations: observations.length,
      latest_category: observations[0]?.category || "-",
      severity: observations[0]?.severity || "NORMAL",
      notes: observations[0]?.ai_structured_summary || "Belum ada catatan observasi perilaku.",
    },
    counseling: {
      active_cases: bkCases.length,
      total_sessions: bkCases.length,
      status: bkCases.length > 0 ? "DALAM_PROSES" : "NORMAL",
      last_session: bkCases[0]?.incident_date || "-",
    },
  }

  const aiAdvisorData: AiAdvisorData = {
    risk_overview:
      latestAiLog?.risk_overview ||
      `Sistem EWS memantau profil ${studentData.name}. Status EWS saat ini: ${studentData.ews_status}. Seluruh data observasi perilaku, nilai, dan absensi terintegrasi secara otomatis.`,
    primary_concerns:
      latestAiLog?.primary_concerns || [
        `Status Evaluasi: ${studentData.ews_status}`,
        observations.length > 0
          ? `Observasi Perilaku Terbaru: ${observations[0]?.ai_structured_summary}`
          : "Belum terdeteksi pemicu risiko kritis.",
      ],
    recommendation_guru_kelas:
      latestAiLog?.recommendations?.for_homeroom_teacher ||
      "Lakukan dialog empatik harian, pantau presensi dan keterlibatan belajar siswa di kelas.",
    recommendation_guru_bk:
      latestAiLog?.recommendations?.for_counselor_bk ||
      "Lakukan pemetaan kebutuhan bimbingan dan koordinasikan dengan wali kelas bila ada anomali presensi.",
    recommendation_kepsek:
      latestAiLog?.recommendations?.for_principal ||
      "Pantau tren agregat kelas dan pastikan kolaborasi tindak lanjut antara wali kelas dan guru BK berjalan aktif.",
    last_updated: latestAiLog?.generated_at || "Terintegrasi AI",
  }

  // Dynamic Timeline
  const timelineLogs: any[] = []
  observations.forEach((obs: any, i: number) => {
    timelineLogs.push({
      id: `obs-${obs.id || i}`,
      date: obs.date || "Terbaru",
      actor: "Wali / Guru Kelas",
      title: `Observasi Perilaku (${obs.category})`,
      description: obs.ai_structured_summary || obs.raw_text,
      badge: "Observasi AI",
      badgeColor: "bg-blue-100 text-blue-800",
    })
  })
  bkCases.forEach((cs: any, i: number) => {
    timelineLogs.push({
      id: `case-${cs.id || i}`,
      date: cs.incident_date || "Terbaru",
      actor: cs.handler?.name || "Guru BK",
      title: cs.title || "Sesi Bimbingan Konseling",
      description: cs.confidential_notes || "Rekam konseling terenkripsi.",
      badge: "Kasus BK",
      badgeColor: "bg-indigo-100 text-indigo-800",
    })
  })

  return (
    <AppLayout
      currentRole={userRole}
      activeMenu="siswa_profile"
      title="Lembar Profil Siswa 360° & AI Advisor"
      subtitle="Evaluasi menyeluruh 4 pilar EWS, rekam jejak longitudinal, dan narasi intervensi terpadu"
    >
      {/* Dynamic Back Link */}
      <div>
        <Link
          href={backInfo.href}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors p-2.5 px-4 rounded-xl hover:bg-white shadow-2xs"
        >
          <IconArrowLeft className="w-4 h-4" />
          <span>{backInfo.label}</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <section className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-slate-200/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl neo-btn bg-[#EEF2F7] text-blue-600 font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-sm">
              {studentData.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {studentData.name}
                </h1>
                <span className="px-3 py-1 rounded-xl text-xs font-bold neo-pill bg-[#E6EDF5] text-slate-700">
                  {studentData.class_name}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-mono">
                  NISN: {studentData.nisn}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
                Wali Kelas: <strong className="text-slate-800">{studentData.homeroom_teacher}</strong> &bull; Tahun Ajaran: {studentData.academic_year}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            <div className="text-right hidden sm:block">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                Status EWS Sistem
              </span>
              <span className="text-xs text-slate-500 font-medium">Update: {studentData.updated_at}</span>
            </div>
            <EwsStatusBadge status={studentData.ews_status} size="lg" />
          </div>
        </div>
      </section>

      {/* 4 Pilar Evaluation Grid (2x2) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Pilar 1: Akademik */}
        <div className="p-6 sm:p-7 rounded-3xl neo-card bg-[#EEF2F7] border border-slate-200/80 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl neo-btn bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <IconGraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  1. Pilar Akademik
                </h3>
                <span className="text-xs text-slate-500 font-medium">{studentData.academic.total_subjects} Mata Pelajaran</span>
              </div>
            </div>
            <EwsStatusBadge status={studentData.pillars.ak} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Rata-rata Nilai:</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
                {studentData.academic.avg_score}
              </span>
              <span className="text-xs text-rose-600 font-bold block">
                {studentData.academic.trend}
              </span>
            </div>

            <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Mapel Terendah:</span>
              <span className="text-xs sm:text-sm font-bold text-rose-700 block truncate">
                {studentData.academic.lowest_subject}
              </span>
              <span className="text-xs text-slate-400 block font-medium">KKM: 75.0</span>
            </div>
          </div>
        </div>

        {/* Pilar 2: Kehadiran */}
        <div className="p-6 sm:p-7 rounded-3xl neo-card bg-[#EEF2F7] border border-slate-200/80 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl neo-btn bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <IconCalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  2. Pilar Kehadiran
                </h3>
                <span className="text-xs text-slate-500 font-medium">Rekapitulasi 30 Hari Terakhir</span>
              </div>
            </div>
            <EwsStatusBadge status={studentData.pillars.kh} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Persentase Hadir:</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
                {studentData.attendance.rate === "-" ? "-" : `${studentData.attendance.rate}%`}
              </span>
              <span className="text-xs text-orange-600 font-bold block">
                Ambang Batas &lt;85%
              </span>
            </div>

            <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Alpa Beruntun:</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 block">
                {studentData.attendance.consecutive_alpa} Hari
              </span>
              <span className="text-[11px] text-slate-500 block font-medium">
                Izin: {studentData.attendance.total_izin} &bull; Sakit: {studentData.attendance.total_sakit}
              </span>
            </div>
          </div>
        </div>

        {/* Pilar 3: Perilaku */}
        <div className="p-6 sm:p-7 rounded-3xl neo-card bg-[#EEF2F7] border border-slate-200/80 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl neo-btn bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <IconAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  3. Pilar Perilaku Kelas
                </h3>
                <span className="text-xs text-slate-500 font-medium">Observasi Naratif Guru Kelas</span>
              </div>
            </div>
            <EwsStatusBadge status={studentData.pillars.pr} size="sm" />
          </div>

          <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] text-xs sm:text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Kategori: {studentData.behavior.latest_category}</span>
              <span className="text-xs font-bold text-amber-700 uppercase">
                Status: {studentData.behavior.severity}
              </span>
            </div>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-medium">
              {studentData.behavior.notes}
            </p>
          </div>
        </div>

        {/* Pilar 4: Konseling BK */}
        <div className="p-6 sm:p-7 rounded-3xl neo-card bg-[#EEF2F7] border border-slate-200/80 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl neo-btn bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <IconHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  4. Pilar Bimbingan Konseling
                </h3>
                <span className="text-xs text-slate-500 font-medium">Portofolio &amp; Kasus BK</span>
              </div>
            </div>
            <EwsStatusBadge status={studentData.pillars.bk} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Kasus Aktif:</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 block">
                {studentData.counseling.active_cases} Kasus
              </span>
              <span className="text-xs text-slate-400 block font-medium">Status Penanganan</span>
            </div>

            <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Total Sesi Konseling:</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
                {studentData.counseling.total_sessions} Kali
              </span>
              <span className="text-xs text-slate-400 block font-medium truncate">
                Terakhir: {studentData.counseling.last_session}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Grand AI EWS Advisor Panel */}
      <section id="ai-advisor" className="scroll-mt-20">
        <AiAdvisorCard
          studentId={studentData.id}
          data={aiAdvisorData}
          studentName={studentData.name}
          ews_status={studentData.ews_status}
        />
      </section>

      {/* Longitudinal Observation & Activity Timeline */}
      <section className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-slate-200/80 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-300/40 pb-4">
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
              Rekam Jejak Longitudinal Siswa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kronologi observasi harian pendidik, perubahan presensi, dan rekam bimbingan konseling
            </p>
          </div>
          <IconCalendar className="w-5 h-5 text-slate-400" />
        </div>

        <div className="relative pl-7 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300/60">
          {timelineLogs.length === 0 ? (
            <div className="p-6 text-center text-xs sm:text-sm text-slate-400 neo-inset bg-[#E7EDF4] rounded-2xl">
              Belum ada riwayat aktivitas atau observasi longitudinal tercatat untuk siswa ini.
            </div>
          ) : (
            timelineLogs.map((log) => (
              <div key={log.id} className="relative space-y-1.5 group">
                <span className="absolute -left-7 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-[#EEF2F7] shadow-xs" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">{log.date}</span>
                  <span className="text-xs font-bold text-slate-700">&bull; {log.actor}</span>
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", log.badgeColor)}>
                    {log.badge}
                  </span>
                </div>
                <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] text-xs sm:text-sm space-y-1">
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
