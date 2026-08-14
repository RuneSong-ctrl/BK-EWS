import * as React from "react"
import { Shield, Lock, Mail, ArrowRight, UserCheck, HeartHandshake, Award } from "lucide-react"
import { Link, router } from "@inertiajs/react"
import { AuthLayout } from "@/Layouts/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function Login() {
  const [identifier, setIdentifier] = React.useState("198204152006042001")
  const [password, setPassword] = React.useState("password123")
  const [remember, setRemember] = React.useState(false)
  const [selectedRole, setSelectedRole] = React.useState<"guru_kelas" | "guru_bk" | "kepsek">("guru_kelas")

  const handleQuickSelectRole = (role: "guru_kelas" | "guru_bk" | "kepsek") => {
    setSelectedRole(role)
    if (role === "guru_kelas") {
      setIdentifier("198204152006042001") // Dra. Siti Rahmawati
    } else if (role === "guru_bk") {
      setIdentifier("198907122014021003") // Budi Pratama
    } else {
      setIdentifier("197501011999031001") // Drs. I Made Rama
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Redirect to respective dashboard based on role
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
      subtitle="Pilih peran atau masukkan NIP/Email terdaftar Anda"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Quick Role Selection Tabs */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Pilih Peran Akun (Simulasi Demo):
          </Label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleQuickSelectRole("guru_kelas")}
              className={cn(
                "py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer",
                selectedRole === "guru_kelas"
                  ? "bg-white text-blue-700 shadow-xs border border-blue-200"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Guru Kelas</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelectRole("guru_bk")}
              className={cn(
                "py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer",
                selectedRole === "guru_bk"
                  ? "bg-white text-indigo-700 shadow-xs border border-indigo-200"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Guru BK</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelectRole("kepsek")}
              className={cn(
                "py-2 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer",
                selectedRole === "kepsek"
                  ? "bg-white text-amber-700 shadow-xs border border-amber-200"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Kepala Sekolah</span>
            </button>
          </div>
        </div>

        {/* NIP / Email Input */}
        <div className="space-y-1.5">
          <Label htmlFor="identifier" className="text-xs font-semibold text-slate-700">
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
              placeholder="Contoh: 19820415..."
              className="pl-10 h-11 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
              Kata Sandi
            </Label>
            <a href="#forgot" className="text-[11px] text-blue-600 hover:underline">
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
              className="pl-10 h-11 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <Label htmlFor="remember" className="text-xs text-slate-600 font-normal cursor-pointer">
            Ingat saya di perangkat ini
          </Label>
        </div>

        {/* Submit Button - Solid Blue with White Text */}
        <button
          type="submit"
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.98] border border-blue-600"
        >
          <span>Masuk ke Dashboard</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>

        {/* Register Link */}
        <div className="text-center pt-2 text-xs text-slate-500">
          Belum memiliki akun terdaftar?{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:underline">
            Daftar Staf Sekolah
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
