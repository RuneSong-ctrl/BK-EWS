import * as React from "react"
import {
  IconHandshake,
  IconAlert,
  IconCheck,
  IconLightning,
  IconAi,
  IconMagicWand,
  IconRefresh,
} from "@/components/ui/storage-icon"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface AiBkDraftResult {
  student_name: string
  generated_narrative: string
  case_category: string
  urgency_level: "RINGAN" | "SEDANG" | "BERAT"
  psychosocial_summary: string
  counselor_intervention: string
  confidence_score?: number
}

// Backward compatibility type alias
export type AiBkStructuredResult = AiBkDraftResult

const BK_PRESET_OPTIONS: Record<string, string[]> = {
  PSIKOSOSIAL_ADAPTASI: [
    "Tampak murung, menarik diri, dan menolak interaksi sosial",
    "Mengalami kecemasan berlebih / stres emosional menghadapi lingkungan sekolah",
    "Keluhan masalah hubungan keluarga / faktor psikologis di rumah",
    "Kesulitan beradaptasi dengan iklim belajar dan kultur pertemanan",
  ],
  TEKANAN_AKADEMIK: [
    "Mengalami kejenuhan belajar (burnout) dan penurunan motivasi drastis",
    "Merasa kewalahan dengan beban tugas harian dan ujian",
    "Kecemasan performa akademik dan takut menghadapi remedial",
    "Penurunan drastis nilai dan hilangnya minat pada mata pelajaran",
  ],
  KONFLIK_PEER: [
    "Perselisihan / adu argumen intens dengan rekan sekelompok",
    "Terisolasi dari pergaulan kelas akibat dinamika geng / kelompok",
    "Kesalahpahaman komunikasi di media sosial antar-siswa",
    "Kebutuhan mediasi resolusi konflik dan rekonsiliasi pertemanan",
  ],
  KEDISIPLINAN_TATA_TERTIB: [
    "Alpa berulang / membolos tanpa keterangan yang sah",
    "Keterlambatan kronis dan kebiasaan melanggar aturan seragam",
    "Meninggalkan lingkungan sekolah saat jam KBM berlangsung",
    "Penggunaan gawai tanpa izin saat jam pembelajaran",
  ],
  MOTIVASI_KARIR: [
    "Kebingungan menentukan peminatan jurusan / perguruan tinggi",
    "Perbedaan aspirasi karir antara siswa dan harapan orang tua",
    "Konsultasi persiapan magang kerja / seleksi studi lanjut",
    "Eksplorasi bakat, minat, dan potensi diri siswa",
  ],
  DUGAAN_BULLYING: [
    "Indikasi menjadi korban perundungan verbal / ejekan berulang",
    "Terduga melakukan intimidasi / pengucilan kepada siswa lain",
    "Dugaan perundungan siber (cyberbullying) di grup percakapan",
    "Kebutuhan perlindungan psikologis dan pendampingan khusus korban",
  ],
}

function findBestMatchingPreset(cat: string, text: string): string {
  const presets = BK_PRESET_OPTIONS[cat] || []
  if (presets.length === 0) return ""
  if (!text) return presets[0]

  const lowerText = text.toLowerCase()
  let bestMatch = presets[0]
  let maxScore = 0

  for (const p of presets) {
    const words = p.toLowerCase().split(/[\s,./-]+/)
    let score = 0
    for (const w of words) {
      if (w.length >= 3 && lowerText.includes(w)) {
        score += 2
      }
    }
    if (score > maxScore) {
      maxScore = score
      bestMatch = p
    }
  }

  return bestMatch
}

interface AiBkStructuringModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyToForm: (data: AiBkDraftResult) => void
  studentName: string
  initialRawText?: string
}

