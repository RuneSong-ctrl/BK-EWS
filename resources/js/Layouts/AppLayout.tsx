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
  Compass,
} from "lucide-react"
import { Link, router } from "@inertiajs/react"
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

  React.useEffect(() => {
    setRole(currentRole)
  }, [currentRole])

  const handleRoleSwitch = (newRole: UserRole) => {
    setRole(newRole)
    if (newRole === "guru_kelas") {
      router.visit("/dashboard/guru-kelas")
    } else if (newRole === "guru_bk") {
      router.visit("/dashboard/guru-bk")
    } else if (newRole === "kepsek") {
      router.visit("/dashboard/kepsek")
    }
  }

  const getRoleData = (r: UserRole) => {
    switch (r) {
      case "guru_kelas":
        return {
          name: "Budi Santoso, S.Pd.",
          roleLabel: "Guru / Wali Kelas",
          classLabel: "10-MIPA-1",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          icon: UserCheck,
          dashboardHref: "/dashboard/guru-kelas",
        }
      case "guru_bk":
        return {
          name: "Rahmawati, S.Pd., M.Psi.",
          roleLabel: "Guru BK / Konselor",
          classLabel: "Konselor Sekolah",
          badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
          icon: HeartHandshake,
          dashboardHref: "/dashboard/guru-bk",
        }
      case "kepsek":
        return {
          name: "Drs. H. Hartono, M.Pd.",
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

      {/* Left Sidebar Navigation - Sized cleanly for 14"-16" screens (w-72) */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 p-5 flex flex-col justify-between transition-transform duration-250 lg:translate-x-0 shadow-xs",
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="space-y-5">
          {/* App Branding */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                    BK-EWS
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
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

          {/* User Profile Card with Dynamic Role Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 flex items-center justify-between gap-3 text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="truncate min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {currentUser.name}
                    </p>
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 rounded text-[11px] font-bold border mt-0.5",
                        currentUser.badgeColor
                      )}
                    >
                      {currentUser.roleLabel}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-64 rounded-2xl p-2 shadow-2xl bg-white border border-slate-200 z-[99999]">
              <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                Ganti Peran Dashboard (Demo)
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onClick={() => handleRoleSwitch("guru_kelas")}
                className={cn(
                  "p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs sm:text-sm font-medium",
                  role === "guru_kelas" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Budi Santoso (Guru Kelas)</span>
                </div>
                {role === "guru_kelas" && <span className="text-xs text-blue-600 font-bold">Aktif</span>}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleRoleSwitch("guru_bk")}
                className={cn(
                  "p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs sm:text-sm font-medium",
                  role === "guru_bk" ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <HeartHandshake className="w-4 h-4 text-indigo-600" />
                  <span>Rahmawati (Guru BK)</span>
                </div>
                {role === "guru_bk" && <span className="text-xs text-indigo-600 font-bold">Aktif</span>}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleRoleSwitch("kepsek")}
                className={cn(
                  "p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs sm:text-sm font-medium",
                  role === "kepsek" ? "bg-amber-50 text-amber-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Drs. Hartono (Kepala Sekolah)</span>
                </div>
                {role === "kepsek" && <span className="text-xs text-amber-600 font-bold">Aktif</span>}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem asChild className="p-2.5 rounded-xl text-xs sm:text-sm text-rose-600 hover:bg-rose-50 cursor-pointer font-bold">
                <Link href="/login" className="flex items-center gap-2.5 w-full">
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            <div className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
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
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                    isActive
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
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
        <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Sistem EWS AI Terkoneksi
          </p>
          <p>Tahun Ajaran 2026/2027 Ganjil</p>
        </div>
      </aside>

      {/* Right Main Content Area - Scaled for 14", 16", and 4K screens */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Clean Compact Search Bar */}
            <div className="relative w-full hidden sm:block">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari siswa, NISN, atau kelas..."
                className="w-full h-10 pl-10 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Top Right Metadata & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Jumat, 14 Agustus 2026
              </span>
              <span className="text-xs text-slate-500 font-medium">Pekan 4 &bull; Semester Ganjil</span>
            </div>

            <button
              type="button"
              className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 flex items-center justify-center relative cursor-pointer hover:bg-slate-50 shadow-2xs"
              title="Notifikasi EWS"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            <Link
              href={currentUser.dashboardHref}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border flex items-center gap-2 transition-all hover:shadow-2xs",
                currentUser.badgeColor
              )}
            >
              <currentUser.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{currentUser.classLabel}</span>
            </Link>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl 2xl:max-w-screen-2xl w-full mx-auto">
          {(title || subtitle) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
              <div>
                {title && (
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
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
