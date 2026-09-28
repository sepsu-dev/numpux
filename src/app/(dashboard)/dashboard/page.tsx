"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowClockwise, ArrowRight, ArrowUpRight, Briefcase, CalendarBlank, CheckCircle, Clock, Flag, WarningCircle } from "@phosphor-icons/react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { apiFetch } from "@/lib/api-client";

type DashboardData = {
  project: { id: string; title: string; description: string; category: string; status: string; progress: number } | null;
  metrics: Array<{ label: string; value: string; change: string; up: boolean }>;
  weeklyActivity: Array<{ day: string; commits: number }>;
  priorityTasks: Array<{ id: string; title: string; project: string; urgent: boolean }>;
  deadlines: Array<{ title: string; due: string; active: boolean }>;
  sprintProgress: { sprintName: string; percentage: number; completedCount: number; totalCount: number };
};

const metricColors = ["#078a55", "#1677ff", "#ffb000", "#ff6b4a"];

function DashboardContent() {
  const projectId = useSearchParams().get("projectId") || "";
  const [isMounted, setIsMounted] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => setIsMounted(true), []);
  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setData(null);
    setLoadError(null);
    const url = projectId ? `/api/dashboard?projectId=${projectId}` : "/api/dashboard";
    apiFetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Dashboard request failed");
        return res.json();
      })
      .then((json) => { if (isCurrent && json.data) setData(json.data); })
      .catch((error) => {
        console.error("Failed to load dashboard data", error);
        if (isCurrent) setLoadError("Dashboard data could not be loaded.");
      })
      .finally(() => { if (isCurrent) setIsLoading(false); });
    return () => { isCurrent = false; };
  }, [projectId, reloadKey]);

  const activeProject = data?.project;
  const metrics = data?.metrics || [
    { label: "Project status", value: "–", change: "No data", up: true },
    { label: "Completed tasks", value: "0", change: "0% done", up: true },
    { label: "In progress", value: "0", change: "0 in review", up: true },
    { label: "Pending tasks", value: "0", change: "0 total", up: true },
  ];
  const weeklyData = data?.weeklyActivity || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({ day, commits: 0 }));
  const priorities = data?.priorityTasks || [];
  const deadlines = data?.deadlines || [];
  const sprint = data?.sprintProgress || { sprintName: "Overall progress", percentage: 0, completedCount: 0, totalCount: 0 };

  if (isLoading && !data) return <DashboardLoading />;
  if (loadError && !data) {
    return <DataLoadError message={loadError} onRetry={() => setReloadKey((key) => key + 1)} />;
  }

  return (
    <div className="space-y-6 pb-16">
      <section className="flex flex-col justify-between gap-5 pb-2 sm:flex-row sm:items-end">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f4ed] px-2.5 py-1 text-[10px] font-medium text-[#367254]"><span className="h-1.5 w-1.5 rounded-full bg-[#5f9a78]" /> Your overview</span>
            {activeProject && <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"><Briefcase className="h-3.5 w-3.5" />{activeProject.category || "Project"}</span>}
          </div>
          <h1 className="font-heading text-3xl font-medium tracking-[-0.03em] text-foreground">{activeProject ? activeProject.title : "Today at a glance"}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{activeProject ? activeProject.description || "Tasks, priorities, and upcoming dates for this project." : "See what is moving, what needs attention, and what to do next."}</p>
        </div>
        <Link href={projectId ? `/tasks/kanban?projectId=${projectId}` : "/projects"} className="group inline-flex w-fit items-center gap-2 text-xs font-medium text-primary">{projectId ? "Open project board" : "Browse projects"}<ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <div key={metric.label} className="min-h-28 rounded-xl border border-border/70 bg-white p-4">
            <p className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground"><span className="h-2 w-2 rounded-full opacity-70" style={{ backgroundColor: metricColors[index % metricColors.length] }} />{metric.label}</p>
            <div className="mt-4 flex items-end justify-between gap-3"><span className="text-2xl font-medium tracking-tight text-foreground">{metric.value}</span><span className={`text-[10px] font-medium ${metric.up ? "text-primary" : "text-[#c56d00]"}`}>{metric.change}</span></div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_0.85fr]">
        <section className="overflow-hidden rounded-xl border border-border/70 bg-white">
          <div className="flex items-start justify-between border-b border-border/70 p-5">
            <div><p className="text-sm font-medium text-foreground">This week</p><p className="mt-1 text-xs text-muted-foreground">Tasks added each day</p></div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-[#8eb5e4]" /> New tasks</div>
          </div>
          <div className="h-[270px] p-5">
            {isMounted && <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}><BarChart data={weeklyData} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#667469", fontWeight: 600, fontSize: 10 }} dy={10} /><Tooltip cursor={{ fill: "#f3f5f0" }} contentStyle={{ background: "#fff", border: "1px solid #d9ded5", borderRadius: "4px", boxShadow: "none", fontSize: "11px", padding: "7px 10px" }} /><Bar dataKey="commits" barSize={28} radius={[3, 3, 0, 0]}>{weeklyData.map((_, index) => <Cell key={index} fill={index === 3 || index === 4 ? "#1677ff" : "#dce7f5"} />)}</Bar></BarChart></ResponsiveContainer>}
          </div>
        </section>

        <section className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-white">
          <div className="flex items-center justify-between border-b border-border/70 p-5"><div className="flex items-center gap-2"><Flag className="h-4 w-4 text-[#d6a142]" /><h2 className="text-sm font-medium">Needs attention</h2></div><span className="text-[10px] text-muted-foreground">{priorities.length} items</span></div>
          <div className="flex-1 p-4">
            {priorities.length === 0 ? <EmptyState icon={CheckCircle} title="Nothing urgent" copy="Priority work is resolved or on schedule." /> : <div className="divide-y divide-border">{priorities.map((task) => <Link key={task.id} href={`/tasks?projectId=${projectId}`} className="group flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-xs font-medium text-foreground group-hover:text-primary">{task.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{task.project}</p></div>{task.urgent && <span className="shrink-0 rounded-full bg-[#fff4df] px-2 py-1 text-[9px] font-medium text-[#9a6500]">Urgent</span>}</Link>)}</div>}
          </div>
          <Link href={projectId ? `/tasks?projectId=${projectId}` : "/tasks"} className="flex items-center justify-between border-t border-border/70 px-5 py-3 text-xs font-medium text-primary">View task list <ArrowRight className="h-3.5 w-3.5" /></Link>
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-border/70 bg-white p-5">
          <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><CalendarBlank className="h-4 w-4 text-[#729bc9]" /><h2 className="text-sm font-medium">Upcoming dates</h2></div><span className="text-[10px] text-muted-foreground">Next up</span></div>
          {deadlines.length === 0 ? <EmptyState icon={CalendarBlank} title="No dates scheduled" copy="Add a due date to make the next checkpoint visible." /> : <div className="space-y-4">{deadlines.map((deadline, index) => <div key={`${deadline.title}-${index}`} className="grid grid-cols-[3px_1fr] gap-3"><span className={deadline.active ? "bg-[#8eb5e4]" : "bg-border"} /><div><p className="text-xs font-medium text-foreground">{deadline.title}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="h-3 w-3" />{deadline.due}</p></div></div>)}</div>}
        </section>

        <section className="rounded-xl border border-border/70 bg-white p-5">
          <div className="flex items-start justify-between"><div><p className="text-sm font-medium">{sprint.sprintName}</p><p className="mt-1 text-xs text-muted-foreground">{sprint.completedCount} of {sprint.totalCount} tasks finished</p></div><span className="font-heading text-3xl font-medium text-primary">{sprint.percentage}%</span></div>
          <div className="mt-8 h-2 overflow-hidden bg-[#e3e8df]"><div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${sprint.percentage}%` }} /></div>
          <div className="mt-3 flex justify-between text-[10px] font-medium text-muted-foreground"><span>Started</span><span>Complete</span></div>
        </section>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, copy }: { icon: typeof CheckCircle; title: string; copy: string }) {
  return <div className="border border-dashed border-border bg-[#fafbf8] px-5 py-7 text-center"><Icon className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-xs font-medium text-foreground">{title}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{copy}</p></div>;
}

export default function DashboardPage() {
  return <Suspense fallback={<DashboardLoading />}><DashboardContent /></Suspense>;
}

function DashboardLoading() {
  return (
    <div className="space-y-6 pb-16" aria-label="Loading dashboard">
      <div className="space-y-3 py-2">
        <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full max-w-lg animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl border border-border/60 bg-white" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.55fr_0.85fr]">
        <div className="h-[350px] animate-pulse rounded-xl border border-border/60 bg-white" />
        <div className="h-[350px] animate-pulse rounded-xl border border-border/60 bg-white" />
      </div>
    </div>
  );
}

function DataLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 text-center">
      <div>
        <WarningCircle className="mx-auto h-6 w-6 text-[#b87624]" />
        <p className="mt-3 text-sm font-medium text-foreground">{message}</p>
        <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
        <button type="button" onClick={onRetry} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-muted">
          <ArrowClockwise className="h-3.5 w-3.5" /> Try again
        </button>
      </div>
    </div>
  );
}
