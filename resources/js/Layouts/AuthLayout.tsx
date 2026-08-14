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
    <div className="min-h-screen bg-[#F0F3F8] text-slate-900 flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans antialiased">
      {/* Background Soft Glows */}
      <div className="absolute -top-24 left-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <div className="w-full max-w-lg mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">BK-EWS AI</span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                v2.0
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">SMA Negeri Terpadu &bull; Early Warning System</p>
          </div>
        </Link>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-lg mx-auto my-auto py-6 sm:py-8">
        <div className="p-7 sm:p-10 rounded-3xl neo-card border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-2xl relative">
          {(title || subtitle) && (
            <div className="mb-6 sm:mb-8 text-center sm:text-left">
              {title && (
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">{subtitle}</p>
              )}
            </div>
          )}

          {children}
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-lg mx-auto text-center py-4 space-y-1.5">
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Sistem Informasi Bimbingan Konseling &amp; Early Warning System</span>
        </div>
        <p className="text-xs text-slate-400">
          Kepatuhan Privasi Data Siswa &bull; Dilindungi UU PDP No. 27 Tahun 2022
        </p>
      </div>
    </div>
  )
}
