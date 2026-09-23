"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, Clock } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export function Hero() {
    return (
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-background">
            <div className="container max-w-5xl mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-10">
                    {/* Left Column - Hero Content */}
                    <motion.div 
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-1 text-left max-w-xl lg:max-w-none"
                    >
                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/60 mb-6">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span className="text-[11px] font-medium tracking-wide text-foreground/80 uppercase">
                                Simple & Free Project Workspace
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-[46px] font-bold tracking-tight text-foreground leading-[1.15] mb-5">
                            Organize tasks simply.<br />
                            <span className="text-muted-foreground font-medium">Deliver work with clarity.</span>
                        </h1>

                        <p className="text-base text-muted-foreground leading-relaxed max-w-md mb-8 font-normal">
                            A focused task and project manager built for speed and clarity. No cognitive clutter, no unnecessary noise—just straightforward execution.
                        </p>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-98 transition-all shadow-xs cursor-pointer"
                            >
                                <span>Get Started Free</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-border bg-card hover:bg-muted/40 text-foreground font-medium text-sm transition-all cursor-pointer"
                            >
                                Sign In
                            </Link>
                        </div>
                    </motion.div>

                    {/* Right Column - Authentic UI Preview (No fake browser dots or URL bar) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-1 w-full flex items-center justify-center"
                    >
                        <div className="w-full max-w-[480px] rounded-xl border border-border/80 bg-card p-5 shadow-sm space-y-4">
                            {/* Header row */}
                            <div className="flex items-center justify-between pb-3 border-b border-border/60">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-foreground">Sprint Launch Beta</span>
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">In Progress</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">8 of 12 tasks completed (67%)</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>3 days left</span>
                                </div>
                            </div>

                            {/* Task List Sample */}
                            <div className="space-y-2">
                                {[
                                    { title: "Refactor Authentication flow & Session store", done: true, tag: "Backend" },
                                    { title: "Design clean & minimal project card UI", done: true, tag: "Design" },
                                    { title: "Kanban drag-and-drop alignment tests", done: false, tag: "Frontend", active: true },
                                    { title: "Final deployment and QA checklist", done: false, tag: "DevOps" },
                                ].map((task, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors ${
                                            task.active 
                                                ? "border-primary/40 bg-primary/5 text-foreground font-medium" 
                                                : "border-border/60 bg-background/50 text-foreground"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {task.done ? (
                                                <CheckCircle weight="fill" className="w-4 h-4 text-primary shrink-0" />
                                            ) : (
                                                <div className={`w-4 h-4 rounded border shrink-0 ${task.active ? "border-primary" : "border-muted-foreground/40"}`} />
                                            )}
                                            <span className={`truncate ${task.done ? "line-through text-muted-foreground" : ""}`}>
                                                {task.title}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-normal px-2 py-0.5 rounded bg-muted/60 shrink-0 ml-2">
                                            {task.tag}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Footer stats summary */}
                            <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>Updated 5 mins ago</span>
                                <span className="font-medium text-primary hover:underline cursor-pointer">Open workspace →</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}