import * as React from "react"
import { IconShieldCheck } from "@/components/ui/storage-icon"
import { Link } from "@inertiajs/react"
import { cn } from "@/lib/utils"

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  maxWidth?: "md" | "lg"
}

export function AuthLayout({
  children,
  title,
  subtitle,
  maxWidth = "md",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#EEF2F7] text-slate-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans antialiased">
      {/* Background Soft Ambient Radial Glows */}
      <div className="absolute -top-32 left-1/4 w-[450px] h-[450px] bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[450px] h-[450px] bg-indigo-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Spacer Top */}
      <div className="hidden sm:block h-2" />

      {/* Main Unified Card Container */}
      <div
        className={cn(
          "w-full mx-auto my-auto py-4 sm:py-6",
          maxWidth === "lg" ? "max-w-lg" : "max-w-md"
        )}
      >
        <div className="p-7 sm:p-9 rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 relative">
          {/* Unified Card Header: Logo STIKMAS & App Branding */}
          <div className="flex flex-col items-center text-center mb-6">
            <Link href="/" className="group flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl neo-btn bg-[#EEF2F7] p-2.5 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shrink-0">
                <img
                  src="/storage/stikmas.png"
                  alt="E-Jurnal STIKMAS"
                  className="w-full h-full object-contain drop-shadow-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                  E-Jurnal STIKMAS
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
                  AI EWS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Sistem Observasi Jurnal &amp; Early Warning
              </p>
            </Link>

            {/* Portal Title & Subtitle */}
            {(title || subtitle) && (
              <div className="mt-5 pt-4 border-t border-slate-300/40 w-full text-center">
                {title && (
                  <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>

      {/* Footer Info: Privacy & PDP Compliance */}
      <div className="w-full max-w-md mx-auto text-center py-4 space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
          <IconShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Kepatuhan Privasi Data Siswa &bull; UU PDP No. 27/2022</span>
        </div>
      </div>
    </div>
  )
}

