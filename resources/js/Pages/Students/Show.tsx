import * as React from "react"
import {
  User,
  GraduationCap,
  CalendarCheck,
  Activity,
  HeartHandshake,
  ArrowLeft,
  Calendar,
  Lock,
  Clock,
  Sparkles,
  TrendingDown,
  AlertTriangle,
} from "lucide-react"
import { Link } from "@inertiajs/react"
import { AppLayout } from "@/Layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { EwsStatusBadge } from "@/components/ews/EwsStatusBadge"
import { PillarIndicators } from "@/components/ews/PillarIndicators"
import { AiAdvisorCard, type AiAdvisorData } from "@/components/ews/AiAdvisorCard"

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
      ).toFixed(1) + "%"
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
      currentRole="guru_kelas"
      activeMenu="siswa_profile"
      title="Lembar Profil Siswa 360° & AI Advisor"
      subtitle="Evaluasi menyeluruh 4 pilar EWS, rekam jejak longitudinal, dan narasi intervensi terpadu"
    >
      {/* Back Link */}
      <div>
        <Link
          href="/dashboard/guru-kelas"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors p-2 rounded-xl hover:bg-white shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard Kelas</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-md">
              {studentData.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {studentData.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {studentData.class_name}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-mono">
                  NISN: {studentData.nisn}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Wali Kelas: <strong className="text-slate-800">{studentData.homeroom_teacher}</strong> &bull; Tahun Ajaran: {studentData.academic_year}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                Status EWS
              </span>
              <span className="text-xs text-slate-500 font-medium">Update: {studentData.updated_at}</span>
            </div>
            <EwsStatusBadge status={studentData.ews_status} size="lg" />
          </div>
        </div>
      </section>

      {/* 4 Pilar Evaluation Grid (2x2) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Pilar 1: Akademik */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  1. Pilar Akademik
                </h3>
                <span className="text-xs text-slate-400">{studentData.academic.total_subjects} Mata Pelajaran</span>
              </div>
            </div>
            <EwsStatusBadge status={studentData.pillars.ak} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <span className="text-xs text-slate-500 block">Rata-rata Nilai:</span>
              <span className="text-2xl font-bold font-mono text-slate-900">
                {studentData.academic.avg_score}
              </span>
              <span className="text-xs text-rose-600 block font-bold mt-0.5">
                {studentData.academic.trend}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <span className="text-xs text-slate-500 block">Mapel Terendah:</span>
              <span className="text-xs sm:text-sm font-bold text-rose-700 block mt-0.5">
                {studentData.academic.lowest_subject}
              </span>
              <span className="text-xs text-slate-400 mt-0.5 block">KKM: 75.0</span>
            </div>
          </div>
        </div>

        {/* Pilar 2: Kehadiran */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  2. Pilar Kehadiran
                </h3>
                <span className="text-xs text-slate-400">Rekap 30 Hari Terakhir</span>
              </div>
            </div>
            <EwsStatusBadge status={studentData.pillars.kh} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <span className="text-xs text-slate-500 block">Persentase Hadir:</span>
              <span className="text-2xl font-bold font-mono text-slate-900">
                {studentData.attendance.rate}%
              </span>
              <span className="text-xs text-orange-600 block font-bold mt-0.5">
                Ambang Batas &lt;85%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <span className="text-xs text-slate-500 block">Alpa Beruntun:</span>
              <span className="text-2xl font-bold font-mono text-rose-600">
                {studentData.attendance.consecutive_alpa} Hari
              </span>
              <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                Izin: {studentData.attendance.total_izin} &bull; Sakit: {studentData.attendance.total_sakit}
              </span>
            </div>
          </div>
        </div>

        {/* Pilar 3: Perilaku */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  3. Pilar Perilaku Kelas
                </h3>
                <span className="text-xs text-slate-400">Observasi Terstruktur Guru</span>
              </div>
            </div>
            <EwsStatusBadge status={studentData.pillars.pr} size="sm" />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs sm:text-sm space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Kategori: {studentData.behavior.latest_category}</span>
              <span className="text-xs font-bold text-amber-700 uppercase">
                Status: {studentData.behavior.severity}
              </span>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              {studentData.behavior.notes}
            </p>
          </div>
        </div>

        {/* Pilar 4: Konseling BK */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  4. Pilar Bimbingan Konseling
                </h3>
                <span className="text-xs text-slate-400">Portofolio Konselor</span>
              </div>
            </div>
            <EwsStatusBadge status={studentData.pillars.bk} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <span className="text-xs text-slate-500 block">Kasus Aktif:</span>
              <span className="text-2xl font-bold font-mono text-emerald-700">
                {studentData.counseling.active_cases} Kasus
              </span>
              <span className="text-xs text-slate-400 block mt-0.5 font-medium">Status Kondusif</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <span className="text-xs text-slate-500 block">Total Sesi:</span>
              <span className="text-2xl font-bold font-mono text-slate-900">
                {studentData.counseling.total_sessions} Kali
              </span>
              <span className="text-xs text-slate-400 block mt-0.5 font-medium">
                Terakhir: {studentData.counseling.last_session}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* AI EWS Advisor Card */}
      <AiAdvisorCard data={aiAdvisorData} studentName={studentData.name} />

      {/* Longitudinal Observation & Activity Timeline */}
      <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Rekam Jejak Longitudinal Siswa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kronologi observasi guru, perubahan metrik absensi, dan log konseling
            </p>
          </div>
          <Clock className="w-5 h-5 text-slate-400" />
        </div>

        <div className="relative pl-7 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {timelineLogs.map((log) => (
            <div key={log.id} className="relative space-y-1.5">
              <span className="absolute -left-7 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{log.title}</h4>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${log.badgeColor}`}
                  >
                    {log.badge}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">{log.date}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{log.description}</p>
              <span className="text-xs text-slate-400 block font-medium">Oleh: {log.actor}</span>
            </div>
          ))}
        </div>
      </section>
    </AppLayout>
  )
}
