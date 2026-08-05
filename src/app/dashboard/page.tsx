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
                    href="/dashboard/projects"
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
                        className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 hover:shadow-sm transition-all"
                    >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{m.label}</p>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-foreground">{m.value}</span>
                            <span className={`text-xs font-semibold ${m.up ? "text-emerald-500" : "text-red-500"}`}>
                                {m.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart + Right sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity chart */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Aktivitas Mingguan</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Commit per hari</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full">
                            +12%
                        </span>
                    </div>
                    <div className="h-[240px] w-full">
                        {isMounted && (
                            <ResponsiveContainer width="100%" height={240} minWidth={0} debounce={100}>
                                <BarChart data={taskData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "var(--muted-foreground)", fontWeight: "600", fontSize: 11 }}
                                        dy={10}
                                    />
                                    <Tooltip
                                        cursor={{ fill: "rgba(99,102,241,0.04)" }}
                                        contentStyle={{
                                            background: "var(--card)",
                                            border: "1px solid var(--border)",
                                            borderRadius: "10px",
                                            boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                                            fontSize: "11px",
                                            fontWeight: "600",
                                            padding: "10px",
                                        }}
                                    />
                                    <Bar dataKey="commits" barSize={34} radius={[4, 4, 0, 0]}>
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
                <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CheckCircle2 size={18} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Prioritas</h3>
                            <p className="text-[11px] text-muted-foreground">3 tugas mendesak</p>
                        </div>
                    </div>

                    <div className="space-y-3 flex-1">
                        {[
                            { title: "Refactor auth service", project: "Backend", urgent: true },
                            { title: "Fix bug Dockerfile", project: "DevOps" },
                            { title: "Optimize query DB", project: "Backend" },
                        ].map((task, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/20 hover:bg-muted/50 transition-all cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-muted-foreground shrink-0">
                                    <CheckCircle2 size={14} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-foreground truncate">{task.title}</p>
                                    <p className="text-[11px] text-muted-foreground">{task.project}</p>
                                </div>
                                {task.urgent && (
                                    <span className="ml-auto text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-100 dark:bg-red-950/20 dark:border-red-900/40 shrink-0">
                                        Mendesak
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <Link
                        href="/dashboard/tasks"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mt-4"
                    >
                        Lihat semua tugas →
                    </Link>
                </div>
            </div>

            {/* Bottom row — deadlines + progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Deadlines */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center gap-2.5 mb-5">
                        <CalendarDays size={18} className="text-primary" />
                        <h3 className="text-sm font-bold text-foreground">Deadline Mendatang</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="border-l-2 border-primary pl-4 py-1">
                            <p className="text-sm font-semibold text-foreground">Deploy ke Production</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Besok, 09:00</p>
                        </div>
                        <div className="border-l-2 border-muted pl-4 py-1">
                            <p className="text-sm font-semibold text-foreground">Code Review PR #402</p>
                            <p className="text-xs text-muted-foreground mt-0.5">26 Mei, 14:00</p>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Progress Sprint</p>
                            <p className="text-sm font-bold text-foreground mt-1">Sprint #14</p>
                        </div>
                        <span className="text-sm font-bold text-primary">72%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full w-[72%] transition-all duration-700" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">8 dari 11 tugas selesai</p>
                </div>
            </div>
        </div>
    );
}