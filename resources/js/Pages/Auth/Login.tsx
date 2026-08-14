import * as React from "react"
import { Shield, Lock, Mail, ArrowRight, UserCheck, HeartHandshake, Award } from "lucide-react"
import { Link, router } from "@inertiajs/react"
import { AuthLayout } from "@/Layouts/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function Login() {
  const [identifier, setIdentifier] = React.useState("198501152010011005")
  const [password, setPassword] = React.useState("password")
  const [remember, setRemember] = React.useState(false)
  const [selectedRole, setSelectedRole] = React.useState<"guru_kelas" | "guru_bk" | "kepsek">("guru_kelas")

  const handleQuickSelectRole = (role: "guru_kelas" | "guru_bk" | "kepsek") => {
    setSelectedRole(role)
    if (role === "guru_kelas") {
      setIdentifier("198501152010011005") // Budi Santoso (Guru Kelas)
    } else if (role === "guru_bk") {
      setIdentifier("198207102008012009") // Rahmawati (Guru BK)
    } else {
      setIdentifier("197005121995031002") // Drs. H. Hartono (Kepala Sekolah)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Direct navigate to appropriate dashboard based on selected role
    if (selectedRole === "guru_kelas") {
      router.visit("/dashboard/guru-kelas")
    } else if (selectedRole === "guru_bk") {
      router.visit("/dashboard/guru-bk")
    } else {
      router.visit("/dashboard/kepsek")
    }
  }

  return (
    <AuthLayout
      title="Masuk ke Portal BK-EWS"
      subtitle="Silakan pilih peran untuk simulasi demo cepat atau masukkan kredensial akun Anda"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Role Selection Tabs with rich badges */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm font-bold text-slate-800">
            Pilih Peran Akun (Simulasi Demo):
          </Label>
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200">
            <button
              type="button"
              onClick={() => handleQuickSelectRole("guru_kelas")}
              className={cn(
                "py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer",
                selectedRole === "guru_kelas"
                  ? "bg-white text-blue-700 shadow-sm border border-blue-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Guru Kelas</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelectRole("guru_bk")}
              className={cn(
                "py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer",
                selectedRole === "guru_bk"
                  ? "bg-white text-indigo-700 shadow-sm border border-indigo-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <HeartHandshake className="w-4 h-4 text-indigo-600" />
              <span>Guru BK</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelectRole("kepsek")}
              className={cn(
                "py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer",
                selectedRole === "kepsek"
                  ? "bg-white text-amber-700 shadow-sm border border-amber-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>Kepala Sekolah</span>
            </button>
          </div>
        </div>

        {/* NIP / Email Input */}
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-xs sm:text-sm font-bold text-slate-800">
            NIP atau Alamat Email
          </Label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              id="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Contoh: 19850115..."
              className="pl-11 h-12 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs sm:text-sm font-bold text-slate-800">
              Kata Sandi
            </Label>
            <a href="#forgot" className="text-xs font-semibold text-blue-600 hover:underline">
              Lupa Sandi?
            </a>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-11 h-12 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center space-x-2.5">
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <Label htmlFor="remember" className="text-xs sm:text-sm text-slate-600 font-medium cursor-pointer">
            Ingat saya di perangkat ini
          </Label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm sm:text-base font-bold rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.99] border border-blue-600"
        >
          <span>Masuk ke Dashboard</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>

        {/* Register Link */}
        <div className="text-center pt-2 text-xs sm:text-sm text-slate-500">
          Belum memiliki akun terdaftar?{" "}
          <Link href="/register" className="font-bold text-blue-600 hover:underline">
            Daftar Staf Sekolah
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
