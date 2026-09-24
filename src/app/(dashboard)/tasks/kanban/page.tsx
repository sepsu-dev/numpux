"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Plus,
    DotsThree,
    SquaresFour,
    ListDashes,
    Clock,
    Briefcase,
    MagnifyingGlass,
    CheckCircle,
    CircleDashed,
    HourglassMedium,
    WarningCircle,
    PencilSimple,
    Trash,
    X,
    Check,
    CaretDown,
    Copy,
    Lightning,
    User as UserIcon,
    Bug,
    CheckSquare,
    BookmarkSimple,
    ClockCounterClockwise,
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { MasterDataModal } from "@/components/settings/master-data-modal";
import {
    getIssueTypeConfig,
    getPriorityConfig,
    getMasterPriorities,
    MasterPriorityItem,
} from "@/lib/master-data";
import type { Task, TaskStatus, Priority, TaskActivity } from "@/types";
import { apiFetch } from "@/lib/api-client";

interface ColumnConfig {
    id: TaskStatus;
    title: string;
    description: string;
    dotColor: string;
    badgeStyle: string;
    headerBorder: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
}

const STATUS_COLUMNS: ColumnConfig[] = [
    {
        id: "To Do",
        title: "To Do",
        description: "Backlog & scheduled deliverables",
        dotColor: "bg-slate-400",
        badgeStyle: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        headerBorder: "border-slate-200/80 dark:border-slate-800",
        icon: CircleDashed,
    },
    {
        id: "In Progress",
        title: "In Progress",
        description: "Currently under active development",
        dotColor: "bg-blue-500",
        badgeStyle: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
        headerBorder: "border-blue-200/80 dark:border-blue-800",
        icon: HourglassMedium,
    },
    {
        id: "Review",
        title: "In Review",
        description: "Awaiting QA, code review, or approval",
        dotColor: "bg-amber-500",
        badgeStyle: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
        headerBorder: "border-amber-200/80 dark:border-amber-800",
        icon: WarningCircle,
    },
    {
        id: "Done",
        title: "Done",
        description: "Verified and shipped to production",
        dotColor: "bg-emerald-500",
        badgeStyle: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
        headerBorder: "border-emerald-200/80 dark:border-emerald-800",
        icon: CheckCircle,
    },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; badgeClass: string; dotClass: string }> = {
    Low: {
        label: "Low",
        badgeClass: "bg-muted/80 text-muted-foreground border-border/80",
        dotClass: "bg-muted-foreground/60",
    },
    Medium: {
        label: "Medium",
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40",
        dotClass: "bg-sky-500",
    },
    High: {
        label: "High",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
        dotClass: "bg-amber-500",
    },
    Urgent: {
        label: "Urgent",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40",
        dotClass: "bg-rose-500",
    },
};

