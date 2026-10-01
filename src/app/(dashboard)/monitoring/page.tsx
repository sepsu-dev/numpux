"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowClockwise,
  CheckCircle,
  CheckSquare,
  FolderSimple,
  MagnifyingGlass,
  UserPlus,
  UsersThree,
  WifiHigh,
  X,
} from "@phosphor-icons/react";
import { apiFetch } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

type MonitoringUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  accountOrigin: string;
  createdAt: string;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  isOnline: boolean;
  projectCount: number;
  taskCount: number;
};

type MonitoringData = {
  summary: {
    totalUsers: number;
    selfRegisteredUsers: number;
    invitedUsers: number;
    onlineUsers: number;
    newUsers: number;
    totalWorkspaces: number;
    pendingInvitations: number;
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
  };
  users: MonitoringUser[];
  taskStatuses: Array<{ name: string; count: number; dotColor: string }>;
  roles: Array<{ name: string; count: number }>;
  generatedAt: string;
};

const numberFormatter = new Intl.NumberFormat("en-US");

function relativeTime(value: string | null) {
  if (!value) return "Never";
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loadMonitoring = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/monitoring", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Failed to load monitoring data");
      setData(body.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load monitoring data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMonitoring();
    const interval = window.setInterval(() => void loadMonitoring(true), 30_000);
    return () => window.clearInterval(interval);
  }, [loadMonitoring]);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return data?.users || [];
    return (data?.users || []).filter((user) =>
      `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(search)
    );
  }, [data?.users, query]);

  const completionRate = data?.summary.totalTasks
    ? Math.round((data.summary.completedTasks / data.summary.totalTasks) * 100)
    : 0;

  const cards = data ? [
    { label: "Registered users", value: data.summary.totalUsers, note: "All active accounts", icon: UsersThree, tone: "text-primary bg-primary/10" },
    { label: "Self-registered", value: data.summary.selfRegisteredUsers, note: "Workspace administrators", icon: UserPlus, tone: "text-sky-600 bg-sky-500/10" },
    { label: "Invited users", value: data.summary.invitedUsers, note: "Transactional members", icon: UsersThree, tone: "text-indigo-600 bg-indigo-500/10" },
    { label: "Users online", value: data.summary.onlineUsers, note: "Active within 2 minutes", icon: WifiHigh, tone: "text-emerald-600 bg-emerald-500/10" },
    { label: "New users", value: data.summary.newUsers, note: "Last 7 days", icon: UserPlus, tone: "text-blue-600 bg-blue-500/10" },
    { label: "Workspaces", value: data.summary.totalWorkspaces, note: "Active tenant boundaries", icon: FolderSimple, tone: "text-cyan-600 bg-cyan-500/10" },
    { label: "Pending invitations", value: data.summary.pendingInvitations, note: "Awaiting acceptance", icon: UserPlus, tone: "text-orange-600 bg-orange-500/10" },
    { label: "Total projects", value: data.summary.totalProjects, note: "Across the workspace", icon: FolderSimple, tone: "text-amber-600 bg-amber-500/10" },
    { label: "Total tasks", value: data.summary.totalTasks, note: "Across all projects", icon: CheckSquare, tone: "text-violet-600 bg-violet-500/10" },
    { label: "Completed tasks", value: data.summary.completedTasks, note: `${completionRate}% completion rate`, icon: CheckCircle, tone: "text-teal-600 bg-teal-500/10" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight">Monitoring</h2>
            {data && <span className="rounded-md bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground">Live</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Track workspace usage and user activity from the database.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadMonitoring()}
          disabled={isLoading}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <ArrowClockwise size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading && !data
          ? Array.from({ length: 10 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)
          : cards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-xl border border-border/70 bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div><p className="text-xs font-medium text-muted-foreground">{card.label}</p><p className="mt-2 text-2xl font-bold tracking-tight">{numberFormatter.format(card.value)}</p></div>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.tone}`}><Icon size={18} weight="bold" /></span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">{card.note}</p>
                </div>
              );
            })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-border/70 bg-card p-5">
          <div className="mb-5 flex items-center justify-between"><div><h3 className="text-sm font-bold">Task distribution</h3><p className="mt-0.5 text-[11px] text-muted-foreground">Grouped by current workflow status</p></div><span className="text-xs font-semibold text-muted-foreground">{data?.summary.totalTasks || 0} tasks</span></div>
          <div className="space-y-4">
            {(data?.taskStatuses || []).map((status) => {
              const percent = data?.summary.totalTasks ? Math.round((status.count / data.summary.totalTasks) * 100) : 0;
              return <div key={status.name}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="flex items-center gap-2 font-medium"><span className={`h-2 w-2 rounded-full ${status.dotColor}`} />{status.name}</span><span className="text-muted-foreground">{status.count} · {percent}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></div></div>;
            })}
            {!isLoading && !data?.taskStatuses.length && <p className="py-8 text-center text-xs text-muted-foreground">No tasks yet.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-5">
          <div className="mb-5"><h3 className="text-sm font-bold">Role distribution</h3><p className="mt-0.5 text-[11px] text-muted-foreground">Number of accounts assigned to each role</p></div>
          <div className="space-y-3">
            {(data?.roles || []).map((role) => {
              const percent = data?.summary.totalUsers ? Math.round((role.count / data.summary.totalUsers) * 100) : 0;
              return <div key={role.name} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"><div><p className="text-xs font-semibold capitalize">{role.name}</p><p className="text-[10px] text-muted-foreground">{percent}% of all users</p></div><span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{role.count}</span></div>;
            })}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-sm font-bold">User activity</h3><p className="mt-0.5 text-[11px] text-muted-foreground">Online status, last login, and project and task totals per user</p></div>
          <div className="relative w-full sm:w-64"><MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />{query && <button type="button" onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><X size={13} /></button>}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead><tr className="border-b border-border/60 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"><th className="px-5 py-3">User</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Origin</th><th className="px-5 py-3 text-center">Projects</th><th className="px-5 py-3 text-center">Tasks</th><th className="px-5 py-3">Last login</th><th className="px-5 py-3">Registered</th></tr></thead>
            <tbody className="divide-y divide-border/50">
              {isLoading && !data ? Array.from({ length: 5 }).map((_, index) => <tr key={index}><td className="px-5 py-4"><Skeleton className="h-8 w-44" /></td><td colSpan={7} className="px-5"><Skeleton className="h-5 w-full" /></td></tr>) : filteredUsers.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{user.name.slice(0, 1).toUpperCase()}</span><div><p className="font-semibold">{user.name}</p><p className="text-[11px] text-muted-foreground">{user.email}</p></div></div></td>
                  <td className="px-5 py-3.5"><span className={user.isOnline ? "inline-flex items-center gap-1.5 font-semibold text-emerald-600" : "inline-flex items-center gap-1.5 text-muted-foreground"}><span className={`h-2 w-2 rounded-full ${user.isOnline ? "bg-emerald-500" : "bg-slate-300"}`} />{user.isOnline ? "Online" : relativeTime(user.lastSeenAt)}</span></td>
                  <td className="px-5 py-3.5"><span className="rounded-md border border-border/60 bg-muted/40 px-2 py-1 font-medium capitalize">{user.role}</span></td>
                  <td className="px-5 py-3.5 text-muted-foreground">{user.accountOrigin === "self_registered" ? "Self-registered" : user.accountOrigin === "invited" ? "Invited" : "System owner"}</td>
                  <td className="px-5 py-3.5 text-center font-semibold">{user.projectCount}</td>
                  <td className="px-5 py-3.5 text-center font-semibold">{user.taskCount}</td>
                  <td className="px-5 py-3.5 text-muted-foreground" title={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("en-US") : undefined}>{relativeTime(user.lastLoginAt)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(user.createdAt))}</td>
                </tr>
              ))}
              {!isLoading && filteredUsers.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
        {data && <div className="border-t border-border/60 bg-muted/20 px-5 py-2.5 text-right text-[10px] text-muted-foreground">Updated {relativeTime(data.generatedAt)} · refreshes automatically every 30 seconds</div>}
      </div>
    </div>
  );
}
