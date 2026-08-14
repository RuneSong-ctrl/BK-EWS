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
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      href: currentUser.dashboardHref,
      roles: ["guru_kelas", "guru_bk", "kepsek"],
    },
    {
      id: "observasi_ai",
      label: "Observasi Perilaku (AI)",
      icon: Sparkles,
      href: "/dashboard/guru-kelas#observasi",
      roles: ["guru_kelas", "guru_bk"],
    },
    {
      id: "kasus_bk",
      label: "Kasus & Konseling BK",
      icon: HeartHandshake,
      href: "/dashboard/guru-bk#kasus",
      roles: ["guru_bk", "kepsek"],
    },
    {
      id: "siswa_profile",
      label: "Profil Siswa 360°",
      icon: Users,
      href: "/students/1",
      roles: ["guru_kelas", "guru_bk", "kepsek"],
    },
    {
      id: "rekap_akademik",
      label: "Rekap Nilai & Kehadiran",
      icon: FileSpreadsheet,
      href: "#rekap",
      roles: ["guru_kelas", "guru_bk", "kepsek"],
    },
    {
      id: "pengaturan",
      label: "Pengaturan & Audit Log",
      icon: Settings,
      href: "#settings",
      roles: ["kepsek"],
    },
  ]

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(role))

  return (
    <div className="min-h-screen bg-[#F0F3F8] text-slate-900 flex font-sans antialiased">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-xl border-r border-slate-200/80 p-5 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="space-y-6">
          {/* App Branding */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-slate-900 tracking-tight">
                    BK-EWS AI
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-slate-500">SMA Negeri Terpadu</p>
              </div>
            </Link>

            <button
              type="button"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
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
                className="w-full p-3 rounded-2xl neo-card bg-white border border-slate-100 flex items-center justify-between gap-3 text-left hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shadow-inner ring-2 ring-white">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="truncate">
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
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-64 rounded-xl p-1.5 shadow-xl bg-white border border-slate-200 z-50">
              <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
                Ganti Persona Pengguna (Demo)
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
                  <span>Dra. Siti Rahmawati (Guru Kelas)</span>
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
                  <span>Drs. I Made Rama (Kepsek)</span>
                </div>
                {role === "kepsek" && <span className="text-[10px] text-amber-600 font-bold">Aktif</span>}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem asChild className="p-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 cursor-pointer">
                <Link href="/login" className="flex items-center gap-2 w-full">
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Sesi</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Menu Utama
            </div>

            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeMenu === item.id

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-blue-600" : "text-slate-400"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            EWS Engine Deterministic Online
          </p>
          <p>Tahun Ajaran 2026/2027 Ganjil</p>
        </div>
      </aside>

      {/* Right Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Sunken Search Bar */}
            <div className="relative w-full hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari siswa, NISN, catatan kasus, atau kelas..."
                className="w-full h-9 pl-9 pr-4 rounded-xl neo-inset bg-[#F0F3F8] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Top Right Metadata & Notification */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800">
                Jumat, 14 Agustus 2026
              </span>
              <span className="text-[11px] text-slate-500">Semester Ganjil &bull; Pekan 4</span>
            </div>

            <button
              type="button"
              className="w-9 h-9 rounded-xl neo-button bg-white text-slate-600 hover:text-blue-600 flex items-center justify-center relative cursor-pointer"
              title="Notifikasi EWS"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </button>

            <Link
              href={
                role === "guru_kelas"
                  ? "/dashboard/guru-kelas"
                  : role === "guru_bk"
                  ? "/dashboard/guru-bk"
                  : "/dashboard/kepsek"
              }
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-transform hover:scale-105",
                currentUser.badgeColor
              )}
            >
              <currentUser.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentUser.classLabel}</span>
            </Link>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {(title || subtitle) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-4">
              <div>
                {title && (
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
