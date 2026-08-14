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
            Pilih Peran Akun:
          </Label>
          <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl neo-inset bg-[#F0F3F8]">
            <button
              type="button"
              onClick={() => handleQuickSelectRole("guru_kelas")}
              className={cn(
                "py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer",
                selectedRole === "guru_kelas"
                  ? "bg-white text-blue-700 shadow-md border border-blue-100"
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
                "py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer",
                selectedRole === "guru_bk"
                  ? "bg-white text-indigo-700 shadow-md border border-indigo-100"
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
                "py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer",
                selectedRole === "kepsek"
                  ? "bg-white text-amber-700 shadow-md border border-amber-100"
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
              className="pl-10 h-11 text-xs neo-inset bg-[#F0F3F8] border-slate-200"
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
              className="pl-10 h-11 text-xs neo-inset bg-[#F0F3F8] border-slate-200"
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

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 neo-button bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Masuk ke Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Button>

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
