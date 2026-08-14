import * as React from "react"
import { Sparkles, ShieldCheck, UserCheck, HeartHandshake, Award } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

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
  studentName?: string
  className?: string
  ews_status?: "NORMAL" | "BERISIKO" | "WASPADA" | "KRITIS" | "DATA_BELUM_LENGKAP"
}

export function AiAdvisorCard({
  data,
  studentName = "Siswa",
  className,
  ews_status = "DATA_BELUM_LENGKAP",
}: AiAdvisorCardProps) {
  // Determine dynamic colors based on EWS status
  const cardColor = 
    ews_status === "KRITIS" ? "border-rose-200/60 bg-rose-50/10" :
    ews_status === "WASPADA" ? "border-amber-200/60 bg-amber-50/10" :
    ews_status === "BERISIKO" ? "border-sky-200/60 bg-sky-50/10" :
    ews_status === "NORMAL" ? "border-emerald-200/60 bg-emerald-50/10" :
    "border-blue-200/60 bg-white";

  const headerIconColor =
    ews_status === "KRITIS" ? "text-rose-600 bg-rose-100" :
    ews_status === "WASPADA" ? "text-amber-600 bg-amber-100" :
    ews_status === "BERISIKO" ? "text-sky-600 bg-sky-100" :
    ews_status === "NORMAL" ? "text-emerald-600 bg-emerald-100" :
    "text-blue-600 bg-blue-100";

  return (
    <div
      className={cn(
        "p-5 sm:p-6 rounded-2xl neo-card relative overflow-hidden transition-colors",
        cardColor,
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-xl neo-btn flex items-center justify-center shrink-0", headerIconColor)}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Analisis Rekomendasi Terpadu (AI Advisor)
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold neo-pill bg-[#E6EDF5] text-blue-700">
                Gemini AI
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekomendasi tindakan kontekstual lintas peran untuk {studentName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Kerahasiaan Terlindungi</span>
        </div>
      </div>

      {/* Risk Overview Narrative */}
      <div className="space-y-3 mb-5">
        <div className="p-3.5 rounded-xl neo-inset bg-[#E7EDF4] text-xs text-slate-700 leading-relaxed">
          <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Ringkasan Risiko EWS:
          </p>
          <p className="text-slate-600">{data.risk_overview}</p>
        </div>

        {data.primary_concerns && data.primary_concerns.length > 0 && (
          <div className="space-y-1.5 pl-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Poin Perhatian Utama:
            </span>
            <ul className="space-y-1">
              {data.primary_concerns.map((concern, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-700 flex items-start gap-2"
                >
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Multi-role Recommendation Tabs */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-800">
          Rekomendasi Aksi Sesuai Peran:
        </span>

        <Tabs defaultValue="guru_kelas" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-10 p-1 rounded-xl neo-inset bg-[#E7EDF4]">
            <TabsTrigger
              value="guru_kelas"
              className="text-xs font-semibold rounded-lg data-[state=active]:neo-card-subtle data-[state=active]:text-blue-700 data-[state=active]:font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Wali Kelas</span>
            </TabsTrigger>
            <TabsTrigger
              value="guru_bk"
              className="text-xs font-semibold rounded-lg data-[state=active]:neo-card-subtle data-[state=active]:text-indigo-700 data-[state=active]:font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Guru BK</span>
            </TabsTrigger>
            <TabsTrigger
              value="kepsek"
              className="text-xs font-semibold rounded-lg data-[state=active]:neo-card-subtle data-[state=active]:text-amber-700 data-[state=active]:font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Kepala Sekolah</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guru_kelas" className="mt-3">
            <div className="p-3.5 rounded-xl neo-card-subtle text-xs text-slate-800 leading-relaxed border-blue-200/80">
              <strong className="text-blue-900 block mb-1">Panduan Tindak Lanjut Wali Kelas:</strong>
              {data.recommendation_guru_kelas}
            </div>
          </TabsContent>

          <TabsContent value="guru_bk" className="mt-3">
            <div className="p-3.5 rounded-xl neo-card-subtle text-xs text-slate-800 leading-relaxed border-indigo-200/80">
              <strong className="text-indigo-900 block mb-1">Protokol Konseling Guru BK:</strong>
              {data.recommendation_guru_bk}
            </div>
          </TabsContent>

          <TabsContent value="kepsek" className="mt-3">
            <div className="p-3.5 rounded-xl neo-card-subtle text-xs text-slate-800 leading-relaxed border-amber-200/80">
              <strong className="text-slate-900 block mb-1">Disposisi &amp; Kebijakan Kepala Sekolah:</strong>
              {data.recommendation_kepsek}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Dihasilkan secara otomatis berbasis evaluasi deterministik EWS &amp; aturan UU PDP</span>
        {data.last_updated && <span>Update: {data.last_updated}</span>}
      </div>
    </div>
  )
}
