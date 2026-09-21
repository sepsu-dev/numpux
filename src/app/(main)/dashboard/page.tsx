"use client";

import { useState, useEffect } from "react";
import {
    CheckCircle2,
    TrendingUp,
    CalendarDays,
    ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import {
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

const taskData = [
    { day: "Sen", commits: 12 },
    { day: "Sel", commits: 18 },
    { day: "Rab", commits: 15 },
    { day: "Kam", commits: 25 },
    { day: "Jum", commits: 20 },
    { day: "Sab", commits: 8 },
    { day: "Min", commits: 5 },
];

const metrics = [
    { label: "Total Proyek", value: "12", change: "+2", up: true },
    { label: "Tugas Selesai", value: "128", change: "+18%", up: true },
    { label: "Dalam Progress", value: "24", change: "-3", up: false },
    { label: "Anggota Tim", value: "8", change: "+1", up: true },
];

export default function DashboardPage() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Beranda</h2>
                    <p className="text-sm text-muted-foreground mt-1">Ringkasan aktivitas proyek Anda</p>
                </div>
                <Link
                    href="/projects"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4"
                >
                    Lihat semua
                    <ArrowUpRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m) => (
                    <div
                        key={m.label}
                        className="bg-card border border-border/80 rounded-xl p-4 transition-all"
                    >
                        <p className="text-xs font-medium text-muted-foreground mb-1">{m.label}</p>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-foreground">{m.value}</span>
                            <span className={`text-xs font-semibold ${m.up ? "text-emerald-600" : "text-red-500"}`}>
                                {m.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart + Right sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity chart */}
                <div className="lg:col-span-2 bg-card border border-border/80 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Aktivitas Mingguan</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Commit per hari</p>
                        </div>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full">
                            +12%
                        </span>
                    </div>
                    <div className="h-[220px] w-full">
                        {isMounted && (
                            <ResponsiveContainer width="100%" height={220} minWidth={0} debounce={100}>
                                <BarChart data={taskData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "var(--muted-foreground)", fontWeight: "500", fontSize: 11 }}
                                        dy={10}
                                    />
                                    <Tooltip
                                        cursor={{ fill: "rgba(99,102,241,0.04)" }}
                                        contentStyle={{
                                            background: "var(--card)",
                                            border: "1px solid var(--border)",
                                            borderRadius: "8px",
                                            fontSize: "11px",
                                            fontWeight: "500",
                                            padding: "8px 12px",
                                        }}
                                    />
                                    <Bar dataKey="commits" barSize={28} radius={[4, 4, 0, 0]}>
                                        {taskData.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={index === 3 || index === 4 ? "var(--primary)" : "var(--border)"}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Priority tasks */}
                <div className="bg-card border border-border/80 rounded-xl p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-5">
                            <CheckCircle2 size={16} className="text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Prioritas Utama</h3>
                        </div>

                        <div className="space-y-2.5">
                            {[
                                { title: "Refactor auth service", project: "Backend", urgent: true },
                                { title: "Fix bug Dockerfile", project: "DevOps" },
                                { title: "Optimize query DB", project: "Backend" },
                            ].map((task, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-border transition-all cursor-pointer"
                                >
                                    <div className="min-w-0 pr-2">
                                        <p className="text-xs font-semibold text-foreground truncate">{task.title}</p>
                                        <p className="text-[11px] text-muted-foreground">{task.project}</p>
                                    </div>
                                    {task.urgent && (
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:border-red-900/40 shrink-0">
                                            Mendesak
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Link
                        href="/tasks"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-4"
                    >
                        Lihat semua tugas →
                    </Link>
                </div>
            </div>

            {/* Bottom row — deadlines + progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Deadlines */}
                <div className="bg-card border border-border/80 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarDays size={16} className="text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">Deadline Mendatang</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="border-l-2 border-primary pl-3 py-0.5">
                            <p className="text-xs font-semibold text-foreground">Deploy ke Production</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Besok, 09:00</p>
                        </div>
                        <div className="border-l-2 border-muted pl-3 py-0.5">
                            <p className="text-xs font-semibold text-foreground">Code Review PR #402</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">26 Mei, 14:00</p>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className="bg-card border border-border/80 rounded-xl p-5">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <p className="text-xs font-semibold text-foreground">Progress Sprint</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Sprint #14 (8 dari 11 tugas selesai)</p>
                        </div>
                        <span className="text-xs font-bold text-primary">72%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full w-[72%] transition-all duration-700" />
                    </div>
                </div>
            </div>
        </div>
    );
}