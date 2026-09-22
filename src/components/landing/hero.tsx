"use client";

import Link from "next/link";
import { Plus, Activity, Layers, Calendar, Users, TrendingUp } from "lucide-react";

export function Hero() {
    return (
        <section className="relative pt-16 pb-24 md:pt-24 md:pb-36 overflow-hidden bg-background">
            {/* Soft grid background */}
            <div className="absolute inset-0 bg-dot-grid pointer-events-none z-0" />

            {/* Gentle ambient glow behind layout */}
            <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[100px] pointer-events-none z-0" />

            <div className="container max-w-5xl mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
                    {/* Left Column - Hero Teks */}
                    <div className="flex-1 text-left max-w-xl lg:max-w-none">
                        {/* Free Tag */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/10 mb-6">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-semibold tracking-wider text-green-900 uppercase">
                                100% Free Forever
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-[48px] font-bold tracking-tight text-foreground leading-[1.15] mb-5">
                            Organize Tasks Effortlessly,<br />
                            <span className="text-muted-foreground font-medium">Deliver Projects Faster</span>
                        </h1>

                        <p className="text-base text-muted-foreground leading-relaxed max-w-md mb-8 font-normal">
                            Modern task and project workspace built for developers, designers, and fast-moving teams. Unlimited boards, zero bloat, and completely free.
                        </p>

                        <div className="flex flex-col sm:flex-row items-start gap-4">
                            <Link
                                href="/register"
                                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 rounded-xl lime-glow-button text-primary-foreground font-semibold text-sm transition-transform active:scale-95 cursor-pointer shadow-sm"
                            >
                                Start for Free
                            </Link>
                        </div>
                    </div>

                    {/* Right Column - Web App Dashboard Mockup (Text on left, Dashboard on right) */}
                    <div className="flex-1 w-full flex items-center justify-center relative min-h-[500px]">
                        {/* Green decorative background blob */}
                        <div className="absolute w-[300px] h-[300px] bg-primary/20 rounded-full blur-[80px] -z-10" />

                        {/* Web Mockup Container */}
                        <div className="relative w-full max-w-[480px] lg:max-w-[500px] p-2 rounded-2xl border crave-border bg-stone-100/50 backdrop-blur-xl shadow-lg shadow-black/5">
                            <div className="rounded-xl border border-stone-200 bg-white overflow-hidden crave-shadow">
                                {/* Window Header */}
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 bg-stone-50">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                                    </div>
                                    <div className="mx-auto h-5.5 w-48 rounded-full bg-stone-200/50 border border-stone-200/40 flex items-center justify-center">
                                        <span className="text-[9px] text-muted-foreground font-bold tracking-wide">numpux.app/dashboard</span>
                                    </div>
                                </div>

                                {/* Web Layout View */}
                                <div className="flex h-[320px] text-left">
                                    {/* Sidebar */}
                                    <div className="w-36 shrink-0 border-r border-stone-100 p-3 hidden sm:flex flex-col gap-4 bg-stone-50/40">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="w-5.5 h-5.5 rounded bg-primary flex items-center justify-center shadow-sm">
                                                <span className="text-primary-foreground text-[10px] font-bold">N</span>
                                            </div>
                                            <span className="text-[12px] font-bold text-foreground tracking-tight">Numpux</span>
                                        </div>
                                        <div className="space-y-1">
                                            {[
                                                { label: "Boards", icon: Layers, active: true },
                                                { label: "Team", icon: Users },
                                            ].map((item, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex items-center gap-2 text-[11px] font-medium px-2 py-2 rounded-lg transition-colors cursor-pointer ${item.active
                                                        ? "bg-primary/20 text-green-900 font-semibold"
                                                        : "text-muted-foreground hover:text-foreground"
                                                        }`}
                                                >
                                                    <item.icon className="w-3.5 h-3.5 text-green-800" />
                                                    {item.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Main Area */}
                                    <div className="flex-1 p-4 bg-white flex flex-col justify-between">
                                        {/* Board Header */}
                                        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                                            <div>
                                                <h4 className="text-xs font-semibold text-foreground">Landing Redesign</h4>
                                                <p className="text-[9px] text-muted-foreground">Main Workspace</p>
                                            </div>
                                            <Plus className="w-4 h-4 text-primary cursor-pointer" />
                                        </div>

                                        {/* Tasks columns mock */}
                                        <div className="grid grid-cols-3 gap-2 mt-3 flex-1">
                                            {[
                                                { label: "To Do", color: "bg-amber-400", tasks: [{ title: "User Research", act: false }] },
                                                { label: "In Progress", color: "bg-primary", tasks: [{ title: "Frontend Build", act: true }] },
                                                { label: "Done", color: "bg-emerald-400", tasks: [{ title: "Design System", act: false }] },
                                            ].map((col, i) => (
                                                <div key={i} className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-1.5 px-0.5">
                                                        <span className={`w-1 h-1 rounded-full ${col.color}`} />
                                                        <span className="text-[8px] font-semibold text-muted-foreground uppercase">{col.label}</span>
                                                    </div>
                                                    <div className="flex-1 space-y-1.5">
                                                        {col.tasks.map((t, j) => (
                                                            <div key={j} className={`p-2 rounded-xl border text-[9px] font-medium leading-snug ${t.act ? 'border-primary/50 bg-primary/10 text-green-950 font-semibold' : 'border-stone-100 bg-stone-50/50 text-foreground'}`}>
                                                                {t.title}
                                                            </div>
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
                </div>
            </div>
        </section>
    );
}