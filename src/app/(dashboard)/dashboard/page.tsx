"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    CheckCircle,
    CalendarBlank,
    ArrowUpRight,
    Briefcase,
    Clock,
} from "@phosphor-icons/react";
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
import { motion, useReducedMotion } from "framer-motion";
import { apiFetch } from "@/lib/api-client";

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
    priorityTasks: Array<{ id: string; title: string; project: string; priority: string; urgent: boolean }>;
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
    const reduceMotion = useReducedMotion();

    const [isMounted, setIsMounted] = useState(false);
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        const url = projectId ? `/api/dashboard?projectId=${projectId}` : "/api/dashboard";
        apiFetch(url)
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
        { label: "Project Status", value: "-", change: "-", up: true },
        { label: "Completed Tasks", value: "0", change: "0% done", up: true },
        { label: "In Progress", value: "0", change: "0 in review", up: true },
        { label: "Pending Tasks", value: "0", change: "0 total", up: true },
    ];
    const weeklyData = data?.weeklyActivity || [
        { day: "Mon", commits: 0 },
        { day: "Tue", commits: 0 },
        { day: "Wed", commits: 0 },
        { day: "Thu", commits: 0 },
        { day: "Fri", commits: 0 },
        { day: "Sat", commits: 0 },
        { day: "Sun", commits: 0 },
    ];
    const priorities = data?.priorityTasks || [];
    const deadlines = data?.deadlines || [];
    const sprint = data?.sprintProgress || {
        sprintName: "Overall progress",
        percentage: 0,
        completedCount: 0,
        totalCount: 0,
    };

    return (
        <motion.div
            className="space-y-6 pb-20"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl font-bold text-foreground tracking-tight">
                            {activeProject ? activeProject.title : "Work overview"}
                        </h2>
                        {activeProject ? (
                            <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium gap-1.5 rounded-md">
                                <Briefcase className="w-3 h-3 text-primary" />
                                {activeProject.category || "Project"}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="px-2.5 py-0.5 text-xs text-muted-foreground font-normal rounded-md">
                                All projects
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {activeProject
                            ? activeProject.description || "Status, task activity, and upcoming dates for this project."
                            : "A practical view of active projects, task progress, and upcoming dates."}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {projectId ? (
                        <Link
                            href={`/tasks/kanban?projectId=${projectId}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-none"
                        >
                            Open board
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    ) : (
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-4"
                        >
                            View projects
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    )}
                </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m, idx) => (
                    <motion.div
                        key={m.label}
                        className="bg-card border border-border/80 rounded-lg p-4 transition-colors shadow-none"
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">{m.label}</p>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-foreground tracking-tight">{m.value}</span>
                            <span className={`text-[11px] font-medium ${m.up ? "text-primary" : "text-amber-600"}`}>
                                {m.change}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Chart + Right sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Activity chart */}
                <div className="lg:col-span-2 bg-card border border-border/80 rounded-lg p-5 shadow-none">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                {activeProject ? `${activeProject.title} activity` : "Task activity"}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Tasks created by day of the week</p>
                        </div>
                        <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            This week
                        </span>
                    </div>
                    <div className="h-[210px] w-full">
                        {isMounted && (
                            <ResponsiveContainer width="100%" height={210} minWidth={0} debounce={100}>
                                <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "var(--muted-foreground)", fontWeight: "500", fontSize: 11 }}
                                        dy={10}
                                    />
                                    <Tooltip
                                        cursor={{ fill: "rgba(0,0,0,0.02)" }}
                                        contentStyle={{
                                            background: "var(--card)",
                                            border: "1px solid var(--border)",
                                            borderRadius: "6px",
                                            fontSize: "11px",
                                            padding: "6px 10px",
                                        }}
                                    />
                                    <Bar dataKey="commits" barSize={24} radius={[4, 4, 0, 0]}>
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
                <div className="bg-card border border-border/80 rounded-lg p-5 shadow-none flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={15} weight="bold" className="text-primary" />
                                <h3 className="text-sm font-semibold text-foreground">Priorities</h3>
                            </div>
                            {projectId && (
                                <Link
                                    href={`/tasks/kanban?projectId=${projectId}`}
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <span>Board</span>
                                </Link>
                            )}
                        </div>

                        {priorities.length === 0 ? (
                            <div className="p-6 text-center border border-dashed border-border rounded-lg">
                                <CheckCircle className="w-5 h-5 text-muted-foreground/40 mx-auto mb-1.5" />
                                <p className="text-xs font-medium text-muted-foreground">No urgent tasks</p>
                                <p className="text-[11px] text-muted-foreground/60 mt-0.5">High-priority work will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {priorities.map((task) => (
                                    <Link
                                        key={task.id}
                                        href={`/tasks?projectId=${projectId || ""}`}
                                        className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 hover:border-border hover:bg-muted/30 transition-colors cursor-pointer group"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                                {task.title}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">{task.project}</p>
                                        </div>
                                        {task.urgent && (
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-destructive/10 text-destructive shrink-0">
                                                {task.priority}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Deadlines */}
                <div className="bg-card border border-border/80 rounded-lg p-5 shadow-none">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarBlank size={15} className="text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">Upcoming due dates</h3>
                    </div>
                    <div className="space-y-2.5">
                        {deadlines.map((d, i) => (
                            <div
                                key={i}
                                className={`border-l-2 pl-3 py-0.5 ${d.active ? "border-primary" : "border-border"}`}
                            >
                                <p className="text-xs font-medium text-foreground">{d.title}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-muted-foreground/60" />
                                    {d.due}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Progress */}
                <div className="bg-card border border-border/80 rounded-lg p-5 shadow-none">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <p className="text-xs font-semibold text-foreground">{sprint.sprintName}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {sprint.completedCount} of {sprint.totalCount} tasks complete
                            </p>
                        </div>
                        <span className="text-xs font-bold text-primary">{sprint.percentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-colors duration-500"
                            style={{ width: `${sprint.percentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <div className="space-y-8 pb-20">
                    <div className="h-10 w-64 bg-muted/60 rounded-lg" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-muted/40 rounded-lg border border-border" />
                        ))}
                    </div>
                    <div className="h-64 bg-muted/40 rounded-lg border border-border" />
                </div>
            }
        >
            <DashboardContent />
        </Suspense>
    );
}
