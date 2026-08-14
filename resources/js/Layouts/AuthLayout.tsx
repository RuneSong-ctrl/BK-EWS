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
    <div className="min-h-screen bg-[#F0F3F8] text-slate-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans antialiased">
      {/* Background Soft Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-slate-900 tracking-tight">BK-EWS AI</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500">SMA Negeri Terpadu</p>
          </div>
        </Link>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="p-7 sm:p-8 rounded-3xl neo-card border border-white bg-white/95 backdrop-blur-xl shadow-2xl relative">
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
