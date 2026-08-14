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

export default function StudentShow() {
  const studentData = {
    id: 1,
    name: "Ahmad Fauzi",
    nisn: "0089218821",
    class_name: "10-MIPA-1",
    homeroom_teacher: "Dra. Siti Rahmawati, M.Pd",
    academic_year: "2026/2027 Ganjil",
    ews_status: "WASPADA" as const,
    updated_at: "14 Agustus 2026",
    pillars: {
      ak: "WASPADA" as const,
      kh: "WASPADA" as const,
      pr: "BERISIKO" as const,
      bk: "NORMAL" as const,
    },
    academic: {
      avg_score: 62.5,
      trend: "Turun 2 Periode",
      lowest_subject: "Matematika Wajib (45.0)",
      highest_subject: "Seni Budaya (84.0)",
      total_subjects: 12,
    },
    attendance: {
      rate: 82.0,
      consecutive_alpa: 4,
      total_alpa: 4,
      total_izin: 2,
      total_sakit: 1,
    },
    behavior: {
      total_observations: 3,
      latest_category: "MENARIK_DIRI",
      severity: "SEDANG",
      notes: "Terlihat enggan berdiskusi kelompok dan pasif dalam 3 hari terakhir.",
    },
    counseling: {
      active_cases: 0,
      total_sessions: 2,
      status: "TERPANTAU_RUTIN",
      last_session: "12 Agu 2026",
    },
  }

  const aiAdvisorData: AiAdvisorData = {
    risk_overview:
      "Siswa menunjukkan penurunan performa akademik simultan dengan ketidakhadiran berturut-turut (4 hari alpa tanpa keterangan medis). Pola observasi guru mencatat adanya penarikan diri sosial saat kegiatan kelompok interaktif.",
    primary_concerns: [
      "Ketidakhadiran berurutan 4 hari tanpa surat keterangan orang tua/wali.",
      "Nilai mata pelajaran Matematika Wajib anjlok di bawah KKM (Skor 45 vs KKM 75).",
      "Perubahan perilaku afektif: isolasi diri dan keengganan kolaborasi sejak pekan lalu.",
    ],
    recommendation_guru_kelas:
      "Lakukan kontak komunikasi telepon langsung dengan orang tua/wali siswa hari ini untuk klarifikasi alasan alpa 4 hari. Bentuk kelompok belajar pendukung dengan teman sebaya yang suportif.",
    recommendation_guru_bk:
      "Jadwalkan sesi konseling individu empatik (Tahap 2) dengan fokus eksplorasi faktor stresor eksternal (keluarga/lingkungan sebaya) dan susun kontrak komitmen kehadiran.",
    recommendation_kepsek:
      "Menyetujui koordinasi mediasi wali kelas dan guru BK. Berikan dispensasi remedial terarah jika terdapat kendala psikososial yang telah terverifikasi konselor.",
    last_updated: "14 Agu 2026, 09:30 WIB",
  }

  const timelineLogs = [
    {
      id: 1,
      date: "14 Agu 2026",
      actor: "Dra. Siti Rahmawati (Wali Kelas)",
      title: "Input Observasi AI (Perilaku Menarik Diri)",
      description: "Tercatat siswa menolak bergabung diskusi biologi dan tampak cemas saat ditanya.",
      badge: "Observasi Perilaku",
      badgeColor: "bg-blue-100 text-blue-800",
    },
    {
      id: 2,
      date: "13 Agu 2026",
      actor: "Sistem Piket Absensi",
      title: "Pemicu Alpa Berurutan Hari ke-4",
      description: "Siswa tercatat tidak hadir tanpa keterangan pada jam pelajaran ke-1 s.d 8.",
      badge: "Peringatan Absensi",
      badgeColor: "bg-rose-100 text-rose-800",
    },
    {
      id: 3,
      date: "12 Agu 2026",
      actor: "Budi Pratama, M.Kons (Guru BK)",
      title: "Sesi Konseling Individu Awal",
      description: "Eksplorasi motivasi belajar dan penyesuaian sosial pasca ujian tengah semester.",
      badge: "Sesi BK",
      badgeColor: "bg-indigo-100 text-indigo-800",
    },
    {
      id: 4,
      date: "08 Agu 2026",
      actor: "Guru Mapel Matematika",
      title: "Input Nilai Ulangan Harian (Skor 45.0)",
      description: "Penurunan dari ulangan harian sebelumnya (skor 72.0).",
      badge: "Akademik",
      badgeColor: "bg-amber-100 text-amber-800",
    },
  ]

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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard Kelas</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <section className="p-6 rounded-3xl neo-card bg-white border border-white/90 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-blue-500/25 ring-4 ring-white">
              {studentData.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {studentData.name}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {studentData.class_name}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  NISN: {studentData.nisn}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Wali Kelas: <strong className="text-slate-700">{studentData.homeroom_teacher}</strong> &bull; Tahun Ajaran: {studentData.academic_year}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Status EWS Terkini
              </span>
              <span className="text-xs text-slate-500">Update: {studentData.updated_at}</span>
            </div>
            <EwsStatusBadge status={studentData.ews_status} size="lg" />
          </div>
        </div>
      </section>

      {/* 4 Pilar Evaluation Grid (2x2) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pilar 1: Akademik */}
        <div className="p-5 rounded-2xl neo-card bg-white border border-white/90 shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Pilar Akademik
                </h3>
                <span className="text-[11px] text-slate-400">{studentData.academic.total_subjects} Mata Pelajaran</span>
              </div>
            </div>
            <EwsStatusBadge status={studentData.pillars.ak} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl neo-inset bg-[#F0F3F8]">
              <span className="text-[11px] text-slate-500 block">Rata-rata Nilai:</span>
              <span className="text-lg font-bold font-mono text-slate-900">
                {studentData.academic.avg_score}
              </span>
              <span className="text-[10px] text-rose-600 block font-semibold mt-0.5">
                {studentData.academic.trend}
              </span>
            </div>

            <div className="p-2.5 rounded-xl neo-inset bg-[#F0F3F8]">
              <span className="text-[11px] text-slate-500 block">Mapel Terendah:</span>
              <span className="text-xs font-bold text-rose-700 block mt-0.5">
                {studentData.academic.lowest_subject}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">KKM: 75.0</span>
            </div>
          </div>
        </div>

        {/* Pilar 2: Kehadiran */}
        <div className="p-5 rounded-2xl neo-card bg-white border border-white/90 shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  2. Pilar Kehadiran
                </h3>
                <span className="text-[11px] text-slate-400">Rekap 30 Hari Terakhir</span>
              </div>
            </div>
            <EwsStatusBadge status={studentData.pillars.kh} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl neo-inset bg-[#F0F3F8]">
              <span className="text-[11px] text-slate-500 block">Persentase Hadir:</span>
              <span className="text-lg font-bold font-mono text-slate-900">
                {studentData.attendance.rate}%
              </span>
              <span className="text-[10px] text-orange-600 block font-semibold mt-0.5">
                Ambang Bahaya &lt;85%
              </span>
            </div>

            <div className="p-2.5 rounded-xl neo-inset bg-[#F0F3F8]">
              <span className="text-[11px] text-slate-500 block">Alpa Beruntun:</span>
              <span className="text-lg font-bold font-mono text-rose-600">
                {studentData.attendance.consecutive_alpa} Hari
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Izin: {studentData.attendance.total_izin} &bull; Sakit: {studentData.attendance.total_sakit}
              </span>
            </div>
          </div>
        </div>

        {/* Pilar 3: Perilaku */}
        <div className="p-5 rounded-2xl neo-card bg-white border border-white/90 shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  3. Pilar Perilaku Kelas
                </h3>
                <span className="text-[11px] text-slate-400">Observasi Guru Terstruktur</span>
              </div>
            </div>
            <EwsStatusBadge status={studentData.pillars.pr} size="sm" />
          </div>

          <div className="p-3 rounded-xl neo-inset bg-[#F0F3F8] text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Kategori: {studentData.behavior.latest_category}</span>
              <span className="text-[10px] font-bold text-amber-700 uppercase">
                Severity: {studentData.behavior.severity}
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {studentData.behavior.notes}
            </p>
          </div>
        </div>

        {/* Pilar 4: Konseling BK */}
        <div className="p-5 rounded-2xl neo-card bg-white border border-white/90 shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  4. Pilar Kasus BK
                </h3>
                <span className="text-[11px] text-slate-400">Portofolio Konselor</span>
              </div>
            </div>
            <EwsStatusBadge status={studentData.pillars.bk} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl neo-inset bg-[#F0F3F8]">
              <span className="text-[11px] text-slate-500 block">Kasus Aktif:</span>
              <span className="text-lg font-bold font-mono text-emerald-700">
                {studentData.counseling.active_cases} Kasus
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Status Kondusif</span>
            </div>

            <div className="p-2.5 rounded-xl neo-inset bg-[#F0F3F8]">
              <span className="text-[11px] text-slate-500 block">Total Sesi:</span>
              <span className="text-lg font-bold font-mono text-slate-900">
                {studentData.counseling.total_sessions} Kali
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Terakhir: {studentData.counseling.last_session}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* AI EWS Advisor Card */}
      <AiAdvisorCard data={aiAdvisorData} studentName={studentData.name} />

      {/* Longitudinal Observation & Activity Timeline */}
      <section className="p-6 rounded-3xl neo-card bg-white border border-white/90 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Rekam Jejak Longitudinal Siswa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kronologi observasi guru, perubahan metrik absensi, dan log konseling
            </p>
          </div>
          <Clock className="w-5 h-5 text-slate-400" />
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {timelineLogs.map((log) => (
            <div key={log.id} className="relative space-y-1">
              <span className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{log.title}</h4>
                  <span
                    className={`px-2 py-0.2 rounded text-[10px] font-semibold ${log.badgeColor}`}
                  >
                    {log.badge}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{log.date}</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{log.description}</p>
              <span className="text-[11px] text-slate-400 block">Oleh: {log.actor}</span>
            </div>
          ))}
        </div>
      </section>
    </AppLayout>
  )
}
