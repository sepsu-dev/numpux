"use client";

import { Quote, ShieldCheck, Zap, Heart } from "lucide-react";

export function WhyChooseUs() {
    return (
        <section className="py-24 relative overflow-hidden bg-stone-50/50 border-t border-border">
            {/* Soft grid background */}
            <div className="absolute inset-0 bg-dot-grid pointer-events-none z-0" />

            <div className="container max-w-5xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center max-w-xl mx-auto mb-16">
                    <span className="inline-block text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground bg-primary/20 px-3 py-1 rounded-full mb-4">
                        Why Choose Numpux
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                        Engineered for High-Output Teams
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-normal">
                        We believe task management should be lightning fast, beautifully simple, and free of unnecessary overhead.
                    </p>
                </div>

                {/* Key Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {[
                        {
                            title: "Distraction-Free Focus",
                            desc: "A clean, minimalist layout with zero ad noise. Focus 100% on high-value execution without cognitive clutter.",
                            icon: Zap,
                            color: "text-amber-600 bg-amber-50"
                        },
                        {
                            title: "100% Free Forever",
                            desc: "All core capabilities—from responsive Kanban boards to collaborative timelines—are yours with no hidden fees.",
                            icon: Heart,
                            color: "text-rose-600 bg-rose-50"
                        },
                        {
                            title: "Enterprise-Grade Privacy",
                            desc: "Your data is safeguarded with robust HTTPS standards and isolated environments so your workspaces stay confidential.",
                            icon: ShieldCheck,
                            color: "text-emerald-600 bg-emerald-50"
                        }
                    ].map((benefit, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl border border-border text-left crave-shadow flex flex-col items-start">
                            <div className={`w-10 h-10 rounded-xl ${benefit.color} flex items-center justify-center mb-4`}>
                                <benefit.icon className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground mb-2">{benefit.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed font-normal">{benefit.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Staggered Testimonials */}
                <div className="border-t border-border/80 pt-20">
                    <div className="text-center max-w-xl mx-auto mb-12">
                        <h3 className="text-2xl font-bold text-foreground tracking-tight">Loved by Product Builders</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                text: "The Kanban board is exceptionally smooth. It gives me clarity on design deliverables without getting bogged down by useless settings.",
                                author: "Kristin Watson",
                                role: "Lead Product Designer",
                                avatar: "🎨"
                            },
                            {
                                text: "As a software engineer, speed is paramount. Numpux is lightweight, snappy, and lets me track sprint tasks with zero friction.",
                                author: "Alex Chen",
                                role: "Senior Fullstack Engineer",
                                avatar: "💻"
                            },
                            {
                                text: "Managing multiple campaign launches used to be chaotic. With Numpux, the timelines keep our entire cross-functional team aligned.",
                                author: "Sarah Jenkins",
                                role: "Growth & Product Marketing",
                                avatar: "📈"
                            }
                        ].map((t, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-xl border border-border text-left crave-shadow flex flex-col justify-between relative">
                                <Quote className="absolute top-4 right-4 w-8 h-8 text-stone-100 -z-0" />
                                <div className="relative z-10">
                                    <p className="text-xs text-muted-foreground leading-relaxed italic mb-6 font-normal">
                                        "{t.text}"
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                                    <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-sm">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">{t.author}</p>
                                        <p className="text-[11px] text-muted-foreground font-medium">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
