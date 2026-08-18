import * as React from "react"
import {
  IconUserCheck,
  IconHandshake,
  IconKepsek,
  IconSearch,
  IconBell,
  IconLogOut,
} from "@/components/ui/storage-icon"
import { Link, router, usePage } from "@inertiajs/react"
import { cn } from "@/lib/utils"

export type UserRole = "guru_kelas" | "guru_bk" | "kepsek"

interface AuthUser {
  id: number
  name: string
  email: string
  nip?: string
  role: string
}

interface AppLayoutProps {
  children: React.ReactNode
  currentRole?: UserRole
  activeMenu?: string
  title?: string
  subtitle?: string
}

export function AppLayout({
  children,
  currentRole,
  activeMenu = "dashboard",
  title,
  subtitle,
}: AppLayoutProps) {
  const { auth } = usePage<{ auth?: { user?: AuthUser } }>().props
  const authUser = auth?.user

  // Resolve role from props or authUser
  const effectiveRole: UserRole =
    currentRole ||
    (authUser?.role as UserRole) ||
    "guru_kelas"

  const getRoleMetadata = (role: UserRole) => {
    switch (role) {
      case "guru_kelas":
        return {
          roleLabel: "Wali / Guru Kelas",
          classLabel: "Wali Kelas",
          badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
          icon: IconUserCheck,
          dashboardHref: "/guru-kelas/dashboard",
        }
      case "guru_bk":
        return {
          roleLabel: "Guru BK / Konselor",
          classLabel: "Guru BK",
          badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
          icon: IconHandshake,
          dashboardHref: "/guru-bk/dashboard",
        }
      case "kepsek":
        return {
          roleLabel: "Kepala Sekolah",
          classLabel: "Kepsek",
          badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
          icon: IconKepsek,
          dashboardHref: "/kepsek/dashboard",
        }
      default:
        return {
          roleLabel: "Staf Pendidik",
          classLabel: "Pendidik",
          badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
          icon: IconUserCheck,
          dashboardHref: "/dashboard",
        }
    }
  }

  const roleMeta = getRoleMetadata(effectiveRole)
  const displayName = authUser?.name || "Budi Santoso, S.Pd."
  const displayNip = authUser?.nip ? `NIP. ${authUser.nip}` : authUser?.email || "Pendidik Terdaftar"

  const handleLogout = () => {
    router.post("/logout")
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header Bar - Single Page / Embedded Sub-Feature Layout */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 shadow-xs">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Left: App Branding */}
          <div className="flex items-center gap-3">
            <Link href={roleMeta.dashboardHref} className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-xs group-hover:border-blue-300 group-hover:shadow-sm transition-all">
                <img src="/storage/stikmas.png" alt="Logo E-Jurnal STIKMAS" width={38} height={38} loading="eager" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight block leading-tight">
                    E-Jurnal STIKMAS
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                    AI EWS
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">Sistem Jurnal &amp; Early Warning</span>
              </div>
            </Link>
          </div>

          {/* Center: Search Bar */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <IconSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama siswa, NISN, atau kelas..."
              aria-label="Pencarian cepat siswa, NISN, atau rombel kelas"
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus:outline-none font-medium transition-all"
            />
          </div>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Role Badge */}
            <div
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border flex items-center gap-2 shrink-0 shadow-2xs",
                roleMeta.badgeColor
              )}
            >
              <roleMeta.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{roleMeta.roleLabel}</span>
            </div>

            {/* Notification Button */}
            <button
              type="button"
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-slate-300 flex items-center justify-center relative cursor-pointer shrink-0 shadow-2xs hover:shadow-xs transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              title="Notifikasi EWS"
              aria-label="Notifikasi peringatan dini EWS"
            >
              <IconBell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* User Profile Info Card */}
            <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                {displayName.charAt(0)}
              </div>
              <div className="truncate max-w-[160px]">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate font-mono">
                  {displayNip}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Keluar dari Akun"
              aria-label="Keluar dari akun pendidik"
              className="w-10 h-10 rounded-xl bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center cursor-pointer shrink-0 shadow-2xs hover:shadow-xs transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <IconLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Full Width Container with Generous Top Margin & Spacing */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-8 pb-14 sm:pt-10 sm:pb-20 space-y-8 max-w-7xl 2xl:max-w-[1440px] w-full mx-auto">
        {(title || subtitle) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-5 mb-2">
            <div>
              {title && (
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm lg:text-base text-slate-500 mt-1.5 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {children}
      </main>
    </div>
  )
}
