"use client";

import { Layers, Calendar, Users, BarChart3 } from "lucide-react";

export function Features() {
    return (
        <section id="features" className="py-20 relative overflow-hidden bg-background">
            {/* Soft grid background */}
            <div className="absolute inset-0 bg-dot-grid pointer-events-none z-0" />

            <div className="container max-w-5xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-xl mx-auto mb-16">
                    <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground bg-primary/20 px-3.5 py-1.5 rounded-xl mb-4">
                        Fitur Utama
                    </span>
                    <h2 className="text-3xl md:text-4xl font-sans font-black text-foreground tracking-tight mb-4">
                        Kelola Proyek Lebih Terstruktur
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Alat manajemen tugas yang dirancang untuk menjaga fokus dan produktivitas tim Anda tetap optimal.
                    </p>
                </div>

                {/* Additional Features Grid - 4 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            title: "Papan Kanban",
                            desc: "Kelola alur kerja secara visual menggunakan fitur drag-and-drop papan Kanban yang intuitif.",
                            icon: Layers,
                            color: "bg-rose-100 text-rose-700"
                        },
                        {
                            title: "Kalender Tim",
                            desc: "Petakan tenggat waktu tugas, rencana rilis, dan milestone mingguan dalam kalender rapi.",
                            icon: Calendar,
                            color: "bg-blue-100 text-blue-700"
                        },
                        {
                            title: "Kolaborasi Instan",
                            desc: "Undang rekan kerja tanpa batasan, delegasikan tugas harian, dan berdiskusi secara real-time.",
                            icon: Users,
                            color: "bg-amber-100 text-amber-700"
                        },
                        {
                            title: "Analitik Progres",
                            desc: "Pantau persentase penyelesaian tugas dan performa sprint mingguan dengan grafik ringkas.",
                            icon: BarChart3,
                            color: "bg-emerald-100 text-emerald-700"
                        }
                    ].map((feature, idx) => (
                        <div key={idx} className="p-6 rounded-xl border border-border bg-white text-left crave-shadow flex flex-col justify-between hover:scale-[1.02] transition-all duration-300">
                            <div>
                                <div className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                                    <feature.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-black text-foreground mb-2">{feature.title}</h3>
                                <p className="text-[12px] text-muted-foreground leading-relaxed">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}