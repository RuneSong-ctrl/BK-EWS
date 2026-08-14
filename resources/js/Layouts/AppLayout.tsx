import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Sparkles,
  HeartHandshake,
  FileSpreadsheet,
  Settings,
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
} from "lucide-react"
import { Link } from "@inertiajs/react"
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
  const [role, setRole] = React.useState<UserRole>(currentRole)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const getRoleData = (r: UserRole) => {
    switch (r) {
      case "guru_kelas":
        return {
          name: "Dra. Siti Rahmawati, M.Pd",
          roleLabel: "Guru / Wali Kelas",
          classLabel: "10-MIPA-1",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          icon: UserCheck,
          dashboardHref: "/dashboard/guru-kelas",
        }
      case "guru_bk":
        return {
          name: "Budi Pratama, S.Psi, M.Kons",
          roleLabel: "Guru BK / Konselor",
          classLabel: "Konselor Sekolah",
          badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
          icon: HeartHandshake,
          dashboardHref: "/dashboard/guru-bk",
        }
      case "kepsek":
        return {
          name: "Drs. I Made Rama, M.Pd",
          roleLabel: "Kepala Sekolah",
          classLabel: "Pimpinan Sekolah",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
          icon: Award,
          dashboardHref: "/dashboard/kepsek",
        }
    }
  }

  const currentUser = getRoleData(role)

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

    // Global
    {
      id: "siswa_profile",
      label: "Profil Siswa 360°",
      icon: Users,
      href: "/students/1",
      roles: ["guru_kelas", "guru_bk", "kepsek"],
    },
  ]

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(role))

  return (
    <div className="min-h-screen bg-[#F1F4F9] text-slate-900 flex font-sans antialiased">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation - Optimized for 14-inch screens (w-64) */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between transition-transform duration-250 lg:translate-x-0 shadow-xs",
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="space-y-4">
          {/* App Branding */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 tracking-tight">
                    BK-EWS
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">SMA Negeri Terpadu</p>
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

          {/* User Profile Card with Role Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between gap-2.5 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="truncate min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.name}
                    </p>
                    <span
                      className={cn(
                        "inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border mt-0.5",
                        currentUser.badgeColor
                      )}
                    >
                      {currentUser.roleLabel}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-60 rounded-xl p-1.5 shadow-lg bg-white border border-slate-200 z-50">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Ganti Peran Pengguna (Demo)
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onClick={() => setRole("guru_kelas")}
                className={cn(
                  "p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs",
                  role === "guru_kelas" ? "bg-blue-50 text-blue-700 font-semibold" : ""
                )}
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>Dra. Siti (Guru Kelas)</span>
                </div>
                {role === "guru_kelas" && <span className="text-[10px] text-blue-600 font-bold">Aktif</span>}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setRole("guru_bk")}
                className={cn(
                  "p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs",
                  role === "guru_bk" ? "bg-indigo-50 text-indigo-700 font-semibold" : ""
                )}
              >
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4" />
                  <span>Budi Pratama (Guru BK)</span>
                </div>
                {role === "guru_bk" && <span className="text-[10px] text-indigo-600 font-bold">Aktif</span>}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setRole("kepsek")}
                className={cn(
                  "p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs",
                  role === "kepsek" ? "bg-amber-50 text-amber-700 font-semibold" : ""
                )}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Drs. I Made (Kepala Sekolah)</span>
                </div>
                {role === "kepsek" && <span className="text-[10px] text-amber-600 font-bold">Aktif</span>}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem asChild className="p-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 cursor-pointer">
                <Link href="/login" className="flex items-center gap-2 w-full">
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
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
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    isActive
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
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
        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-0.5">
          <p className="font-semibold text-slate-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Sistem EWS Terkoneksi
          </p>
          <p>Tahun Ajaran 2026/2027 Ganjil</p>
        </div>
      </aside>

      {/* Right Main Content Area - Optimized for 14" laptop with max-w-7xl */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Clean Compact Search Bar */}
            <div className="relative w-full hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari siswa, NISN, atau kelas..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Top Right Metadata & Actions */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800">
                Jumat, 14 Agustus 2026
              </span>
              <span className="text-[10px] text-slate-500">Pekan 4 &bull; Semester Ganjil</span>
            </div>

            <button
              type="button"
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 flex items-center justify-center relative cursor-pointer hover:bg-slate-50"
              title="Notifikasi EWS"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
            </button>

            <Link
              href={currentUser.dashboardHref}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all hover:shadow-2xs",
                currentUser.badgeColor
              )}
            >
              <currentUser.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentUser.classLabel}</span>
            </Link>
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

