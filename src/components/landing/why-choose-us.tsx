"use client";

import { ShieldCheck, Lightning, Heart } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export function WhyChooseUs() {
    return (
        <section className="py-20 relative overflow-hidden bg-muted/30 border-t border-border/60">
            <div className="container max-w-5xl mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4 }}
                    className="text-center max-w-xl mx-auto mb-14"
                >
                    <span className="inline-block text-xs font-medium uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                        Why Numpux
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
                        Designed for fast execution
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed font-normal">
                        Task management should be fast, simple, and get completely out of your way.
                    </p>
                </motion.div>

                {/* Key Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {[
                        {
                            title: "Distraction-Free Focus",
                            desc: "A clean, intentional layout. Focus completely on what needs to get done without unnecessary interface clutter.",
                            icon: Lightning,
                        },
                        {
                            title: "100% Free Forever",
                            desc: "All core functionality—from responsive Kanban boards to sprint tracking—is available without paywalls or trial limits.",
                            icon: Heart,
                        },
                        {
                            title: "Reliable & Private",
                            desc: "Fast, encrypted local-first performance with persistent storage to keep your team's project records safe.",
                            icon: ShieldCheck,
                        }
                    ].map((benefit, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.35, delay: idx * 0.1 }}
                            className="bg-card p-6 rounded-xl border border-border/80 text-left flex flex-col items-start cursor-default shadow-2xs hover:border-border transition-all"
                        >
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-4 text-primary">
                                <benefit.icon className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground mb-1.5">{benefit.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed font-normal">{benefit.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Testimonials */}
                <div className="border-t border-border/60 pt-16">
                    <div className="text-center max-w-xl mx-auto mb-10">
                        <h3 className="text-xl font-bold text-foreground tracking-tight">Loved by product teams</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[
                            {
                                text: "The Kanban board is exceptionally smooth and fast. It gives me immediate clarity on design deliverables without clutter.",
                                author: "Kristin Watson",
                                role: "Product Designer",
                            },
                            {
                                text: "Speed is everything. Numpux is lightweight, snappy, and lets me track sprint tasks with zero overhead.",
                                author: "Alex Chen",
                                role: "Fullstack Engineer",
                            },
                            {
                                text: "Managing product iterations used to feel messy. With Numpux, the team stays aligned and tasks get shipped.",
                                author: "Sarah Jenkins",
                                role: "Engineering Lead",
                            }
                        ].map((t, idx) => (
                            <div key={idx} className="bg-card p-5 rounded-xl border border-border/80 text-left flex flex-col justify-between shadow-2xs">
                                <p className="text-xs text-muted-foreground leading-relaxed mb-5 font-normal">
                                    "{t.text}"
                                </p>
                                <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                        {t.author.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">{t.author}</p>
                                        <p className="text-[11px] text-muted-foreground">{t.role}</p>
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
