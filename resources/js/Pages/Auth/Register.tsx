import * as React from "react"
import { Shield, Lock, Mail, User, UserCheck, HeartHandshake, Award, ArrowRight } from "lucide-react"
import { Link, router } from "@inertiajs/react"
import { AuthLayout } from "@/Layouts/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function Register() {
  const [role, setRole] = React.useState<"guru_kelas" | "guru_bk" | "kepsek">("guru_kelas")
  const [name, setName] = React.useState("")
  const [nip, setNip] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [passwordConfirm, setPasswordConfirm] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Redirect to login or appropriate dashboard
    if (role === "guru_kelas") {
      router.visit("/dashboard/guru-kelas")
    } else if (role === "guru_bk") {
      router.visit("/dashboard/guru-bk")
    } else {
      router.visit("/dashboard/kepsek")
    }
  }

  return (
    <AuthLayout
      title="Registrasi Staf Pendidik"
      subtitle="Daftarkan akun pendidik atau konselor untuk akses sistem BK-EWS"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Pilih Peran Penugasan:
          </Label>
          <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl neo-inset bg-[#F0F3F8]">
            <button
              type="button"
              onClick={() => setRole("guru_kelas")}
              className={cn(
                "py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer",
                role === "guru_kelas"
                  ? "bg-white text-blue-700 shadow-md border border-blue-100"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Guru Kelas</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("guru_bk")}
              className={cn(
                "py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer",
                role === "guru_bk"
                  ? "bg-white text-indigo-700 shadow-md border border-indigo-100"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Guru BK</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("kepsek")}
              className={cn(
                "py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer",
                role === "kepsek"
                  ? "bg-white text-amber-700 shadow-md border border-amber-100"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Kepsek</span>
            </button>
          </div>
        </div>

        {/* Nama Lengkap */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
            Nama Lengkap &amp; Gelar
          </Label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Dra. Siti Rahmawati, M.Pd"
              className="pl-10 h-10 text-xs neo-inset bg-[#F0F3F8] border-slate-200"
            />
          </div>
        </div>

        {/* NIP / NIK */}
        <div className="space-y-1.5">
          <Label htmlFor="nip" className="text-xs font-semibold text-slate-700">
            Nomor Induk Pegawai (NIP / NIK)
          </Label>
          <div className="relative">
            <Shield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              id="nip"
              type="text"
              required
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              placeholder="18 digit NIP resmi"
              className="pl-10 h-10 text-xs neo-inset bg-[#F0F3F8] border-slate-200 font-mono"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
            Alamat Email Sekolah (@sch.id)
          </Label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama.guru@sman-terpadu.sch.id"
              className="pl-10 h-10 text-xs neo-inset bg-[#F0F3F8] border-slate-200"
            />
          </div>
        </div>

        {/* Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
              Kata Sandi
            </Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 karakter"
                className="pl-10 h-10 text-xs neo-inset bg-[#F0F3F8] border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="passwordConfirm" className="text-xs font-semibold text-slate-700">
              Ulangi Sandi
            </Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="passwordConfirm"
                type="password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Konfirmasi"
                className="pl-10 h-10 text-xs neo-inset bg-[#F0F3F8] border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.98] border border-blue-600 mt-2"
        >
          <span>Daftarkan Akun Pendidik</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>

        <div className="text-center pt-2 text-xs text-slate-500">
          Sudah memiliki akun terdaftar?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Masuk Sesi
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
