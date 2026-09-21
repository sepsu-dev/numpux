"use client";

import { AlertCircle, Edit3, Sparkles, BookOpen, Check, ShieldCheck, Zap } from "lucide-react";

export function VisualShowcase() {
    return (
        <section className="py-24 relative overflow-hidden bg-background">
            {/* Soft grid background */}
            <div className="absolute inset-0 bg-dot-grid pointer-events-none z-0" />

            <div className="container max-w-5xl mx-auto px-6 relative z-10 text-center">
                {/* Header */}
                <div className="max-w-xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-[38px] font-bold text-foreground tracking-tight leading-tight mb-4">
                        Lacak, Tingkatkan, dan<br />
                        <span className="text-muted-foreground font-medium">Berkembang Setiap Hari</span>
                    </h2>
                </div>

                {/* Staggered Floating Cards & Mobile Phone Mockup Layout */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 lg:gap-16">
                    {/* Left Column - Floating Cards */}
                    <div className="flex-1 flex flex-col gap-6 w-full max-w-[280px]">
                        {/* Yellow Card */}
                        <div className="p-5 rounded-xl bg-amber-100/80 border border-amber-200 text-left crave-shadow hover:scale-[1.02] transition-all duration-300">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                                    <AlertCircle className="w-4.5 h-4.5 text-amber-600" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-amber-950">Prioritas Cerdas</h4>
                                    <p className="text-[11px] text-amber-900/80 leading-normal mt-0.5 font-normal">
                                        Urutkan tugas berdasarkan tenggat waktu terdekat.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Teal/Light Green Card */}
                        <div className="p-5 rounded-xl bg-emerald-100/80 border border-emerald-200 text-left crave-shadow hover:scale-[1.02] transition-all duration-300">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Edit3 className="w-4.5 h-4.5 text-emerald-600" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-emerald-950">Deskripsi Lengkap</h4>
                                    <p className="text-[11px] text-emerald-900/80 leading-normal mt-0.5 font-normal">
                                        Tambahkan sub-tugas dan daftar checklist detail.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column - Mobile Phone Mockup */}
                    <div className="shrink-0 relative">
                        {/* Glowing shadow behind Mockup */}
                        <div className="absolute inset-0 bg-primary/25 rounded-[36px] blur-3xl -z-10 transform scale-105" />

                        {/* Phone Container */}
                        <div className="w-[280px] h-[560px] rounded-[36px] border-[10px] border-stone-950 bg-white shadow-lg relative overflow-hidden flex flex-col shrink-0 crave-shadow select-none">
                            {/* Dynamic Island Capsule Notch */}
                            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4.5 bg-stone-950 rounded-full z-40 flex items-center justify-center" />

                            {/* Status Bar */}
                            <div className="h-10 px-6 flex justify-between items-center text-[9px] font-semibold text-stone-900 z-30 pt-1">
                                <span>9:41</span>
                                <div className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 bg-stone-900 rounded-full scale-[0.8]" />
                                    <span className="w-3.5 h-2 border border-stone-900 rounded-sm" />
                                </div>
                            </div>

                            {/* App UI Screen */}
                            <div className="flex-1 flex flex-col p-4 text-left bg-stone-50/50 overflow-y-auto no-scrollbar pb-6 z-20">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4 mt-1">
                                    <div>
                                        <p className="text-[9px] text-muted-foreground font-medium">Hai Kristin ⚡</p>
                                        <p className="text-[11px] font-semibold text-foreground">Selamat Siang!</p>
                                    </div>
                                    <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-medium text-foreground border border-stone-300">
                                        K
                                    </div>
                                </div>

                                {/* Calendar dots */}
                                <div className="grid grid-cols-7 gap-1.5 mb-4 border-b border-stone-200/40 pb-3">
                                    {["S", "S", "R", "K", "J", "S", "M"].map((d, i) => (
                                         <div key={i} className="flex flex-col items-center gap-0.5">
                                             <span className="text-[7px] font-medium text-muted-foreground/60">{d}</span>
                                             <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-semibold ${i === 4 ? 'bg-primary text-primary-foreground' : 'bg-stone-200/50 text-foreground'}`}>
                                                 {i + 2}
                                             </span>
                                         </div>
                                    ))}
                                </div>

                                {/* Main Section Heading */}
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2.5">Perjalanan Proyek</p>
                                
                                {/* Yellow & Green Mini Cards Side-by-Side */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-200/80">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-700 mb-1" />
                                        <p className="text-[8px] font-semibold text-amber-950">Tugas Mendesak</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-[#8CE460]/20 border border-[#8CE460]/40">
                                        <Sparkles className="w-3.5 h-3.5 text-green-700 mb-1" />
                                        <p className="text-[8px] font-semibold text-green-950">Kolaborasi Aktif</p>
                                    </div>
                                </div>

                                {/* Explore Gradient Card */}
                                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-400 text-white flex flex-col justify-between h-[85px] mb-4 shadow-sm">
                                    <p className="text-[9px] font-bold leading-tight text-foreground">Jelajahi sumber daya pembelajaran kami</p>
                                    <button className="w-max px-2.5 py-1 rounded bg-stone-950 text-white text-[7px] font-semibold uppercase tracking-wider">
                                        Sumber Daya ↗
                                    </button>
                                </div>

                                {/* My Habits Checklist */}
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Tugas Harian</p>
                                <div className="space-y-2">
                                    <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-stone-100 flex items-center justify-center border border-stone-300">
                                                <Check className="w-3 h-3 text-green-700" strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-semibold text-foreground">Desain Wireframe</p>
                                                <p className="text-[7px] text-muted-foreground font-normal">Selesai • 13:00</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-stone-100 flex items-center justify-center border border-stone-300">
                                                <Check className="w-3 h-3 text-green-700" strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-semibold text-foreground">Refactor API Auth</p>
                                                <p className="text-[7px] text-muted-foreground font-normal">Selesai • 14:15</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile App Bottom Navigation Bar */}
                            <div className="h-12 border-t border-stone-200/80 bg-white flex items-center justify-around px-4 z-30 pb-2">
                                <span className="text-[12px] opacity-80 cursor-pointer">🏠</span>
                                <span className="text-[12px] opacity-40 cursor-pointer">📊</span>
                                <div className="w-6.5 h-6.5 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-sm">
                                    <span className="text-[10px] font-bold text-primary-foreground">+</span>
                                </div>
                                <span className="text-[12px] opacity-40 cursor-pointer">💬</span>
                                <span className="text-[12px] opacity-40 cursor-pointer">⚙️</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Floating Cards */}
                    <div className="flex-1 flex flex-col gap-6 w-full max-w-[280px]">
                        {/* Green Card */}
                        <div className="p-5 rounded-xl bg-[#8CE460]/20 border border-[#8CE460]/40 text-left crave-shadow hover:scale-[1.02] transition-all duration-300">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Sparkles className="w-4.5 h-4.5 text-green-700" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-green-950">Kolaborasi Tim</h4>
                                    <p className="text-[11px] text-green-900/80 leading-normal mt-0.5 font-normal">
                                        Bagikan proyek & delegasikan tugas secara langsung.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Blue Card */}
                        <div className="p-5 rounded-xl bg-blue-100 border border-blue-200 text-left crave-shadow hover:scale-[1.02] transition-all duration-300">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                                    <BookOpen className="w-4.5 h-4.5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-blue-950">Analitik Progres</h4>
                                    <p className="text-[11px] text-blue-900/80 leading-normal mt-0.5 font-normal">
                                        Pantau grafik penyelesaian tugas tim mingguan.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}