"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    CheckCircle2,
    CalendarDays,
    ArrowUpRight,
    Briefcase,
    Plus,
    Clock,
    Flame,
    CheckCircle
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
import { Badge } from "@/components/ui/badge";

type DashboardData = {
    project: {
        id: string;
        title: string;
        description: string;
        category: string;
        status: string;
        progress: number;
    } | null;
    metrics: Array<{ label: string; value: string; change: string; up: boolean }>;
    weeklyActivity: Array<{ day: string; commits: number }>;
    priorityTasks: Array<{ id: string; title: string; project: string; urgent: boolean }>;
    deadlines: Array<{ title: string; due: string; active: boolean }>;
    sprintProgress: {
        sprintName: string;
        percentage: number;
        completedCount: number;
        totalCount: number;
    };
};

function DashboardContent() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get("projectId") || "";

    const [isMounted, setIsMounted] = useState(false);
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        const url = projectId ? `/api/dashboard?projectId=${projectId}` : "/api/dashboard";
        fetch(url)
            .then((res) => res.json())
            .then((json) => {
                if (json.data) {
                    setData(json.data);
                }
            })
            .catch((err) => console.error("Failed to load dashboard data", err))
            .finally(() => setIsLoading(false));
    }, [projectId]);

    const activeProject = data?.project;
    const metrics = data?.metrics || [
        { label: "Active Projects", value: "3", change: "+2 this mo", up: true },
        { label: "Completed Tasks", value: "1", change: "20%", up: true },
        { label: "In Progress", value: "1", change: "1 in review", up: true },
        { label: "Team Members", value: "8", change: "+1 active", up: true },
    ];
    const weeklyData = data?.weeklyActivity || [
        { day: "Mon", commits: 12 },
        { day: "Tue", commits: 18 },
        { day: "Wed", commits: 15 },
        { day: "Thu", commits: 25 },
        { day: "Fri", commits: 20 },
        { day: "Sat", commits: 8 },
        { day: "Sun", commits: 5 },
    ];
    const priorities = data?.priorityTasks || [];
    const deadlines = data?.deadlines || [];
    const sprint = data?.sprintProgress || {
        sprintName: "Active Sprint",
        percentage: 50,
        completedCount: 1,
        totalCount: 2,
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">
                            {activeProject ? activeProject.title : "Dashboard Overview"}
                        </h2>
                        {activeProject ? (
                            <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-semibold gap-1.5">
                                <Briefcase className="w-3 h-3 text-primary" />
                                {activeProject.category || "Project Scope"}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="px-2.5 py-0.5 text-xs text-muted-foreground">
                                Workspace Wide
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        {activeProject
                            ? activeProject.description || "Filtered real-time metrics and sprint execution for this project."
                            : "High-level summary of your active engineering projects, metrics, and velocity."}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {projectId ? (
                        <Link
                            href={`/tasks/kanban?projectId=${projectId}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                        >
                            Open Project Board
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    ) : (
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4"
                        >
                            View All Projects
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m) => (
                    <div
                        key={m.label}
                        className="bg-card border border-border/80 rounded-xl p-4 transition-all hover:border-border"
                    >
                        <p className="text-xs font-medium text-muted-foreground mb-1">{m.label}</p>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-foreground tracking-tight">{m.value}</span>
                            <span className={`text-xs font-semibold ${m.up ? "text-primary" : "text-amber-600 dark:text-amber-400"}`}>
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
                            <h3 className="text-sm font-semibold text-foreground">
                                {activeProject ? `${activeProject.title} Velocity` : "Weekly Velocity"}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Estimated tasks & commits cadence per day</p>
                        </div>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                            Active Pulse
                        </span>
                    </div>
                    <div className="h-[220px] w-full">
                        {isMounted && (
                            <ResponsiveContainer width="100%" height={220} minWidth={0} debounce={100}>
                                <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
                                        {weeklyData.map((_, index) => (
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
                        <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-primary" />
                                <h3 className="text-sm font-semibold text-foreground">Top Priorities</h3>
                            </div>
                            {projectId && (
                                <Link
                                    href={`/tasks/new?projectId=${projectId}`}
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>New</span>
                                </Link>
                            )}
                        </div>

                        {priorities.length === 0 ? (
                            <div className="p-6 text-center border border-dashed border-border rounded-xl">
                                <CheckCircle className="w-7 h-7 text-muted-foreground/50 mx-auto mb-2" />
                                <p className="text-xs font-semibold text-muted-foreground">No urgent tasks</p>
                                <p className="text-[11px] text-muted-foreground/70 mt-0.5">All priority items are resolved or on track.</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {priorities.map((task) => (
                                    <Link
                                        key={task.id}
                                        href={`/tasks/edit/${task.id}`}
                                        className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-border hover:bg-muted/40 transition-all cursor-pointer group"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                {task.title}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">{task.project}</p>
                                        </div>
                                        {task.urgent && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:border-red-900/40 shrink-0 flex items-center gap-1">
                                                <Flame className="w-2.5 h-2.5" />
                                                Urgent
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link
                        href={projectId ? `/tasks?projectId=${projectId}` : "/tasks"}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-4"
                    >
                        View all tasks →
                    </Link>
                </div>
            </div>

            {/* Bottom row — deadlines + progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Deadlines */}
                <div className="bg-card border border-border/80 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarDays size={16} className="text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">Upcoming Milestones</h3>
                    </div>
                    <div className="space-y-3">
                        {deadlines.map((d, i) => (
                            <div
                                key={i}
                                className={`border-l-2 pl-3 py-0.5 ${d.active ? "border-primary" : "border-muted"}`}
                            >
                                <p className="text-xs font-semibold text-foreground">{d.title}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-muted-foreground/70" />
                                    {d.due}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Progress */}
                <div className="bg-card border border-border/80 rounded-xl p-5">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <p className="text-xs font-semibold text-foreground">{sprint.sprintName}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {sprint.completedCount} of {sprint.totalCount} tasks completed
                            </p>
                        </div>
                        <span className="text-xs font-bold text-primary">{sprint.percentage}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-700"
                            style={{ width: `${sprint.percentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <div className="space-y-8 animate-pulse pb-20">
                    <div className="h-10 w-64 bg-muted/60 rounded-xl" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-muted/40 rounded-xl border border-border" />
                        ))}
                    </div>
                    <div className="h-64 bg-muted/40 rounded-xl border border-border" />
                </div>
            }
        >
            <DashboardContent />
        </Suspense>
    );
}