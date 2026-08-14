import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Sparkles,
  HeartHandshake,
  FileSpreadsheet,
  Bell,
  Search,
  Shield,
  LogOut,
  UserCheck,
  Award,
  Menu,
  X,
} from "lucide-react"
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
  currentRole = "guru_kelas",
  activeMenu = "dashboard",
  title,
  subtitle,
}: AppLayoutProps) {
  const page = usePage()
  const authUser = (page.props as any)?.auth?.user as AuthUser | undefined

  // Resolve user role from auth session, fallback to currentRole prop
  const effectiveRole = (authUser?.role as UserRole) || currentRole
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const getRoleMetadata = (r: UserRole) => {
    switch (r) {
      case "guru_kelas":
        return {
          roleLabel: "Guru / Wali Kelas",
          classLabel: "Wali Kelas",
          badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
          icon: UserCheck,
          dashboardHref: "/guru-kelas/dashboard",
        }
      case "guru_bk":
        return {
          roleLabel: "Guru BK / Konselor",
          classLabel: "Guru BK",
          badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
          icon: HeartHandshake,
          dashboardHref: "/guru-bk/dashboard",
        }
      case "kepsek":
        return {
          roleLabel: "Kepala Sekolah",
          classLabel: "Kepsek",
          badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Award,
          dashboardHref: "/kepsek/dashboard",
        }
      default:
        return {
          roleLabel: "Staf Pendidik",
          classLabel: "Pendidik",
          badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
          icon: UserCheck,
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

  const menuItems = [
    // Guru Kelas Menu
    {
      id: "dashboard",
      label: "Ringkasan Kelas",
      icon: LayoutDashboard,
      href: "/guru-kelas/dashboard",
      roles: ["guru_kelas"],
    },
    {
      id: "observasi_ai",
      label: "Observasi Perilaku (AI)",
      icon: Sparkles,
      href: "/guru-kelas/dashboard#observasi",
      roles: ["guru_kelas"],
    },
    {
      id: "rekap_akademik",
      label: "Rekap Nilai & Presensi",
      icon: FileSpreadsheet,
      href: "/guru-kelas/dashboard#rekap",
      roles: ["guru_kelas"],
    },

    // Guru BK Menu
    {
      id: "dashboard_bk",
      label: "Watchlist & Kasus",
      icon: HeartHandshake,
      href: "/guru-bk/dashboard",
      roles: ["guru_bk"],
    },
    {
      id: "kasus_bk",
      label: "Input Log Konseling",
      icon: Sparkles,
      href: "/guru-bk/dashboard#kasus",
      roles: ["guru_bk"],
    },
    {
      id: "matriks_lintas_kelas",
      label: "Matriks Lintas Jenjang",
      icon: FileSpreadsheet,
      href: "/guru-bk/dashboard#matriks",
      roles: ["guru_bk"],
    },

    // Kepala Sekolah Menu
    {
      id: "dashboard_kepsek",
      label: "Ringkasan Eksekutif",
      icon: LayoutDashboard,
      href: "/kepsek/dashboard",
      roles: ["kepsek"],
    },
    {
      id: "prioritas_manajemen",
      label: "Siswa Perlu Atensi",
      icon: Shield,
      href: "/kepsek/dashboard#prioritas",
      roles: ["kepsek"],
    },

    // Global Access
    {
      id: "siswa_profile",
      label: "Profil Siswa 360°",
      icon: Users,
      href: "/students/1",
      roles: ["guru_kelas", "guru_bk", "kepsek"],
    },
  ]

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(effectiveRole))

  return (
    <div className="min-h-screen bg-[#EEF2F7] text-slate-900 flex font-sans antialiased">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation - Soft Neumorphic Style */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#EEF2F7] border-r border-slate-200/80 p-5 flex flex-col justify-between transition-transform duration-250 lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="space-y-5">
          {/* App Branding */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl neo-btn text-blue-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                    BK-EWS
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold neo-pill bg-[#E6EDF5] text-blue-700">
                    AI
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">SMA Negeri Terpadu</p>
              </div>
            </Link>

            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card (Authenticated User) */}
          <div className="p-3.5 rounded-2xl neo-card flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl neo-btn text-slate-800 font-bold text-sm flex items-center justify-center shrink-0">
                {displayName.charAt(0)}
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 truncate font-mono">
                  {displayNip}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Keluar dari Akun"
              className="p-2 rounded-xl neo-btn text-rose-600 hover:text-rose-700 shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Menu Navigasi ({roleMeta.roleLabel})
            </div>

            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeMenu === item.id

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                    isActive
                      ? "neo-btn-primary font-bold"
                      : "text-slate-600 hover:text-slate-900 neo-btn bg-[#EEF2F7]"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors shrink-0",
                      isActive ? "text-white" : "text-slate-500"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="pt-4 border-t border-slate-200/60 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sistem EWS AI Aktif
          </p>
          <p className="text-[11px] text-slate-400">Database Sekolah Terpadu</p>
        </div>
      </aside>

      {/* Right Main Content Area - Scaled for 14", 16", and 4K screens */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#EEF2F7]/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-200/60 cursor-pointer"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Soft Sunken Search Bar */}
            <div className="relative w-full hidden sm:block">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari siswa, NISN, atau kelas..."
                className="w-full h-10 pl-10 pr-3 rounded-xl neo-inset bg-[#EEF2F7] text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Top Right Metadata & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">
                Jumat, 14 Agustus 2026
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Semester Ganjil 2026/2027</span>
            </div>

            <button
              type="button"
              className="w-10 h-10 rounded-xl neo-btn text-slate-600 hover:text-blue-600 flex items-center justify-center relative cursor-pointer"
              title="Notifikasi EWS"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#EEF2F7]" />
            </button>

            <div
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold neo-pill flex items-center gap-2",
                roleMeta.badgeColor
              )}
            >
              <roleMeta.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{roleMeta.classLabel}</span>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl 2xl:max-w-screen-2xl w-full mx-auto">
          {(title || subtitle) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-4">
              <div>
                {title && (
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  )
}
