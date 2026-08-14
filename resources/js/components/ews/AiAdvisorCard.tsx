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
}

export function AiAdvisorCard({
  data,
  studentName = "Siswa",
  className,
}: AiAdvisorCardProps) {
  return (
    <div
      className={cn(
        "p-6 rounded-2xl neo-card border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/40 relative overflow-hidden",
        className
      )}
    >
      {/* Subtle background glow */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              AI Advisor — Rekomendasi Terpadu Intervensi
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                LLM Assisted
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Analisis naratif kontekstual multi-peran untuk {studentName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>UU PDP Compliant</span>
        </div>
      </div>

      {/* Risk Overview Narrative */}
      <div className="space-y-3 mb-5">
        <div className="p-3.5 rounded-xl neo-inset bg-[#F0F3F8]/80 text-xs text-slate-700 leading-relaxed border border-slate-200/80">
          <p className="font-medium text-slate-800 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Ringkasan Risiko EWS:
          </p>
          <p className="text-slate-600">{data.risk_overview}</p>
        </div>

        {data.primary_concerns && data.primary_concerns.length > 0 && (
          <div className="space-y-1.5 pl-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
        <span className="text-xs font-semibold text-slate-800">
          Rekomendasi Aksi Sesuai Peran:
        </span>

        <Tabs defaultValue="guru_kelas" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-10 p-1 rounded-xl neo-inset bg-[#F0F3F8]">
            <TabsTrigger
              value="guru_kelas"
              className="text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Guru Kelas</span>
            </TabsTrigger>
            <TabsTrigger
              value="guru_bk"
              className="text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Guru BK</span>
            </TabsTrigger>
            <TabsTrigger
              value="kepsek"
              className="text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Kepala Sekolah</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guru_kelas" className="mt-3">
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-slate-800 leading-relaxed">
              <strong className="text-blue-900 block mb-1">Panduan Tindak Lanjut Guru / Wali Kelas:</strong>
              {data.recommendation_guru_kelas}
            </div>
          </TabsContent>

          <TabsContent value="guru_bk" className="mt-3">
            <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 text-xs text-slate-800 leading-relaxed">
              <strong className="text-indigo-900 block mb-1">Protokol Konseling Guru BK:</strong>
              {data.recommendation_guru_bk}
            </div>
          </TabsContent>

          <TabsContent value="kepsek" className="mt-3">
            <div className="p-3.5 rounded-xl bg-slate-100/90 border border-slate-200 text-xs text-slate-800 leading-relaxed">
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