export function AiBkStructuringModal({
  isOpen,
  onClose,
  onApplyToForm,
  studentName,
  initialRawText = "",
}: AiBkStructuringModalProps) {
  const [caseCategory, setCaseCategory] = React.useState<string>("PSIKOSOSIAL_ADAPTASI")
  const [presetTopic, setPresetTopic] = React.useState<string>("")
  const [urgencyLevel, setUrgencyLevel] = React.useState<"RINGAN" | "SEDANG" | "BERAT">("SEDANG")
  const [customKeywords, setCustomKeywords] = React.useState<string>(initialRawText)
  const [generatedDraft, setGeneratedDraft] = React.useState<string>("")
  const [psychosocialSummary, setPsychosocialSummary] = React.useState<string>("")
  const [counselorIntervention, setCounselorIntervention] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  // Reset or initialize on open
  React.useEffect(() => {
    if (isOpen) {
      if (initialRawText && initialRawText.trim().length >= 3) {
        setCustomKeywords(initialRawText)
        // Auto-analyze & classify when counselor already has verbatim text
        handleGenerate(initialRawText, true)
      } else {
        // IDLE STATE: DO NOT auto-call AI API when textarea is empty (Save AI tokens)
        setCustomKeywords("")
        setGeneratedDraft("")
        setPsychosocialSummary("")
        setCounselorIntervention("")
        setCaseCategory("PSIKOSOSIAL_ADAPTASI")
        setUrgencyLevel("SEDANG")
        setPresetTopic(BK_PRESET_OPTIONS["PSIKOSOSIAL_ADAPTASI"][0])
        setIsLoading(false)
      }
    }
  }, [isOpen, initialRawText])

  const handleCategoryChange = (newCat: string) => {
    setCaseCategory(newCat)
    const availablePresets = BK_PRESET_OPTIONS[newCat] || []
    if (availablePresets.length > 0) {
      setPresetTopic(availablePresets[0])
    } else {
      setPresetTopic("")
    }
  }

  const handleGenerate = async (overrideKeywords?: string, isAutoDetect = false) => {
    setIsLoading(true)
    const rawKeywords = overrideKeywords !== undefined ? overrideKeywords : customKeywords
    const effectiveText = (rawKeywords && rawKeywords.trim().length > 0)
      ? rawKeywords.trim()
      : (presetTopic || "Siswa menjalani sesi konseling bimbingan individual")

    try {
      const response = await fetch("/api/ai/structure-bk-observation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          raw_text: effectiveText,
          case_category: isAutoDetect ? null : caseCategory,
          urgency_level: isAutoDetect ? null : urgencyLevel,
          preset_topic: presetTopic,
          keywords: effectiveText,
          student_name: studentName,
        }),
      })

      if (response.ok) {
        const payload = await response.json()
        if (payload?.data) {
          const res = payload.data
          const detectedCategory = res.case_category || caseCategory

          // Automatically update Category Dropdown
          setCaseCategory(detectedCategory)

          // Automatically select and highlight closest matching preset chip
          const matchedChip = findBestMatchingPreset(detectedCategory, effectiveText)
          setPresetTopic(matchedChip)

          // Automatically update Urgency
          if (res.urgency_level) {
            setUrgencyLevel(res.urgency_level)
          }

          setGeneratedDraft(res.generated_narrative || "")
          setPsychosocialSummary(res.psychosocial_summary || "Teridentifikasi dinamika psikososial siswa.")
          setCounselorIntervention(res.counselor_intervention || "Pendampingan konseling suportif terarah.")
          setIsLoading(false)
          return
        }
      }
    } catch (err) {
      console.warn("AI BK Generate fetch error", err)
    }

    // Local smart fallback generator if network/API unavailable
    const student = studentName || "Siswa"
    let draftText = ""
    let sum = ""
    let inter = ""

    if (caseCategory === "DUGAAN_BULLYING") {
      draftText = `Telah dilaksanakan sesi bimbingan konseling empatik bersama ${student} terkait indikasi pengalaman intimidasi di lingkungan sekolah. Siswa menyampaikan rasa tidak nyaman dan kecemasan saat berada di area tertentu. Konselor telah memberikan ruang aman, validasi emosi, serta menyusun rencana perlindungan terarah.`
      sum = "Terindikasi mengalami intimidasi atau perundungan yang mempengaruhi rasa aman siswa."
      inter = "Pendampingan psikososial intensif, mediasi tertutup, dan koordinasi bersama wali kelas serta pimpinan sekolah."
    } else if (caseCategory === "TEKANAN_AKADEMIK") {
      draftText = `Sesi konseling difokuskan pada dinamika motivasi belajar ${student} yang mengeluhkan rasa kewalahan terhadap beban tugas dan tuntutan akademik. Siswa menunjukkan tanda kelelahan kognitif. Konselor mendampingi penyusunan strategi manajemen waktu dan teknik relaksasi mandiri.`
      sum = "Mengalami stresor akademik dan penurunan efikasi diri dalam proses belajar."
      inter = "Bimbingan regulasi diri, restrukturisasi jadwal belajar, dan komunikasi suportif bersama guru mata pelajaran."
    } else if (caseCategory === "KONFLIK_PEER") {
      draftText = `Konselor menggali dinamika hubungan pertemanan ${student} yang mengalami hambatan komunikasi dan kesalahpahaman dengan rekan sebaya. Siswa menyepakati perlunya komunikasi asertif dan keterbukaan dalam menyelesaikan friksi pergaulan.`
      sum = "Friksi komunikasi antarteman sebaya yang berdampak pada kenyamanan interaksi kelas."
      inter = "Latihan komunikasi asertif, rencana mediasi suportif jika diperlukan, dan pemantauan interaksi kelas."
    } else if (caseCategory === "KEDISIPLINAN_TATA_TERTIB") {
      draftText = `Telah dilakukan konseling kedisiplinan konstruktif untuk mengeksplorasi akar penyebab ketidakhadiran dan keterlambatan ${student}. Siswa mengakui adanya kendala pola istirahat malam dan berkomitmen menandatangani kontrak perilaku kehadiran.`
      sum = "Hambatan kedisiplinan kehadiran yang memerlukan pembiasaan tanggung jawab pribadi."
      inter = "Pembuatan kontrak perilaku (behavior contract) dan konfirmasi perkembangan bersama orang tua."
    } else if (caseCategory === "MOTIVASI_KARIR") {
      draftText = `Sesi bimbingan karir mengeksplorasi minat, potensi, dan aspirasi lanjutan studi/karir ${student}. Dilakukan pemetaan peminatan dan diskusi alternatif pilihan jurusan yang selaras dengan profil kompetensi siswa.`
      sum = "Eksplorasi peminatan studi lanjutan dan klarifikasi aspirasi karir masa depan."
      inter = "Pemberian asesmen minat bakat mandiri dan bimbingan rencana aksi karir."
    } else {
      draftText = `Konseling individu dilaksanakan untuk mendalami dinamika adaptasi dan suasana perasaan ${student}. Siswa diajak merefleksikan tantangan harian di sekolah dan menemukan strategi koping yang adaptif dalam menghadapi dinamika belajar.`
      sum = "Proses adaptasi psikososial dan penguatan resiliensi emosi siswa di sekolah."
      inter = "Konseling suportif rutin, latihan koping adaptif, dan observasi perkembangan afektif."
    }

    setGeneratedDraft(draftText)
    setPsychosocialSummary(sum)
    setCounselorIntervention(inter)
    setIsLoading(false)
  }

  const handleApply = () => {
    onApplyToForm({
      student_name: studentName,
      generated_narrative: generatedDraft,
      case_category: caseCategory,
      urgency_level: urgencyLevel,
      psychosocial_summary: psychosocialSummary,
      counselor_intervention: counselorIntervention,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xl z-[100]">
        {/* Header */}
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <IconHandshake className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Asisten Penulisan &amp; Auto-Complete AI (Konselor BK)</span>
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bantu susun catatan sesi bimbingan konseling terstruktur untuk <strong className="text-slate-800 font-semibold">{studentName || "Siswa"}</strong>
                </p>
              </div>
            </div>

            {/* System Status Indicator Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold shrink-0 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Sistem Siap</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* STEP 1: Quick Selection Controls */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100/80 space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100/60 pb-2">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                <IconAi className="w-3.5 h-3.5 text-indigo-600" />
                <span>Langkah 1: Kategori Kasus &amp; Opsi Cepat Gejala Konseling</span>
              </Label>
              <span className="text-[11px] text-indigo-600 font-semibold">Pilih Cepat &bull; Hemat Waktu</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* Category Select */}
              <div className="sm:col-span-7 space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Kategori Kasus BK:</Label>
                <Select value={caseCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="h-10 text-xs sm:text-sm bg-white border-slate-200 font-medium rounded-xl">
                    <SelectValue placeholder="Pilih Kategori Kasus" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-xl z-[99999]">
                    <SelectItem value="PSIKOSOSIAL_ADAPTASI">Masalah Psikososial &amp; Penyesuaian Diri</SelectItem>
                    <SelectItem value="TEKANAN_AKADEMIK">Tekanan &amp; Stresor Akademik</SelectItem>
                    <SelectItem value="KONFLIK_PEER">Konflik Antar Teman Sebaya</SelectItem>
                    <SelectItem value="KEDISIPLINAN_TATA_TERTIB">Pelanggaran Tata Tertib &amp; Alpa</SelectItem>
                    <SelectItem value="MOTIVASI_KARIR">Bimbingan Karir &amp; Minat Belajar</SelectItem>
                    <SelectItem value="DUGAAN_BULLYING">Dugaan Bullying / Intimidasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Urgency Select */}
              <div className="sm:col-span-5 space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Tingkat Urgensi Kasus:</Label>
                <Select
                  value={urgencyLevel}
                  onValueChange={(val: "RINGAN" | "SEDANG" | "BERAT") => setUrgencyLevel(val)}
                >
                  <SelectTrigger className="h-10 text-xs sm:text-sm bg-white border-slate-200 font-medium rounded-xl">
                    <SelectValue placeholder="Pilih Urgensi" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-xl z-[99999]">
                    <SelectItem value="RINGAN">Ringan (Konseling Rutin)</SelectItem>
                    <SelectItem value="SEDANG">Sedang (Pemantauan Terarah)</SelectItem>
                    <SelectItem value="BERAT">Berat (Kasus Kritis / Rujukan)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Preset Chips */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 block">
                Pilihan Cepat Gejala / Dinamika Konseling:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {(BK_PRESET_OPTIONS[caseCategory] || []).map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPresetTopic(preset)
                      setCustomKeywords(preset)
                    }}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer text-left font-medium",
                      presetTopic === preset
                        ? "bg-indigo-50 border-indigo-400 text-indigo-700 font-bold shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Keyword Input & Generate Button */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-bold text-slate-700">
                Kata Kunci Tambahan / Catatan Verbatim Singkat (Opsional):
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customKeywords}
                  onChange={(e) => setCustomKeywords(e.target.value)}
                  placeholder="Ketik catatan kasar, misal: 'merasa cemas saat presentasi dan takut ditertawakan'..."
                  className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleGenerate()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-4 rounded-xl shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isLoading ? (
                    <IconRefresh className="w-4 h-4 animate-spin" />
                  ) : (
                    <IconMagicWand className="w-4 h-4" />
                  )}
                  <span>Generate Draf dengan AI</span>
                </Button>
              </div>
            </div>
          </div>

          {/* STEP 2: Live AI Generated Narrative Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span>Langkah 2: Draf Catatan Sesi Konseling Hasil AI</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Dapat Diedit
                </span>
              </Label>
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isLoading}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <IconRefresh className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                <span>{isLoading ? "Sedang Menyusun..." : "Buat Ulang Variasi"}</span>
              </button>
            </div>

            <Textarea
              rows={4}
              value={generatedDraft}
              onChange={(e) => setGeneratedDraft(e.target.value)}
              placeholder="Belum ada draf. Pilih kategori/gejala di Langkah 1 atau ketik kata kunci singkat, lalu klik 'Generate Draf dengan AI'..."
              className="text-xs sm:text-sm text-slate-800 bg-white border-slate-200 rounded-2xl p-4 leading-relaxed focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans min-h-[110px] shadow-2xs"
            />

            {/* AI Psychosocial & Intervention Insights Card */}
            {(psychosocialSummary || counselorIntervention) && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200/70 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-indigo-800 border-b border-indigo-200/50 pb-1.5">
                  <IconAi className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Hasil Strukturasi Dinamika Konseling AI:</span>
                </div>
                {psychosocialSummary && (
                  <div className="text-slate-700">
                    <strong className="text-slate-900">Ringkasan Psikososial:</strong> {psychosocialSummary}
                  </div>
                )}
                {counselorIntervention && (
                  <div className="text-slate-700">
                    <strong className="text-slate-900">Saran Intervensi Konselor:</strong> {counselorIntervention}
                  </div>
                )}
              </div>
            )}

            <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200/60 flex items-start gap-2.5 text-xs text-indigo-950">
              <IconAlert className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
              <div>
                <span className="font-semibold">Catatan Alur: </span>
                <span>
                  Mengklik tombol konfirmasi di bawah akan memasang draf narasi ini ke <strong>Langkah 3: Catatan Sesi Konseling Verbatim</strong>. Anda dapat membaca, menyunting teks, dan mengatur slider evaluasi konseling secara manual sebelum menyimpan.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-slate-100 pt-4 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl w-full sm:w-auto cursor-pointer"
          >
            Batal
          </Button>

          <Button
            type="button"
            onClick={handleApply}
            disabled={!generatedDraft && !customKeywords && !presetTopic}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
          >
            <IconCheck className="w-4 h-4" />
            <span>Konfirmasi &amp; Pasang ke Catatan Konseling</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
