"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    MagnifyingGlass,
    DotsThree,
    PencilSimple,
    Trash,
    SquaresFour,
    ListDashes,
    CheckCircle,
    Briefcase,
    CalendarBlank,
    Clock,
    X,
    CaretDown,
    Check,
    Copy,
    Lightning,
    User as UserIcon,
    Bug,
    CheckSquare,
    BookmarkSimple,
    ClockCounterClockwise,
} from "@phosphor-icons/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { deleteTaskAction, updateTaskStatusAction } from "@/lib/actions";
import type { Task, Project, TaskStatus, TaskActivity } from "@/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { TaskFormModal } from "./task-form-modal";
import { MasterDataModal } from "@/components/settings/master-data-modal";
import {
    getIssueTypeConfig,
    getPriorityConfig,
    getMasterPriorities,
    MasterPriorityItem,
} from "@/lib/master-data";

const PRIORITY_BADGES: Record<string, string> = {
    Low: "bg-slate-50 text-slate-600 border-slate-200/80 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800",
    Medium: "bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40",
    High: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
    Urgent: "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40",
};

const STATUS_BADGES: Record<string, string> = {
    "To Do": "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
    "In Progress": "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    "Review": "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    "Done": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
};

export function TasksClient({
    tasks: initialTasks,
    projects = [],
    activeProjectId,
    activeProjectTitle,
}: {
    tasks: Task[];
    projects?: Project[];
    activeProjectId?: string;
    activeProjectTitle?: string;
}) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [focusUrgentOnly, setFocusUrgentOnly] = useState(false);
    const [filterAssignedToMe, setFilterAssignedToMe] = useState(false);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskActivities, setTaskActivities] = useState<TaskActivity[]>([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [masterPriorities, setMasterPriorities] = useState<MasterPriorityItem[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string>("");

    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((res) => {
                if (res.data?.userId || res.data?.id) {
                    setCurrentUserId(res.data.userId || res.data.id);
                }
            })
            .catch(() => {});

        setMasterPriorities(getMasterPriorities());
        const handleUpdate = () => setMasterPriorities(getMasterPriorities());
        window.addEventListener("numpux_master_data_updated", handleUpdate);
        return () => window.removeEventListener("numpux_master_data_updated", handleUpdate);
    }, []);

    // Load activities when selectedTask is opened
    useEffect(() => {
        if (!selectedTask) {
            setTaskActivities([]);
            return;
        }
        setIsLoadingActivities(true);
        fetch(`/api/tasks/${selectedTask.id}/activities`)
            .then((r) => r.json())
            .then((res) => {
                if (res.data) setTaskActivities(res.data);
            })
            .catch(() => setTaskActivities([]))
            .finally(() => setIsLoadingActivities(false));
    }, [selectedTask]);

    const filteredTasks = tasks.filter((task) => {
        const matchesSearch =
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.assignee && task.assignee.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === "All" || task.status === statusFilter;
        const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
        const matchesUrgentFocus =
            !focusUrgentOnly ||
            ((task.priority === "Urgent" || task.priority === "High") && task.status !== "Done");
        const matchesAssignee =
            !filterAssignedToMe ||
            (currentUserId ? task.assigneeId === currentUserId : !!task.assigneeId);
        return matchesSearch && matchesStatus && matchesPriority && matchesUrgentFocus && matchesAssignee;
    });

    const handleTaskSaved = (savedTask: Task, isEdit: boolean) => {
        if (isEdit) {
            setTasks((prev) => prev.map((t) => (t.id === savedTask.id ? savedTask : t)));
            if (selectedTask?.id === savedTask.id) {
                setSelectedTask(savedTask);
            }
        } else {
            setTasks((prev) => [savedTask, ...prev]);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        const idToDelete = deleteId;
        setDeleteId(null);
        if (selectedTask?.id === idToDelete) {
            setSelectedTask(null);
        }
        setTasks((prev) => prev.filter((t) => t.id !== idToDelete));
        await deleteTaskAction(idToDelete);
    };

    const handleQuickStatusChange = async (taskId: string, newStatus: TaskStatus) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
        if (selectedTask?.id === taskId) {
            setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        toast.success(`Task moved to ${newStatus}`);
        await updateTaskStatusAction(taskId, newStatus);
    };

    const handleToggleDone = async (task: Task) => {
        const newStatus: TaskStatus = task.status === "Done" ? "To Do" : "Done";
        setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
        );
        if (selectedTask?.id === task.id) {
            setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        toast.success(newStatus === "Done" ? "Task marked as completed! 🎉" : "Task marked as To Do");
        await updateTaskStatusAction(task.id, newStatus);
    };

    const handleDuplicateTask = async (task: Task) => {
        try {
            const { apiFetch } = await import("@/lib/api-client");
            const res = await apiFetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `${task.title} (Copy)`,
                    projectId: task.projectId,
                    project: task.project,
                    priority: task.priority,
                    status: task.status,
                    description: task.description || "",
                }),
            });
            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    setTasks((prev) => [json.data, ...prev]);
                    toast.success("Task duplicated successfully! 📋");
                }
            } else {
                toast.error("Failed to duplicate task");
            }
        } catch {
            toast.error("Failed to duplicate task");
        }
    };

    const router = useRouter();

    const handleSelectProject = (newId: string) => {
        if (newId) {
            router.push(`/tasks?projectId=${newId}`);
        } else {
            router.push(`/tasks`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl font-bold tracking-tight text-foreground">Backlog</h2>

                        <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                        {activeProjectTitle
                            ? `${activeProjectTitle} backlog issues`
                            : "Prioritize, refine, and plan sprint deliverables."}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    {/* View Switcher */}
                    <div className="bg-muted/70 p-1 rounded-xl flex border border-border">
                        <button
                            title="List View"
                            className="p-1.5 bg-card text-foreground font-semibold rounded-lg shadow-2xs border border-border/60"
                        >
                            <ListDashes size={15} />
                        </button>
                        <Link href={activeProjectId ? `/tasks/kanban?projectId=${activeProjectId}` : "/tasks/kanban"}>
                            <button
                                title="Kanban Board"
                                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg cursor-pointer hover:bg-background/60"
                            >
                                <SquaresFour size={15} />
                            </button>
                        </Link>
                    </div>

                    {/* New Task Trigger Button (Modal) */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 active:scale-98 transition-all shadow-xs cursor-pointer"
                    >
                        <Plus size={14} className="stroke-[2.5]" />
                        <span>New Task</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 p-2.5 rounded-2xl border border-border/60">
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} />
                    <input
                        type="text"
                        placeholder="Search tasks or keywords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-1.5 text-xs bg-card border border-border rounded-xl focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {/* Jira-style Quick Filter: Urgent Only */}
                    <button
                        type="button"
                        onClick={() => setFocusUrgentOnly((prev) => !prev)}
                        className={cn(
                            "px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                            focusUrgentOnly
                                ? "bg-rose-500 text-white border-rose-600 shadow-xs ring-2 ring-rose-500/20"
                                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/50"
                        )}
                        title="Show only Urgent & High priority tasks needing attention"
                    >
                        <Lightning size={12} weight={focusUrgentOnly ? "fill" : "regular"} className={focusUrgentOnly ? "text-white" : "text-amber-500"} />
                        <span>Urgent Focus</span>
                    </button>

                    {/* Jira-style Quick Filter: Assigned to Me */}
                    <button
                        type="button"
                        onClick={() => setFilterAssignedToMe((prev) => !prev)}
                        className={cn(
                            "px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                            filterAssignedToMe
                                ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20"
                                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/50"
                        )}
                        title="Show tasks assigned to a member"
                    >
                        <UserIcon size={12} weight={filterAssignedToMe ? "bold" : "regular"} />
                        <span>Assigned Tasks</span>
                    </button>

                    <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">Status:</span>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-8 w-[130px] text-xs rounded-xl bg-card border-border/80">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                                {[
                                    { key: "All", label: "All Status" },
                                    { key: "To Do", label: "To Do" },
                                    { key: "In Progress", label: "In Progress" },
                                    { key: "Review", label: "In Review" },
                                    { key: "Done", label: "Done" },
                                ].map((s) => (
                                    <SelectItem key={s.key} value={s.key} className="text-xs cursor-pointer">
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Task List Cards */}
            <div className="space-y-2">
                {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="bg-card border border-border/80 hover:border-primary/40 hover:bg-card/90 px-4 py-3 rounded-xl flex items-center justify-between group transition-all cursor-pointer shadow-2xs"
                        >
                            <div className="flex items-center gap-3.5 min-w-0">
                                <button
                                    type="button"
                                    title={task.status === "Done" ? "Mark as To Do" : "Mark as Done"}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleDone(task);
                                    }}
                                    className="w-8 h-8 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted flex items-center justify-center shrink-0 transition-colors cursor-pointer group/chk"
                                >
                                    <CheckCircle
                                        size={17}
                                        weight={task.status === "Done" ? "fill" : "regular"}
                                        className={cn(
                                            "transition-transform active:scale-90",
                                            task.status === "Done"
                                                ? "text-emerald-500"
                                                : "text-muted-foreground/50 group-hover/chk:text-primary"
                                        )}
                                    />
                                </button>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {/* Jira-style Issue Type & Key */}
                                        {(() => {
                                            const issueTypeConf = getIssueTypeConfig(task.issueType);
                                            const TypeIcon = issueTypeConf.icon;
                                            return (
                                                <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-muted-foreground/90 bg-muted/60 px-1.5 py-0.5 rounded border border-border/60">
                                                    <TypeIcon size={11} className={cn("shrink-0", issueTypeConf.colorClass.split(" ")[0])} weight="bold" />
                                                    <span>{task.key || `T-${task.id.slice(0, 4)}`}</span>
                                                </div>
                                            );
                                        })()}

                                        <h3 className={cn(
                                            "text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors",
                                            task.status === "Done" && "line-through text-muted-foreground/70"
                                        )}>
                                            {task.title}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                        <span className="text-muted-foreground font-medium flex items-center gap-1">
                                            <Briefcase size={11} className="opacity-70" />
                                            {task.project}
                                        </span>
                                        {task.date && (
                                            <>
                                                <span className="text-muted-foreground/30">•</span>
                                                <span className="text-muted-foreground font-medium flex items-center gap-1">
                                                    <Clock size={11} className="opacity-70" />
                                                    {task.date}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0 pl-3" onClick={(e) => e.stopPropagation()}>
                                {/* Assignee Pill / Avatar */}
                                {task.assignee ? (
                                    <div
                                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border/60 text-[11px] text-foreground font-medium"
                                        title={`Assigned to ${task.assignee.name} (${task.assignee.email})`}
                                    >
                                        <div className="w-4 h-4 rounded-full bg-primary/10 text-primary font-bold text-[9px] flex items-center justify-center shrink-0">
                                            {task.assignee.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="hidden md:inline max-w-[80px] truncate">{task.assignee.name}</span>
                                    </div>
                                ) : (
                                    <div
                                        className="hidden lg:flex items-center gap-1 text-[10px] text-muted-foreground/60 px-1.5 py-0.5"
                                        title="Unassigned"
                                    >
                                        <UserIcon size={11} />
                                        <span>Unassigned</span>
                                    </div>
                                )}

                                {(() => {
                                    const pConf = getPriorityConfig(task.priority);
                                    return (
                                        <span
                                            className={cn(
                                                "text-[10px] font-semibold px-2 py-0.5 rounded-md border hidden sm:inline-flex items-center gap-1",
                                                pConf.badgeClass
                                            )}
                                        >
                                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", pConf.dotClass)} />
                                            <span>{pConf.label}</span>
                                        </span>
                                    );
                                })()}

                                {/* Jira-style Interactive Status Transition Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            title="Change Status"
                                            className={cn(
                                                "text-[11px] font-medium px-2 py-0.5 rounded-lg border border-border/40 hover:opacity-85 transition-opacity flex items-center gap-1 cursor-pointer",
                                                STATUS_BADGES[task.status] || STATUS_BADGES["To Do"]
                                            )}
                                        >
                                            <span>{task.status}</span>
                                            <CaretDown size={10} className="opacity-60" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-36 p-1 text-xs">
                                        {(["To Do", "In Progress", "Review", "Done"] as TaskStatus[]).map((st) => (
                                            <DropdownMenuItem
                                                key={st}
                                                onClick={() => handleQuickStatusChange(task.id, st)}
                                                className={cn(
                                                    "cursor-pointer flex items-center justify-between py-1.5",
                                                    task.status === st && "font-semibold bg-primary/10 text-primary"
                                                )}
                                            >
                                                <span>{st}</span>
                                                {task.status === st && <Check size={12} className="text-primary" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-70 group-hover:opacity-100 cursor-pointer">
                                            <DotsThree size={18} weight="bold" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-36 p-1 text-xs">
                                        <DropdownMenuItem
                                            onClick={() => setSelectedTask(task)}
                                            className="cursor-pointer flex items-center gap-2"
                                        >
                                            <CheckCircle size={13} /> View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setEditingTask(task)}
                                            className="cursor-pointer flex items-center gap-2"
                                        >
                                            <PencilSimple size={13} /> Edit Task
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleDuplicateTask(task)}
                                            className="cursor-pointer flex items-center gap-2"
                                        >
                                            <Copy size={13} /> Clone Task
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => setDeleteId(task.id)}
                                            className="text-rose-600 focus:text-rose-600 cursor-pointer flex items-center gap-2"
                                        >
                                            <Trash size={13} /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-14 text-center bg-card/40 border border-dashed border-border rounded-2xl">
                        <CheckCircle className="mx-auto text-muted-foreground/30 mb-2" size={28} />
                        <h4 className="text-xs font-semibold text-foreground">No tasks found</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Try refining your filter or create a new task.</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg cursor-pointer"
                        >
                            <Plus size={13} />
                            Add Task
                        </button>
                    </div>
                )}
            </div>

            {/* Task Create Modal */}
            <TaskFormModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                defaultProjectId={activeProjectId}
                onSuccess={handleTaskSaved}
            />

            {/* Task Edit Modal */}
            <TaskFormModal
                open={!!editingTask}
                onOpenChange={(open) => !open && setEditingTask(null)}
                task={editingTask}
                defaultProjectId={activeProjectId}
                onSuccess={handleTaskSaved}
            />

            {/* Task Detail Sheet (Jira-style slide-over panel) */}
            <Sheet open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                <SheetContent side="right" className="sm:max-w-xl w-full p-0 flex flex-col h-full bg-card border-l border-border shadow-2xl">
                    {selectedTask && (
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-border/60">
                                <SheetHeader className="p-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {/* Issue Type & Key */}
                                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-foreground bg-muted px-2.5 py-1 rounded-lg border border-border/60">
                                            {selectedTask.issueType === "Bug" ? (
                                                <Bug size={14} className="text-rose-500" weight="fill" />
                                            ) : selectedTask.issueType === "Story" ? (
                                                <BookmarkSimple size={14} className="text-emerald-500" weight="fill" />
                                            ) : (
                                                <CheckSquare size={14} className="text-blue-500" weight="bold" />
                                            )}
                                            <span>{selectedTask.key || `T-${selectedTask.id.slice(0, 4)}`}</span>
                                        </div>

                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border",
                                                PRIORITY_BADGES[selectedTask.priority] || PRIORITY_BADGES.Low
                                            )}
                                        >
                                            {selectedTask.priority}
                                        </span>
                                        <span className={cn("text-xs px-2.5 py-1 rounded-lg font-medium", STATUS_BADGES[selectedTask.status] || "bg-muted text-muted-foreground")}>
                                            {selectedTask.status}
                                        </span>
                                    </div>
                                    <SheetTitle className="text-lg font-bold text-foreground leading-snug">
                                        {selectedTask.title}
                                    </SheetTitle>
                                    <SheetDescription className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                                        {selectedTask.description || "No additional description or acceptance criteria provided."}
                                    </SheetDescription>
                                </SheetHeader>
                            </div>

                            {/* Details Body */}
                            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                                <div className="grid grid-cols-3 gap-3 p-4 bg-muted/30 rounded-xl border border-border/60 text-xs">
                                    <div>
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Project</span>
                                        <span className="font-semibold text-foreground mt-1 block truncate">{selectedTask.project}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Assignee</span>
                                        <span className="font-semibold text-foreground mt-1 block truncate">
                                            {selectedTask.assignee ? selectedTask.assignee.name : "Unassigned"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Due Date</span>
                                        <span className="font-semibold text-foreground mt-1 block">{selectedTask.date || "No due date"}</span>
                                    </div>
                                </div>

                                {/* Jira-style Activity & History Timeline */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <ClockCounterClockwise size={14} />
                                        <span>Activity History ({taskActivities.length})</span>
                                    </div>

                                    {isLoadingActivities ? (
                                        <div className="space-y-2.5">
                                            <Skeleton className="h-14 w-full rounded-xl" />
                                            <Skeleton className="h-14 w-full rounded-xl" />
                                            <Skeleton className="h-14 w-full rounded-xl" />
                                        </div>
                                    ) : taskActivities.length === 0 ? (
                                        <p className="text-xs text-muted-foreground py-6 text-center bg-muted/20 border border-dashed border-border rounded-xl">
                                            No logged activities recorded yet.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {taskActivities.map((act) => (
                                                <div key={act.id} className="text-xs flex items-start gap-2.5 bg-muted/30 p-3 rounded-xl border border-border/50">
                                                    <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-foreground font-medium">
                                                            {act.details || act.action}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                                                            <span className="font-semibold">{act.userName || "System"}</span>
                                                            <span>•</span>
                                                            <span>{new Date(act.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-between">
                                <button
                                    onClick={() => {
                                        const id = selectedTask.id;
                                        setSelectedTask(null);
                                        setDeleteId(id);
                                    }}
                                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                >
                                    <Trash size={14} />
                                    Delete Task
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedTask(null)}
                                        className="px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-xl cursor-pointer hover:bg-muted transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => {
                                            const t = selectedTask;
                                            setSelectedTask(null);
                                            setEditingTask(t);
                                        }}
                                        className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                                    >
                                        <PencilSimple size={14} />
                                        Edit Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="rounded-2xl border border-border p-6 font-sans shadow-xl bg-card max-w-sm">
                    <DialogHeader className="space-y-2">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <Trash size={18} />
                        </div>
                        <DialogTitle className="text-base font-semibold text-foreground tracking-tight">Delete Task?</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            This task will be permanently removed from your project workspace. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 rounded-xl text-xs h-9 cursor-pointer"
                            onClick={() => setDeleteId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1 rounded-xl text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white font-medium cursor-pointer"
                            onClick={handleDeleteConfirm}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Master Data Management Modal */}
            <MasterDataModal
                open={isMasterDataOpen}
                onOpenChange={setIsMasterDataOpen}
                initialTab="priorities"
            />
        </div>
    );
}