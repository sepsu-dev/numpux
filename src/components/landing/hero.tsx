"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Highlighter } from "@/components/highlighter";

export function Hero() {
    return (
        <section className="relative pt-28 pb-20 overflow-hidden bg-[#FEFEFE]">
            {/* Subtle grid background */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <div className="container max-w-5xl mx-auto px-8 relative z-10">
                {/* Hero Text Block */}
                <div className="max-w-2xl mx-auto text-center mb-16">
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-sm bg-black/[0.03] border border-black/[0.06] mb-10">
                        <span className="flex h-1.5 w-1.5 rounded-sm bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Beta 2.0 · Integrasi Kalender</span>
                    </div>

                    <h1 className="text-[44px] md:text-[68px] font-black tracking-[-0.04em] mb-7 text-[#0A0A0A] leading-[1] font-heading">
                        Atur Tugas, Jadi Lebih{" "}
                        <span className="relative inline-block">
                            <em className="not-italic text-primary">Simpel</em>
                            <Highlighter variant={1} className="text-primary/30" />
                        </span>
                        {" "}<br className="hidden md:block" />
                        dan Terukur. —{" "}
                        <span className="relative inline-block">
                            <em className="not-italic text-accent">Numpux.</em>
                            <Highlighter variant={3} className="text-accent/30" />
                        </span>
                    </h1>


                    <p className="text-[15px] text-[#6B7280] font-medium mb-10 max-w-lg mx-auto leading-[1.7]">
                        Wujudkan produktivitas maksimal Anda setiap hari. Susun rencana lebih ringkas, pantau progres otomatis, dan{" "}
                        <span className="relative inline-block text-[#0A0A0A] font-black underline decoration-primary/30 decoration-2 underline-offset-4">
                            Raih Target Anda
                        </span>
                        {" "}dengan lebih pasti.
                    </p>






                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="px-8 py-4 rounded-sm bg-[#0A0A0A] text-white font-black text-[15px] shadow-[6px_6px_0_0_rgba(168,85,247,0.25)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all active:scale-95 inline-flex items-center gap-3 group"
                        >
                            Mulai Gratis Sekarang
                            <span className="w-5 h-5 rounded-sm bg-white/10 flex items-center justify-center group-hover:rotate-45 transition-transform text-[11px]">→</span>
                        </Link>
                        <Link
                            href="#features"
                            className="px-8 py-4 rounded-sm border-2 border-black/10 text-[#0A0A0A] font-black text-[15px] hover:border-black transition-colors"
                        >
                            Lihat Fitur
                        </Link>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em] mt-6">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span>100% Gratis</span>
                    </div>
                </div>

                {/* Dashboard Preview */}
                <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                    {/* Glow effects */}
                    <div className="absolute -top-16 left-1/4 -z-10 w-64 h-64 bg-primary/10 blur-[80px] rounded-full" />
                    <div className="absolute -bottom-16 right-1/4 -z-10 w-64 h-64 bg-accent/10 blur-[80px] rounded-full" />

                    <div className="rounded-sm border-2 border-black/[0.08] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.08)] overflow-hidden">


                        {/* Window chrome */}
                        <div className="flex items-center gap-2 px-6 py-4 border-b border-black/[0.06] bg-[#FAFAFA]">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                            <div className="mx-auto w-48 h-5 rounded-sm bg-black/[0.04] flex items-center justify-center">
                                <span className="text-[9px] text-muted-foreground/50 font-bold tracking-widest">numpux.app</span>
                            </div>
                        </div>

                        {/* App Layout */}
                        <div className="flex" style={{ height: "340px" }}>
                            {/* Sidebar */}
                            <div className="w-48 shrink-0 bg-[#FAFAFA] border-r border-black/[0.06] p-5 hidden md:flex flex-col gap-6">
                                <div className="flex items-center gap-2.5">
                                    <Image
                                        src="/logo.png"
                                        alt="Numpux Logo"
                                        width={28}
                                        height={28}
                                        className="rounded-sm"
                                    />
                                    <span className="text-sm font-black text-[#0A0A0A]">Numpux</span>
                                </div>


                                <div className="space-y-1.5">
                                    {["Dashboard", "Proyek", "Kalender", "Tim"].map((item, i) => (
                                        <div key={i} className={`text-xs font-bold px-3 py-2 rounded-sm ${i === 0 ? "bg-black/[0.05] text-[#0A0A0A]" : "text-muted-foreground/60"}`}>{item}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Main Panel */}
                            <div className="flex-1 p-7 overflow-hidden">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <div className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-1">Proyek Aktif</div>
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#0A0A0A]">Numpux Dashboard</h2>
                                    </div>
                                    <div className="flex -space-x-1.5">
                                        <div className="w-7 h-7 rounded-full bg-blue-400 border-2 border-white" />
                                        <div className="w-7 h-7 rounded-full bg-orange-400 border-2 border-white" />
                                        <div className="w-7 h-7 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-[8px] font-bold">+3</div>
                                    </div>
                                </div>

                                {/* Kanban Preview */}
                                <div className="grid grid-cols-3 gap-3 h-44 overflow-hidden">
                                    {[
                                        { label: "To Do", color: "bg-gray-100", items: ["Riset UX", "Wireframe"] },
                                        { label: "In Progress", color: "bg-primary/5", items: ["Desain UI"] },
                                        { label: "Done", color: "bg-green-50", items: ["Setup Repo", "API Spec"] },
                                    ].map((col, i) => (
                                        <div key={i} className={`${col.color} rounded-sm p-3`}>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">{col.label}</div>
                                            <div className="space-y-1.5">
                                                {col.items.map((item, j) => (
                                                    <div key={j} className="bg-white rounded-sm px-2.5 py-2 text-[10px] font-bold text-[#0A0A0A] shadow-sm border border-black/[0.04]">{item}</div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
