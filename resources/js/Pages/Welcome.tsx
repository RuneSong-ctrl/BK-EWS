import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    IconUserCheck,
    IconHandshake,
    IconKepsek,
    IconLogIn,
    IconArrowRight,
    IconGroup,
    IconAi,
} from '@/components/ui/storage-icon';
import { Button } from '@/components/ui/button';
import { EwsStatusBadge } from '@/components/ews/EwsStatusBadge';

export default function Welcome() {
    const roles = [
        {
            title: 'Guru / Wali Kelas',
            desc: 'Pencatatan observasi perilaku cepat berbantuan AI, skala linear partisipasi, dan pemantauan 4 pilar siswa kelas.',
            href: '/dashboard/guru-kelas',
            icon: IconUserCheck,
            color: 'text-blue-600',
            bg: 'bg-blue-50 border-blue-200',
            badge: 'Kelas 10-MIPA-1',
        },
        {
            title: 'Guru BK / Konselor',
            desc: 'Konsolidasi portofolio konseling, watchlist siswa darurat, feed kasus, dan matriks holistik lintas jenjang sekolah.',
            href: '/dashboard/guru-bk',
            icon: IconHandshake,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 border-indigo-200',
            badge: 'Konselor Sekolah',
        },
        {
            title: 'Kepala Sekolah',
            desc: 'Executive summary iklim sekolah, navigasi berbasis anomali siswa kritis, tren akademik vs absensi, dan disposisi.',
            href: '/dashboard/kepsek',
            icon: IconKepsek,
            color: 'text-amber-600',
            bg: 'bg-amber-50 border-amber-200',
            badge: 'Pimpinan Eksekutif',
        },
    ];

    return (
        <>
            <Head title="E-Jurnal STIKMAS - Sistem Observasi & Early Warning System" />

            <div className="relative min-h-screen bg-[#F0F3F8] text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased overflow-hidden flex flex-col justify-between">
                {/* Background Soft Glows */}
                <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

                {/* Top Navbar */}
                <header className="relative z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/80 p-1.5 flex items-center justify-center shadow-md shadow-blue-500/10 overflow-hidden shrink-0">
                            <img src="/storage/stikmas.png" alt="Logo E-Jurnal STIKMAS" width={38} height={38} loading="eager" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                                    E-Jurnal STIKMAS
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    AI
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Sistem Observasi &amp; Peringatan Dini</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-xs font-bold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                        >
                            <IconLogIn className="w-4 h-4" />
                            <span>Masuk Sesi</span>
                        </Link>

                        <Link
                            href="/register"
                            className="neo-button bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                        >
                            <IconUserCheck className="w-4 h-4" />
                            <span>Daftar Staf</span>
                        </Link>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-16 space-y-12">
                    <div className="text-center space-y-5 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neo-pill bg-white border border-blue-200/80 text-blue-700 text-xs font-bold shadow-sm">
                            <IconAi className="w-4 h-4 text-blue-600" />
                            <span>Soft Neomorphism + Clean Minimalist SaaS • AI Powered</span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                            Sistem Bimbingan Konseling &amp; <br />
                            <span className="text-blue-600">AI Early Warning System (EWS)</span>
                        </h1>

                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                            Deteksi dini multidimensi berbasis 4 Pilar (Akademik, Kehadiran, Perilaku, Konseling BK) dengan AI Text Structuring, skala linear interaktif, dan kepatuhan privasi data UU PDP.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                            <EwsStatusBadge status="NORMAL" />
                            <EwsStatusBadge status="BERISIKO" />
                            <EwsStatusBadge status="WASPADA" />
                            <EwsStatusBadge status="KRITIS" />
                        </div>
                    </div>

                    {/* Role Gateway Cards */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                    Pilih Dashboard &amp; Modul Kerja
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Akses langsung ke masing-masing persona pengguna sistem
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {roles.map((role, idx) => {
                                const Icon = role.icon;
                                return (
                                    <motion.div
                                        key={role.title}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, delay: idx * 0.1 }}
                                    >
                                        <Link
                                            href={role.href}
                                            className="p-6 rounded-3xl neo-card bg-white border border-white/90 shadow-xl flex flex-col justify-between h-full group hover:border-blue-300 hover:shadow-2xl transition-all cursor-pointer block"
                                        >
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className={`p-3 rounded-2xl border ${role.bg}`}>
                                                        <Icon className={`w-6 h-6 ${role.color}`} />
                                                    </div>
                                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                        {role.badge}
                                                    </span>
                                                </div>

                                                <div>
                                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                        {role.title}
                                                    </h3>
                                                    <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                                                        {role.desc}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                                                <span>Buka Dashboard</span>
                                                <IconArrowRight className="w-4 h-4" />
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Access to Student Profile 360 */}
                    <div className="p-6 rounded-3xl neo-card bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-1.5 text-center sm:text-left">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                                <IconGroup className="w-3.5 h-3.5" />
                                <span>Contoh Lembar Kasus Interaktif</span>
                            </div>
                            <h3 className="text-lg font-bold">Lembar Profil Siswa 360° &amp; Rekomendasi Terpadu AI Advisor</h3>
                            <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
                                Tinjau evaluasi 2x2 grid 4 pilar EWS untuk Ahmad Fauzi (10-MIPA-1) dengan narasi AI terpadu multi-peran.
                            </p>
                        </div>

                        <Link
                            href="/students/1"
                            className="neo-button bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 shrink-0 transition-transform hover:scale-105"
                        >
                            <span>Lihat Profil Siswa #1</span>
                            <IconArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 border-t border-slate-200/80 bg-white/50 backdrop-blur-md py-6 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">E-Jurnal STIKMAS • Sistem Observasi &amp; Early Warning 2026</p>
                    <p className="text-[11px] text-slate-400">Arsitektur Laravel 13 + Inertia React 19 + Tailwind v4 + Soft Neomorphism</p>
                </footer>
            </div>
        </>
    );
}
