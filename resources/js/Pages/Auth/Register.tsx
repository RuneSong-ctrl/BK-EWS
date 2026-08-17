import * as React from "react"
import {
  IconShield,
  IconLock,
  IconMail,
  IconUser,
  IconUserCheck,
  IconHandshake,
  IconKepsek,
  IconArrowRight,
  IconAlert,
} from "@/components/ui/storage-icon"
import { Link, useForm } from "@inertiajs/react"
import { AuthLayout } from "@/Layouts/AuthLayout"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function Register() {
  const { data, setData, post, processing, errors } = useForm({
    role: "guru_kelas" as "guru_kelas" | "guru_bk" | "kepsek",
    name: "",
    nip: "",
    email: "",
    password: "",
    password_confirmation: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post("/register")
  }

  return (
    <AuthLayout
      title="Registrasi Staf Pendidik"
      subtitle="Daftarkan akun pendidik atau konselor untuk akses sistem E-Jurnal STIKMAS"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700">
            Pilih Peran Penugasan:
          </Label>
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl neo-inset bg-[#E7EDF4]">
            <button
              type="button"
              onClick={() => setData("role", "guru_kelas")}
              className={cn(
                "py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer",
                data.role === "guru_kelas"
                  ? "neo-btn text-blue-700 font-extrabold bg-[#EEF2F7]"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <IconUserCheck className="w-3.5 h-3.5" />
              <span>Wali Kelas</span>
            </button>

            <button
              type="button"
              onClick={() => setData("role", "guru_bk")}
              className={cn(
                "py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer",
                data.role === "guru_bk"
                  ? "neo-btn text-indigo-700 font-extrabold bg-[#EEF2F7]"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <IconHandshake className="w-3.5 h-3.5" />
              <span>Guru BK</span>
            </button>

            <button
              type="button"
              onClick={() => setData("role", "kepsek")}
              className={cn(
                "py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer",
                data.role === "kepsek"
                  ? "neo-btn text-amber-700 font-extrabold bg-[#EEF2F7]"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <IconKepsek className="w-3.5 h-3.5" />
              <span>Kepsek</span>
            </button>
          </div>
          {errors.role && <p className="text-[11px] text-rose-600">{errors.role}</p>}
        </div>

        {/* Nama Lengkap */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-bold text-slate-700">
            Nama Lengkap &amp; Gelar
          </Label>
          <div className="relative">
            <IconUser className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="name"
              type="text"
              required
              value={data.name}
              onChange={(e) => setData("name", e.target.value)}
              placeholder="Contoh: Dra. Siti Rahmawati, M.Pd"
              className="w-full pl-10 pr-4 h-10 text-xs rounded-xl neo-inset bg-[#E7EDF4] text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>
          {errors.name && <p className="text-[11px] text-rose-600">{errors.name}</p>}
        </div>

        {/* NIP / NIK */}
        <div className="space-y-1.5">
          <Label htmlFor="nip" className="text-xs font-bold text-slate-700">
            Nomor Induk Pegawai (NIP / NIK)
          </Label>
          <div className="relative">
            <IconShield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="nip"
              type="text"
              required
              value={data.nip}
              onChange={(e) => setData("nip", e.target.value)}
              placeholder="18 digit NIP resmi"
              className="w-full pl-10 pr-4 h-10 text-xs rounded-xl neo-inset bg-[#E7EDF4] text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all font-mono"
            />
          </div>
          {errors.nip && <p className="text-[11px] text-rose-600">{errors.nip}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold text-slate-700">
            Alamat Email Sekolah (@sch.id)
          </Label>
          <div className="relative">
            <IconMail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              required
              value={data.email}
              onChange={(e) => setData("email", e.target.value)}
              placeholder="nama.guru@sekolah.sch.id"
              className="w-full pl-10 pr-4 h-10 text-xs rounded-xl neo-inset bg-[#E7EDF4] text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>
          {errors.email && <p className="text-[11px] text-rose-600">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold text-slate-700">
              Kata Sandi
            </Label>
            <div className="relative">
              <IconLock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                required
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
                placeholder="Min. 8 karakter"
                className="w-full pl-10 pr-4 h-10 text-xs rounded-xl neo-inset bg-[#E7EDF4] text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
              />
            </div>
            {errors.password && <p className="text-[11px] text-rose-600">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password_confirmation" className="text-xs font-bold text-slate-700">
              Ulangi Sandi
            </Label>
            <div className="relative">
              <IconLock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password_confirmation"
                type="password"
                required
                value={data.password_confirmation}
                onChange={(e) => setData("password_confirmation", e.target.value)}
                placeholder="Konfirmasi sandi"
                className="w-full pl-10 pr-4 h-10 text-xs rounded-xl neo-inset bg-[#E7EDF4] text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={processing}
          className="w-full h-11 neo-btn-primary text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-2"
        >
          <span>{processing ? "Mendaftarkan Akun..." : "Daftarkan Akun Pendidik"}</span>
          <IconArrowRight className="w-4 h-4 text-white" />
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
