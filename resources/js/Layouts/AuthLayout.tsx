import * as React from "react"
import { Shield, Sparkles } from "lucide-react"
import { Link } from "@inertiajs/react"

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#EEF2F7] text-slate-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans antialiased">
      {/* Top Brand Bar */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl neo-btn text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-slate-900 tracking-tight">BK-EWS AI</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold neo-pill bg-[#E6EDF5] text-blue-800">
                Resmi
              </span>
            </div>
            <p className="text-xs text-slate-500">Sistem Deteksi Dini Sekolah</p>
          </div>
        </Link>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="p-7 sm:p-8 rounded-3xl neo-card relative">
          {(title || subtitle) && (
            <div className="mb-6 text-center sm:text-left">
              {title && (
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
              )}
            </div>
          )}

          {children}
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-md mx-auto text-center py-4 space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Sistem Informasi Bimbingan Konseling &amp; Early Warning System</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Kepatuhan Privasi Data Siswa &bull; Dilindungi UU PDP No. 27 Tahun 2022
        </p>
      </div>
    </div>
  )
}
