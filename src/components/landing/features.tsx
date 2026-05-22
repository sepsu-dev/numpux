"use client";

import {
    Layers,
    Users,
    BarChart3,
    Zap
} from "lucide-react";
import { Highlighter } from "@/components/highlighter";

const features = [
    {
        title: "Kanban Board",
        desc: "Visualisasi alur kerja yang intuitif dengan drag-and-drop, status kustom, dan filter cepat.",
        icon: Layers,
        color: "text-primary",
        bg: "bg-primary/5"
    },
    {
        title: "Strategic Calendar",
        desc: "Sinkronisasi deadline dan milestone dalam satu tampilan kalender yang komprehensif.",
        icon: BarChart3,
        color: "text-accent",
        bg: "bg-accent/5"
    },
    {
        title: "Team Collaboration",
        desc: "Assign tugas, komentar, dan pantau progres bersama tim di mana saja secara real-time.",
        icon: Users,
        color: "text-primary",
        bg: "bg-primary/5"
    },
    {
        title: "Smart Reminders",
        desc: "Notifikasi proaktif yang memastikan tidak ada satu pun deadline yang terlewat.",
        icon: Zap,
        color: "text-accent",
        bg: "bg-accent/5"
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 bg-[#F9FAFB] relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-64 h-64 text-primary/5 rotate-[-15deg] pointer-events-none">
                <Highlighter variant={1} />
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 text-accent/5 rotate-[15deg] pointer-events-none">
                <Highlighter variant={3} />
            </div>

            <div className="container max-w-5xl mx-auto px-8 relative z-10">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="inline-block px-4 py-1.5 rounded-sm bg-primary/10 text-primary text-[10px] font-black mb-5 uppercase tracking-[0.25em] border border-primary/15">
                        Capabilities
                    </span>
                    <h2 className="text-[32px] md:text-[48px] font-black tracking-[-0.03em] text-[#0A0A0A] font-heading leading-[1.1] mb-5">
                        Solusi Lengkap{" "}
                        <span className="relative inline-block">
                            Manajemen Tugas.
                            <Highlighter variant={3} className="text-primary/20" />
                        </span>
                    </h2>
                    <p className="text-[15px] text-[#6B7280] font-medium leading-[1.7] max-w-md mx-auto">
                        Dari pencatatan harian hingga perencanaan proyek tim, semua dikelola secara otomatis, teratur, dan tanpa repot.
                    </p>



                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="p-8 rounded-sm border border-black/[0.06] bg-white hover:border-black/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 group flex items-start gap-5 relative overflow-hidden"
                        >
                            {/* Decorative Scribble */}
                            <div className="absolute -top-4 -right-4 w-12 h-12 text-primary/5 group-hover:scale-150 transition-transform">
                                <Highlighter variant={idx % 3 + 1 as 1 | 2 | 3} />
                            </div>

                            <div className={`w-11 h-11 shrink-0 rounded-sm ${feature.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <feature.icon className={`w-5 h-5 ${feature.color}`} />
                            </div>
                            <div>
                                <h3 className="text-[16px] font-black mb-1.5 text-[#0A0A0A] tracking-tight relative inline-block">
                                    {feature.title}
                                    <Highlighter variant={(idx % 3 + 1) as 1 | 2 | 3} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary/10" />
                                </h3>
                                <p className="text-[13px] text-[#6B7280] font-medium leading-[1.6]">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