export default function KanbanPage() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get("projectId") || "";

    const [tasks, setTasks] = useState<Task[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const [projectName, setProjectName] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPriority, setSelectedPriority] = useState<string>("All");
    const [focusUrgentOnly, setFocusUrgentOnly] = useState(false);
    const [filterAssignedToMe, setFilterAssignedToMe] = useState(false);

    // Quick add inline
    const [quickAddColumn, setQuickAddColumn] = useState<TaskStatus | null>(null);
    const [quickTitle, setQuickTitle] = useState("");
    const [isSavingQuick, setIsSavingQuick] = useState(false);

    const [availableProjects, setAvailableProjects] = useState<{ id: string; title: string }[]>([]);

    // Detail Preview Modal
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskActivities, setTaskActivities] = useState<TaskActivity[]>([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [masterPriorities, setMasterPriorities] = useState<MasterPriorityItem[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string>("");

    useEffect(() => {
        apiFetch("/api/auth/me")
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

    // Fetch activities whenever selectedTask changes
    useEffect(() => {
        if (!selectedTask) {
            setTaskActivities([]);
            return;
        }
        setIsLoadingActivities(true);
        apiFetch(`/api/tasks/${selectedTask.id}/activities`)
            .then((r) => r.json())
            .then((res) => {
                if (res.data) setTaskActivities(res.data);
            })
            .catch(() => setTaskActivities([]))
            .finally(() => setIsLoadingActivities(false));
    }, [selectedTask]);

    // Drag states
    const [activeDraggedTaskId, setActiveDraggedTaskId] = useState<string | null>(null);
    const [hoveredColumnId, setHoveredColumnId] = useState<TaskStatus | null>(null);
    const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

    const loadTasks = () => {
        apiFetch(`/api/projects`)
            .then((res) => res.json())
            .then((res) => {
                if (res.data) {
                    setAvailableProjects(res.data);
                    const effectiveProjId = projectId || (res.data.length === 1 ? res.data[0].id : "");
                    if (effectiveProjId) {
                        const found = res.data.find((p: any) => p.id === effectiveProjId);
                        if (found) setProjectName(found.title);
                    } else if (res.data.length > 0) {
                        setProjectName("All Projects");
                    }

                    // Fetch tasks with effective project id
                    const url = effectiveProjId ? `/api/tasks?projectId=${effectiveProjId}` : "/api/tasks";
                    apiFetch(url)
                        .then((tRes) => tRes.json())
                        .then((tRes) => {
                            if (tRes.data) setTasks(tRes.data);
                        })
                        .catch(() => {});
                }
            })
            .catch(() => {
                const url = projectId ? `/api/tasks?projectId=${projectId}` : "/api/tasks";
                apiFetch(url)
                    .then((res) => res.json())
                    .then((res) => {
                        if (res.data) setTasks(res.data);
                    })
                    .catch(() => {});
            });
    };

    useEffect(() => {
        setIsMounted(true);
        loadTasks();
    }, [projectId]);

    const updateTaskStatusBackend = async (taskId: string, targetStatus: TaskStatus) => {
        try {
            await apiFetch(`/api/tasks/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: targetStatus }),
            });
        } catch {
            // silent fallback
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        if (selectedTask?.id === taskId) setSelectedTask(null);
        toast.success("Task deleted successfully");
        try {
            await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
        } catch {
            loadTasks();
        }
    };

    const handleDuplicateTask = async (task: Task) => {
        try {
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

    const handleCreateQuickTask = async (columnId: TaskStatus) => {
        if (!quickTitle.trim()) {
            setQuickAddColumn(null);
            return;
        }

        const targetProjectId = projectId || (availableProjects.length > 0 ? availableProjects[0].id : "");
        if (!targetProjectId) {
            toast.error("Please create a project first before adding tasks");
            setQuickAddColumn(null);
            return;
        }

        const effectiveProject = availableProjects.find((p) => p.id === targetProjectId);

        setIsSavingQuick(true);
        try {
            const res = await apiFetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: quickTitle.trim(),
                    projectId: targetProjectId,
                    project: effectiveProject ? effectiveProject.title : "Project",
                    priority: "Medium",
                    status: columnId,
                }),
            });

            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    setTasks((prev) => [json.data, ...prev]);
                    toast.success("Task created! Keep typing or press Esc to finish.");
                    setQuickTitle("");
                }
            } else {
                const errJson = await res.json().catch(() => ({}));
                toast.error(errJson.message || "Failed to add task");
            }
        } catch {
            toast.error("Failed to add task");
        } finally {
            setIsSavingQuick(false);
        }
    };

    // Helper to find column from mouse/touch point
    const getColumnUnderPoint = (clientX: number, clientY: number): TaskStatus | null => {
        for (const col of STATUS_COLUMNS) {
            const el = columnRefs.current[col.id];
            if (el) {
                const rect = el.getBoundingClientRect();
                if (
                    clientX >= rect.left &&
                    clientX <= rect.right &&
                    clientY >= rect.top &&
                    clientY <= rect.bottom
                ) {
                    return col.id;
                }
            }
        }
        return null;
    };

    const handleDragStart = (taskId: string) => {
        setActiveDraggedTaskId(taskId);
        if (typeof document !== "undefined") {
            document.body.classList.add("is-dragging-card");
        }
    };

    const handleDrag = (_: any, info: { point: { x: number; y: number } }) => {
        const found = getColumnUnderPoint(info.point.x, info.point.y);
        setHoveredColumnId(found);
    };

    const handleDragEnd = (task: Task, _: any, info: { point: { x: number; y: number } }) => {
        if (typeof document !== "undefined") {
            document.body.classList.remove("is-dragging-card");
        }
        const targetColumn = getColumnUnderPoint(info.point.x, info.point.y);
        setActiveDraggedTaskId(null);
        setHoveredColumnId(null);

        if (targetColumn && targetColumn !== task.status) {
            setTasks((prev) =>
                prev.map((t) => (t.id === task.id ? { ...t, status: targetColumn } : t))
            );
            updateTaskStatusBackend(task.id, targetColumn);
        }
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const matchesSearch =
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.assignee && task.assignee.name.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesPriority =
                selectedPriority === "All" || task.priority === selectedPriority;
            const matchesUrgentFocus =
                !focusUrgentOnly ||
                ((task.priority === "Urgent" || task.priority === "High") && task.status !== "Done");
            const matchesAssignee =
                !filterAssignedToMe ||
                (currentUserId ? task.assigneeId === currentUserId : !!task.assigneeId);
            return matchesSearch && matchesPriority && matchesUrgentFocus && matchesAssignee;
        });
    }, [tasks, searchQuery, selectedPriority, focusUrgentOnly, filterAssignedToMe, currentUserId]);

    const router = useRouter();

    const handleSelectProject = (newId: string) => {
        if (newId) {
            router.push(`/tasks/kanban?projectId=${newId}`);
        } else {
            router.push(`/tasks/kanban`);
        }
    };

    if (!isMounted) return null;

    const listHref = projectId ? `/tasks?projectId=${projectId}` : "/tasks";

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-16">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl font-bold tracking-tight text-foreground">
                            Board
                        </h2>

                        <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                        {projectName
                            ? `${projectName} sprint board`
                            : "Track and manage tasks across workflow stages."}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    {/* View Switcher */}
                    <div className="bg-muted/70 p-1 rounded-xl flex border border-border">
                        <Link href={listHref}>
                            <button
                                title="List View"
                                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg cursor-pointer hover:bg-background/60"
                            >
                                <ListDashes size={15} />
                            </button>
                        </Link>
                        <button
                            title="Kanban View"
                            className="p-1.5 bg-card text-foreground font-semibold rounded-lg shadow-2xs border border-border/60"
                        >
                            <SquaresFour size={15} />
                        </button>
                    </div>

                    {/* New Task Button (Modal) */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 active:scale-98 transition-all shadow-xs cursor-pointer"
                    >
                        <Plus size={14} className="stroke-[2.5]" />
                        <span>New Task</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar: Search + Priority Chips */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 p-2.5 rounded-2xl border border-border/60">
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} />
                    <input
                        type="text"
                        placeholder="Search cards, keywords, or projects..."
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

                    {/* Jira-style Quick Filter: Assigned Tasks */}
                    <button
                        type="button"
                        onClick={() => setFilterAssignedToMe((prev) => !prev)}
                        className={cn(
                            "px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                            filterAssignedToMe
                                ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20"
                                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/50"
                        )}
                        title="Show tasks assigned to a team member"
                    >
                        <UserIcon size={12} weight={filterAssignedToMe ? "bold" : "regular"} />
                        <span>Assigned Tasks</span>
                    </button>

                    <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">Priority:</span>
                        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                            <SelectTrigger className="h-8 w-[140px] text-xs rounded-xl bg-card border-border/80">
                                <SelectValue placeholder="All Priorities" />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                                <SelectItem value="All" className="text-xs cursor-pointer">
                                    All Priorities
                                </SelectItem>
                                {masterPriorities.map((p) => (
                                    <SelectItem key={p.id} value={p.name} className="text-xs cursor-pointer">
                                        <div className="flex items-center gap-1.5">
                                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", p.dotColor)} />
                                            <span>{p.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Kanban Columns Grid powered by Framer Motion */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                {STATUS_COLUMNS.map((column) => {
                    const colTasks = filteredTasks.filter((t) => t.status === column.id);
                    const ColumnIcon = column.icon;
                    const isAddingHere = quickAddColumn === column.id;
                    const isHovered = hoveredColumnId === column.id;
                    const containsDraggedTask = activeDraggedTaskId && colTasks.some((t) => t.id === activeDraggedTaskId);

                    return (
                        <div
                            key={column.id}
                            ref={(el) => {
                                columnRefs.current[column.id] = el;
                            }}
                            className={cn(
                                "bg-card/70 border rounded-2xl p-3.5 flex flex-col min-h-[520px] transition-all duration-200 relative",
                                containsDraggedTask ? "z-40" : isHovered ? "z-30" : "z-10",
                                isHovered
                                    ? "border-primary/80 ring-2 ring-primary/20 bg-primary/[0.04]"
                                    : "border-border/80 shadow-2xs hover:border-border"
                            )}
                        >
                            {/* Column Header */}
                            <div className={cn("flex items-center justify-between mb-3 px-1 pb-2.5 border-b", column.headerBorder)}>
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", column.dotColor)} />
                                    <h3 className="font-semibold text-xs tracking-tight text-foreground">
                                        {column.title}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border border-border/40", column.badgeStyle)}>
                                        {colTasks.length}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setQuickAddColumn(isAddingHere ? null : column.id);
                                            setQuickTitle("");
                                        }}
                                        title={`Add to ${column.title}`}
                                        className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    >
                                        <Plus size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Cards Area with Motion */}
                            <div className="space-y-2.5 flex-1 p-0.5 rounded-xl min-h-[220px]">
                                {/* Inline Quick Add Input */}
                                {isAddingHere && (
                                    <div className="bg-card border border-primary/50 p-3 rounded-xl shadow-sm space-y-2 animate-in fade-in duration-200">
                                        <input
                                            type="text"
                                            placeholder="Enter task title..."
                                            value={quickTitle}
                                            onChange={(e) => setQuickTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleCreateQuickTask(column.id);
                                                if (e.key === "Escape") setQuickAddColumn(null);
                                            }}
                                            autoFocus
                                            className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-muted-foreground/60 font-medium"
                                        />
                                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/40">
                                            <button
                                                onClick={() => setQuickAddColumn(null)}
                                                className="px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground rounded cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleCreateQuickTask(column.id)}
                                                disabled={isSavingQuick || !quickTitle.trim()}
                                                className="px-2.5 py-1 text-[10px] font-semibold bg-primary text-primary-foreground rounded-md disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Check size={11} />
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <AnimatePresence mode="popLayout" initial={false}>
                                    {colTasks.length === 0 && !isAddingHere && (
                                        <motion.div
                                            key={`empty-${column.id}`}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="h-28 border border-dashed border-border/70 rounded-xl flex flex-col items-center justify-center text-center p-3 select-none pointer-events-none"
                                        >
                                            <ColumnIcon className="text-muted-foreground/30 mb-1" size={18} />
                                            <span className="text-[11px] text-muted-foreground/70">
                                                No tasks in this lane
                                            </span>
                                        </motion.div>
                                    )}
                                    {colTasks.map((task) => {
                                        const priorityConf = getPriorityConfig(task.priority);
                                        const issueTypeConf = getIssueTypeConfig(task.issueType);
                                        const TypeIcon = issueTypeConf.icon;
                                        const isDragging = activeDraggedTaskId === task.id;

                                        return (
                                            <motion.div
                                                key={task.id}
                                                layout
                                                layoutId={task.id}
                                                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.92,
                                                    y: -8,
                                                    transition: {
                                                        duration: 0.22,
                                                        ease: [0.4, 0, 0.2, 1],
                                                    },
                                                }}
                                                drag
                                                dragSnapToOrigin
                                                dragElastic={0.15}
                                                whileDrag={{
                                                    scale: 1.04,
                                                    rotate: 1.5,
                                                    zIndex: 50,
                                                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
                                                }}
                                                onDragStart={() => handleDragStart(task.id)}
                                                onDrag={handleDrag}
                                                onDragEnd={(e, info) => handleDragEnd(task, e, info)}
                                                transition={{
                                                    layout: { type: "spring", stiffness: 380, damping: 30 },
                                                    opacity: { duration: 0.28, ease: "easeOut" },
                                                    scale: { duration: 0.25, ease: "easeOut" },
                                                    y: { duration: 0.25, ease: "easeOut" },
                                                }}
                                                onClick={() => {
                                                    if (!isDragging) setSelectedTask(task);
                                                }}
                                                className={cn(
                                                    "bg-card border border-border/80 p-3.5 rounded-xl group kanban-card-draggable cursor-grab active:cursor-grabbing select-none relative touch-none",
                                                    isDragging
                                                        ? "!z-[100] !cursor-grabbing border-primary/80 ring-2 ring-primary/40 bg-card shadow-2xl"
                                                        : "z-10 shadow-2xs hover:shadow-xs hover:border-foreground/20 hover:bg-card/95 transition-colors"
                                                )}
                                            >
                                                {/* Card Top: Issue Type + Key & Priority Badge & Actions */}
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {/* Issue Type Icon + Key */}
                                                        <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-muted-foreground/90 bg-muted/60 px-1.5 py-0.5 rounded border border-border/60">
                                                            <TypeIcon size={11} className={cn("shrink-0", issueTypeConf.colorClass.split(" ")[0])} weight="bold" />
                                                            <span>{task.key || `T-${task.id.slice(0, 4)}`}</span>
                                                        </div>

                                                        {/* Priority */}
                                                        <div
                                                            className={cn(
                                                                "inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold rounded border",
                                                                priorityConf.badgeClass
                                                            )}
                                                        >
                                                            <span className={cn("w-1.5 h-1.5 rounded-full", priorityConf.dotClass)} />
                                                            {priorityConf.label}
                                                        </div>
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                            >
                                                                <DotsThree size={16} weight="bold" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-36 p-1 text-xs">
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingTask(task);
                                                                }}
                                                                className="cursor-pointer flex items-center gap-2"
                                                            >
                                                                <PencilSimple size={12} />
                                                                Edit Task
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDuplicateTask(task);
                                                                }}
                                                                className="cursor-pointer flex items-center gap-2"
                                                            >
                                                                <Copy size={12} />
                                                                Clone Task
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteTask(task.id);
                                                                }}
                                                                className="text-rose-600 focus:text-rose-600 cursor-pointer flex items-center gap-2"
                                                            >
                                                                <Trash size={12} />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* Task Title */}
                                                <h4 className="text-xs font-semibold text-foreground mb-3 leading-snug line-clamp-2">
                                                    {task.title}
                                                </h4>

                                                {/* Card Footer info */}
                                                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                                                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                                        <Briefcase size={11} className="shrink-0 text-muted-foreground/70" />
                                                        <span className="truncate font-medium text-[10px]">
                                                            {task.project}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {task.date && (
                                                            <div className="flex items-center gap-1 font-medium text-[10px]">
                                                                <Clock size={10} className="text-muted-foreground/70" />
                                                                <span>{task.date}</span>
                                                            </div>
                                                        )}
                                                        {task.assignee ? (
                                                            <div
                                                                className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[9px] flex items-center justify-center border border-primary/20 shrink-0"
                                                                title={`Assigned to ${task.assignee.name}`}
                                                            >
                                                                {task.assignee.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="w-5 h-5 rounded-full bg-muted/60 text-muted-foreground/50 text-[9px] flex items-center justify-center border border-border/60 shrink-0"
                                                                title="Unassigned"
                                                            >
                                                                <UserIcon size={10} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            {/* Quick Inline Trigger Button at bottom */}
                            {!isAddingHere && (
                                <button
                                    onClick={() => {
                                        setQuickAddColumn(column.id);
                                        setQuickTitle("");
                                    }}
                                    className="w-full py-2 border border-dashed border-border/80 hover:border-primary/60 rounded-xl text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-card/40 hover:bg-card mt-2"
                                >
                                    <Plus size={12} />
                                    <span>Add Task</span>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

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
                                                (PRIORITY_CONFIG[selectedTask.priority] || PRIORITY_CONFIG.Medium).badgeClass
                                            )}
                                        >
                                            <span className={cn("w-1.5 h-1.5 rounded-full", (PRIORITY_CONFIG[selectedTask.priority] || PRIORITY_CONFIG.Medium).dotClass)} />
                                            {(PRIORITY_CONFIG[selectedTask.priority] || PRIORITY_CONFIG.Medium).label}
                                        </span>
                                        <span className="text-xs text-muted-foreground px-2.5 py-1 bg-muted rounded-lg font-medium">
                                            {STATUS_COLUMNS.find((c) => c.id === selectedTask.status)?.title || selectedTask.status}
                                        </span>
                                    </div>
                                    <SheetTitle className="text-lg font-bold text-foreground leading-snug">
                                        {selectedTask.title}
                                    </SheetTitle>
                                    <SheetDescription className="text-xs text-muted-foreground mt-1">
                                        {selectedTask.description || "No additional notes or description provided."}
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
                                        <span className="font-semibold text-foreground mt-1 block">{selectedTask.date || "No date"}</span>
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
                                    onClick={() => handleDeleteTask(selectedTask.id)}
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

            {/* Task Create Modal */}
            <TaskFormModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                defaultProjectId={projectId}
                onSuccess={handleTaskSaved}
            />

            {/* Task Edit Modal */}
            <TaskFormModal
                open={!!editingTask}
                onOpenChange={(open) => !open && setEditingTask(null)}
                task={editingTask}
                defaultProjectId={projectId}
                onSuccess={handleTaskSaved}
            />

            {/* Master Data Management Modal */}
            <MasterDataModal
                open={isMasterDataOpen}
                onOpenChange={setIsMasterDataOpen}
                initialTab="priorities"
            />
        </div>
    );
}
