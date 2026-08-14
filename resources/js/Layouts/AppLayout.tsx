import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Sparkles,
  HeartHandshake,
  FileSpreadsheet,
  Bell,
  Search,
  ChevronDown,
  Shield,
  LogOut,
  UserCheck,
  Award,
  BookOpen,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react"
import { Link, router, usePage } from "@inertiajs/react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const authUser = (page.props.auth as { user?: AuthUser } | undefined)?.user

  // Resolve user role from auth session, fallback to currentRole prop
  const effectiveRole = (authUser?.role as UserRole) || currentRole
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const getRoleMetadata = (r: UserRole) => {
    switch (r) {
      case "guru_kelas":
        return {
          roleLabel: "Wali Kelas",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          icon: UserCheck,
          dashboardHref: "/dashboard/guru-kelas",
        }
      case "guru_bk":
        return {
          roleLabel: "Guru BK / Konselor",
          badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
          icon: HeartHandshake,
          dashboardHref: "/dashboard/guru-bk",
        }
      case "kepsek":
        return {
          roleLabel: "Kepala Sekolah",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
          icon: Award,
          dashboardHref: "/dashboard/kepsek",
        }
      default:
        return {
          roleLabel: "Staf Pendidik",
          badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
          icon: UserIcon,
          dashboardHref: "/dashboard",
        }
    }
  }

  const roleMeta = getRoleMetadata(effectiveRole)
  const displayName = authUser?.name || "Pendidik Terdaftar"
  const displayNip = authUser?.nip ? `NIP. ${authUser.nip}` : authUser?.email || "Staf Sekolah"

  const handleLogout = () => {
    router.post("/logout")
  }

  const menuItems = [
    // Guru Kelas Menu
    {
      id: "dashboard",
      label: "Ringkasan Kelas",
      icon: LayoutDashboard,
      href: "/dashboard/guru-kelas",
      roles: ["guru_kelas"],
    },
    {
      id: "observasi_ai",
      label: "Observasi Perilaku (AI)",
      icon: Sparkles,
      href: "/dashboard/guru-kelas#observasi",
      roles: ["guru_kelas"],
    },
    {
      id: "rekap_akademik",
      label: "Rekap Nilai & Presensi",
      icon: FileSpreadsheet,
      href: "/dashboard/guru-kelas#rekap",
      roles: ["guru_kelas"],
    },

    // Guru BK Menu
    {
      id: "dashboard_bk",
      label: "Watchlist & Kasus",
      icon: LayoutDashboard,
      href: "/dashboard/guru-bk",
      roles: ["guru_bk"],
    },
    {
      id: "kasus_bk",
      label: "Pencatatan Sesi BK",
      icon: HeartHandshake,
      href: "/dashboard/guru-bk#kasus",
      roles: ["guru_bk"],
    },
    {
      id: "matriks_holistik",
      label: "Matriks Siswa Sekolah",
      icon: BookOpen,
      href: "/dashboard/guru-bk#matriks",
      roles: ["guru_bk"],
    },

    // Kepsek Menu
    {
      id: "dashboard_kepsek",
      label: "Dashboard Eksekutif",
      icon: LayoutDashboard,
      href: "/dashboard/kepsek",
      roles: ["kepsek"],
    },
    {
      id: "prioritas_ews",
      label: "Siswa Perlu Atensi",
      icon: Shield,
      href: "/dashboard/kepsek#prioritas",
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

      {/* Left Sidebar Navigation - Soft Neumorphic Panel */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#EEF2F7] border-r border-white/80 p-4 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 shadow-[4px_0_12px_rgba(166,178,196,0.25)]",
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="space-y-4">
          {/* App Branding */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl neo-btn text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 tracking-tight">
                    BK-EWS
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold neo-pill bg-[#E6EDF5] text-blue-700">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Sistem Deteksi Dini</p>
              </div>
            </Link>

            <button
              type="button"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card with Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full p-2.5 rounded-2xl neo-card-subtle flex items-center justify-between gap-2 text-left transition-all cursor-pointer group hover:border-blue-200"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl neo-btn text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {displayName.charAt(0)}
                  </div>
                  <div className="truncate min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {displayName}
                    </p>
                    <span className="inline-block text-[10px] font-medium text-slate-500 truncate">
                      {roleMeta.roleLabel}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-60 rounded-2xl p-2 neo-card border border-white/90 z-50">
              <DropdownMenuLabel className="px-2 py-1">
                <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                <p className="text-[10px] text-slate-500 truncate font-mono">{displayNip}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 border-slate-200/60" />

              <div className="px-2 py-1 mb-1">
                <span className={cn("inline-block px-2 py-0.5 rounded-md text-[10px] font-bold", roleMeta.badgeColor)}>
                  {roleMeta.roleLabel}
                </span>
              </div>

              <DropdownMenuSeparator className="my-1 border-slate-200/60" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="p-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50/80 cursor-pointer flex items-center gap-2 font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Sesi</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Navigation Menu */}
          <nav className="space-y-1.5 pt-1">
            <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Menu Navigasi
            </div>

            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeMenu === item.id

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    isActive
                      ? "neo-btn-primary font-bold shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:neo-card-subtle"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors shrink-0",
                      isActive ? "text-white" : "text-slate-400"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="pt-3 border-t border-slate-200/60 text-[11px] text-slate-400 space-y-0.5">
          <p className="font-semibold text-slate-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Sistem EWS Aktif &amp; Terhubung
          </p>
          <p>Database Sekolah Terpadu</p>
        </div>
      </aside>

      {/* Right Main Content Area - Soft Neumorphic Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-14 bg-[#EEF2F7]/90 backdrop-blur-md border-b border-white/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shadow-[0_2px_8px_rgba(166,178,196,0.18)]">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              className="lg:hidden p-1.5 rounded-xl neo-btn text-slate-600 cursor-pointer"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Soft Sunken Search Bar */}
            <div className="relative w-full hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari siswa, NISN, atau kelas..."
                className="w-full h-8 pl-8 pr-3 rounded-xl neo-inset bg-[#E7EDF4] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Top Right Metadata & Actions */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">
                Sistem EWS Terpadu
              </span>
              <span className="text-[10px] text-slate-500">Tahun Ajaran 2026/2027</span>
            </div>

            <button
              type="button"
              className="w-8 h-8 rounded-xl neo-btn text-slate-600 hover:text-blue-600 flex items-center justify-center relative cursor-pointer"
              title="Notifikasi EWS"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
            </button>

            <div
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-bold neo-pill flex items-center gap-1.5",
                roleMeta.badgeColor
              )}
            >
              <roleMeta.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{roleMeta.roleLabel}</span>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 space-y-5 max-w-7xl w-full mx-auto">
          {(title || subtitle) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/70 pb-3">
              <div>
                {title && (
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5">
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


