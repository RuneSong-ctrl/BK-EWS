import * as React from "react"
import {
  IconLock,
  IconMail,
  IconArrowRight,
  IconAlert,
  IconEye,
  IconEyeOff,
} from "@/components/ui/storage-icon"
import { Link, useForm } from "@inertiajs/react"
import { AuthLayout } from "@/Layouts/AuthLayout"
import { Label } from "@/components/ui/label"

export default function Login() {
  const [showPassword, setShowPassword] = React.useState(false)
  const { data, setData, post, processing, errors } = useForm({
    identifier: "",
    password: "",
    remember: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post("/login")
  }

  return (
    <AuthLayout
      title="Portal Masuk Pendidik"
      subtitle="Silakan masukkan NIP atau email dinas Anda"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* NIP / Email Input */}
        <div className="space-y-1.5">
          <Label htmlFor="identifier" className="text-xs font-bold text-slate-700">
            NIP atau Alamat Email Resmi
          </Label>
          <div className="relative">
            <IconMail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="identifier"
              type="text"
              required
              autoFocus
              value={data.identifier}
              onChange={(e) => setData("identifier", e.target.value)}
              placeholder="Contoh: 19850115... atau guru@sekolah.sch.id"
              className="w-full pl-10 pr-3.5 h-11 text-xs sm:text-sm neo-inset bg-[#E7EDF4] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium transition-all"
            />
          </div>
          {errors.identifier && (
            <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
              <IconAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.identifier}</span>
            </p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-bold text-slate-700">
              Kata Sandi
            </Label>
            <span className="text-[11px] text-slate-400 font-medium">
              Terkunci Enkripsi
            </span>
          </div>
          <div className="relative">
            <IconLock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={data.password}
              onChange={(e) => setData("password", e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 h-11 text-xs sm:text-sm neo-inset bg-[#E7EDF4] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? (
                <IconEyeOff className="w-4 h-4" />
              ) : (
                <IconEye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
              <IconAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center space-x-2 pt-0.5">
          <input
            type="checkbox"
            id="remember"
            checked={data.remember}
            onChange={(e) => setData("remember", e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <Label htmlFor="remember" className="text-xs text-slate-600 font-medium cursor-pointer">
            Ingat saya di perangkat ini
          </Label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={processing}
          className="w-full h-11 sm:h-12 neo-btn-primary font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all shadow-md"
        >
          <span>{processing ? "Memproses Autentikasi..." : "Masuk ke Sistem"}</span>
          <IconArrowRight className="w-4 h-4" />
        </button>

        {/* Register Link */}
        <div className="text-center pt-2 text-xs text-slate-500 font-medium">
          Belum memiliki akun terdaftar?{" "}
          <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
            Daftar Akun Pendidik
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}

