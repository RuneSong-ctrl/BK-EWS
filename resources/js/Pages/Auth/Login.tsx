import * as React from "react"
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react"
import { Link, useForm } from "@inertiajs/react"
import { AuthLayout } from "@/Layouts/AuthLayout"
import { Label } from "@/components/ui/label"

export default function Login() {
  const { data, setData, post, processing, errors, reset } = useForm({
    identifier: "",
    password: "",
    remember: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post("/login", {
      onFinish: () => reset("password"),
    })
  }

  return (
    <AuthLayout
      title="Masuk ke Portal BK-EWS"
      subtitle="Masukkan NIP atau Alamat Email terdaftar Anda"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert if any */}
        {errors.identifier && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.identifier}</span>
          </div>
        )}

        {/* NIP / Email Input */}
        <div className="space-y-1.5">
          <Label htmlFor="identifier" className="text-xs font-bold text-slate-700">
            NIP atau Alamat Email
          </Label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="identifier"
              type="text"
              required
              autoFocus
              value={data.identifier}
              onChange={(e) => setData("identifier", e.target.value)}
              placeholder="Contoh: 19820415... atau nama@sekolah.sch.id"
              className="w-full pl-10 pr-4 h-11 text-xs rounded-xl neo-inset bg-[#E7EDF4] text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-bold text-slate-700">
              Kata Sandi
            </Label>
            <a href="#forgot" className="text-[11px] text-blue-600 hover:underline">
              Lupa Sandi?
            </a>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type="password"
              required
              value={data.password}
              onChange={(e) => setData("password", e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 h-11 text-xs rounded-xl neo-inset bg-[#E7EDF4] text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-600">{errors.password}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="remember"
            checked={data.remember}
            onChange={(e) => setData("remember", e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <Label htmlFor="remember" className="text-xs text-slate-600 font-normal cursor-pointer">
            Ingat saya di perangkat ini
          </Label>
        </div>

        {/* Submit Button - Soft Neumorphic Primary Button */}
        <button
          type="submit"
          disabled={processing}
          className="w-full h-11 neo-btn-primary text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          <span>{processing ? "Memproses Autentikasi..." : "Masuk ke Dashboard"}</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>

        {/* Register Link */}
        <div className="text-center pt-2 text-xs text-slate-500">
          Belum memiliki akun terdaftar?{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:underline">
            Daftar Akun Pendidik
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
