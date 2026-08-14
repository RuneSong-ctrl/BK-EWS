import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    Sparkles,
    Layers,
    Code2,
    CheckCircle2,
    Rocket,
    Box,
    Cpu,
    Flame,
    Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WelcomeProps {
    laravelVersion: string;
    phpVersion: string;
}

export default function Welcome({ laravelVersion, phpVersion }: WelcomeProps) {
    const [counter, setCounter] = useState(0);
    const [activeTab, setActiveTab] = useState<'stack' | 'features' | 'architecture'>('stack');

    const stackItems = [
        {
            name: 'Laravel 11',
            desc: 'Backend framework kuat, aman, dan arsitektur super efisien.',
            icon: Flame,
            color: 'text-red-500',
            bg: 'bg-red-500/10 border-red-500/20',
            tag: `v${laravelVersion || '11.x'}`
        },
        {
            name: 'React 19',
            desc: 'UI library deklaratif modern dengan React Server Components ready.',
            icon: Code2,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10 border-cyan-500/20',
            tag: 'v19.x'
        },
        {
            name: 'Inertia.js v2',
            desc: 'The Modern Monolith. Jembatan tanpa overhead API/CORS/token ganda.',
            icon: Layers,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10 border-purple-500/20',
            tag: 'Monolith'
        },
        {
            name: 'Tailwind CSS v4',
            desc: 'Engine CSS mutakhir dengan performa lightning-fast & CSS native tokens.',
            icon: Zap,
            color: 'text-sky-400',
            bg: 'bg-sky-500/10 border-sky-500/20',
            tag: 'v4.0'
        },
        {
            name: 'shadcn/ui',
            desc: 'Komponen UI berkualitas tinggi, fleksibel, dan accessible.',
            icon: Box,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            tag: 'Radix UI'
        },
        {
            name: 'Framer Motion',
            desc: 'Animasi gestur & transisi halaman yang halus dan dinamis.',
            icon: Sparkles,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
            tag: 'Motion v13'
        },
    ];

    return (
        <>
            <Head title="Setup Laravel + React + Tailwind v4 + shadcn/ui" />

            <div className="relative min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white overflow-hidden">
                {/* Subtle Background Glows */}
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

                {/* Navbar */}
                <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <Rocket className="size-5 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                                Laravel Monolith Stack
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-slate-800 bg-slate-900/60 text-slate-300 gap-1.5 py-1 px-3">
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                PHP {phpVersion}
                            </Badge>
                            <Badge variant="outline" className="border-slate-800 bg-slate-900/60 text-slate-300 gap-1.5 py-1 px-3">
                                Laravel {laravelVersion}
                            </Badge>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center space-y-6 max-w-3xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold">
                            <Sparkles className="size-3.5" />
                            <span>Arsitektur Ringan & High Performance</span>
                        </div>

                        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
                            Laravel + React + Tailwind v4 + <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">shadcn/ui</span>
                        </h1>

                        <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                            Fondasi fullstack monolit modern bertenaga <strong className="text-slate-200">Inertia.js</strong>. Terintegrasi dengan icon <strong className="text-slate-200">Lucide</strong> dan animasi <strong className="text-slate-200">Framer Motion</strong>.
                        </p>

                        {/* Interactive Framer Motion & shadcn Button Showcase */}
                        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Button
                                    size="lg"
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 font-semibold gap-2"
                                    onClick={() => setCounter(c => c + 1)}
                                >
                                    <Activity className="size-4" />
                                    Test State React: {counter} Klik
                                </Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200"
                                    onClick={() => setCounter(0)}
                                >
                                    Reset Counter
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Stack Grid */}
                    <div className="mt-20">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Komponen Arsitektur</h2>
                                <p className="text-slate-400 text-sm">Semua modul telah terkonfigurasi dan siap pakai.</p>
                            </div>
                            <Badge className="bg-indigo-600/20 text-indigo-300 border-indigo-500/30">
                                6 Module Terpasang
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {stackItems.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <motion.div
                                        key={item.name}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: index * 0.08 }}
                                    >
                                        <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 group h-full flex flex-col justify-between">
                                            <CardHeader className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className={`p-2.5 rounded-lg border ${item.bg}`}>
                                                        <Icon className={`size-5 ${item.color}`} />
                                                    </div>
                                                    <Badge variant="outline" className="border-slate-800 text-slate-400 text-xs">
                                                        {item.tag}
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-lg text-white group-hover:text-indigo-300 transition-colors">
                                                    {item.name}
                                                </CardTitle>
                                                <CardDescription className="text-slate-400 text-sm leading-relaxed">
                                                    {item.desc}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardFooter className="pt-0">
                                                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                                                    <CheckCircle2 className="size-3.5" />
                                                    Siap Digunakan
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Why this architecture is lightweight */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="mt-16 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/80 p-8"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Cpu className="size-6 text-indigo-400" />
                            <h3 className="text-xl font-bold text-white">Kenapa Arsitektur Ini Ringan?</h3>
                        </div>
                        <ul className="grid sm:grid-cols-2 gap-4 text-sm text-slate-300">
                            <li className="flex items-start gap-2.5">
                                <CheckCircle2 className="size-4 text-indigo-400 shrink-0 mt-0.5" />
                                <span><strong>Single Process Server:</strong> Tidak memerlukan backend API server terpisah & node server terpisah saat production.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <CheckCircle2 className="size-4 text-indigo-400 shrink-0 mt-0.5" />
                                <span><strong>Zero API Boilerplate:</strong> Data langsung di-pass dari Controller Laravel ke props React tanpa serialisasi REST/GraphQL.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <CheckCircle2 className="size-4 text-indigo-400 shrink-0 mt-0.5" />
                                <span><strong>Tailwind v4 Engine:</strong> Kompilasi CSS hingga 5x lebih cepat dibanding v3, tanpa file tailwind.config.js besar.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <CheckCircle2 className="size-4 text-indigo-400 shrink-0 mt-0.5" />
                                <span><strong>shadcn Copy-Paste Model:</strong> Tanpa beban package runtime raksasa; hanya kode komponen yang Anda butuhkan yang masuk ke bundle.</span>
                            </li>
                        </ul>
                    </motion.div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
                    <p>Setup otomatis oleh AI Assistant &bull; Siap untuk pengembangan aplikasi modern.</p>
                </footer>
            </div>
        </>
    );
}
