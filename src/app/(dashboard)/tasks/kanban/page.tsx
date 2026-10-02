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
    CaretLeft,
    CaretRight,
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
import {
    getIssueTypeConfig,
    getPriorityConfig,
    MasterStatusItem,
} from "@/lib/master-data";
import type { Task, TaskStatus, TaskActivity } from "@/types";
import { apiFetch } from "@/lib/api-client";
import { useMasterDataStore } from "@/stores/master-data-store";

interface ColumnConfig {
    id: TaskStatus;
    title: string;
    description: string;
    dotColor: string;
    badgeStyle: string;
    headerBorder: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
}

function statusToColumn(status: MasterStatusItem): ColumnConfig {
    const icon = status.isCompleted
        ? CheckCircle
        : status.order === 2
          ? HourglassMedium
          : status.order > 2
            ? WarningCircle
            : CircleDashed;

    return {
        id: status.id,
        title: status.name,
        description: status.description || "Custom workflow status",
        dotColor: status.dotColor,
        badgeStyle: status.badgeClass,
        headerBorder: status.headerBorder,
        icon,
    };
}

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
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const { priorities: masterPriorities, statuses: masterStatuses, issueTypes: masterIssueTypes, loadAll } = useMasterDataStore();
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

        void loadAll();
    }, [loadAll]);

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
                    issueType: task.issueType || masterIssueTypes[0]?.id,
                    description: task.description || "",
                }),
            });
            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    setTasks((prev) => [json.data, ...prev]);
                    toast.success("Task duplicated 📋");
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
        if (!masterPriorities[0] || !masterIssueTypes[0]) {
            toast.error("Task configuration is still loading");
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
                    priority: masterPriorities[0]?.id,
                    status: columnId,
                    issueType: masterIssueTypes[0]?.id,
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
        for (const col of statusColumns) {
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

    const completedStatusIds = useMemo(() => new Set(masterStatuses.filter((status) => status.isCompleted).map((status) => status.id)), [masterStatuses]);
    const highPriorityIds = useMemo(() => {
        const maxLevel = Math.max(0, ...masterPriorities.map((priority) => priority.level));
        return new Set(masterPriorities.filter((priority) => priority.level >= Math.max(1, maxLevel - 1)).map((priority) => priority.id));
    }, [masterPriorities]);

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
                (highPriorityIds.has(task.priority) && !completedStatusIds.has(task.status));
            const matchesAssignee =
                !filterAssignedToMe ||
                (currentUserId ? task.assigneeId === currentUserId : !!task.assigneeId);
            return matchesSearch && matchesPriority && matchesUrgentFocus && matchesAssignee;
        });
    }, [tasks, searchQuery, selectedPriority, focusUrgentOnly, filterAssignedToMe, currentUserId, highPriorityIds, completedStatusIds]);

    const statusColumns = useMemo(() => {
        const configuredIds = new Set(masterStatuses.map((status) => status.id));
        const orphanStatuses: MasterStatusItem[] = Array.from(
            new Set(tasks.map((task) => task.status).filter((status) => !configuredIds.has(status)))
        ).map((status, index) => ({
            id: status,
            name: status,
            description: "Status retained from an existing task",
            order: masterStatuses.length + index + 1,
            dotColor: "bg-slate-400",
            badgeClass: "bg-slate-100 text-slate-700",
            headerBorder: "border-slate-200/80",
            isCompleted: false,
        }));

        return [...masterStatuses, ...orphanStatuses]
            .sort((a, b) => a.order - b.order)
            .map(statusToColumn);
    }, [masterStatuses, tasks]);

    const boardScrollRef = useRef<HTMLDivElement | null>(null);
    const [canScrollBoardLeft, setCanScrollBoardLeft] = useState(false);
    const [canScrollBoardRight, setCanScrollBoardRight] = useState(false);

    useEffect(() => {
        const board = boardScrollRef.current;
        if (!board) return;
        const syncScrollButtons = () => {
            setCanScrollBoardLeft(board.scrollLeft > 2);
            setCanScrollBoardRight(board.scrollLeft + board.clientWidth < board.scrollWidth - 2);
        };
        syncScrollButtons();
        board.addEventListener("scroll", syncScrollButtons, { passive: true });
        const resizeObserver = new ResizeObserver(syncScrollButtons);
        resizeObserver.observe(board);
        return () => {
            board.removeEventListener("scroll", syncScrollButtons);
            resizeObserver.disconnect();
        };
    }, [statusColumns.length]);

    const scrollBoard = (direction: "left" | "right") => {
        boardScrollRef.current?.scrollBy({
            left: direction === "left" ? -340 : 340,
            behavior: "smooth",
        });
    };

    const router = useRouter();

    const handleSelectProject = (newId: string) => {
        if (newId) {
            router.push(`/tasks/kanban?projectId=${newId}`);
        } else {
            router.push(`/tasks/kanban`);
        }
    };

    if (!isMounted) return null;

    const listHref = projectId ? `/tasks/backlog?projectId=${projectId}` : "/tasks/backlog";

    return (
        <div className="space-y-5 pb-16">
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
                            ? `Tasks in ${projectName}`
                            : "Move work through each stage and keep the next step visible."}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    {/* View Switcher */}
                    <div className="bg-muted/70 p-1 rounded-lg flex border border-border">
                        <Link href={listHref}>
                            <button
                                title="List view"
                                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg cursor-pointer hover:bg-background/60"
                            >
                                <ListDashes size={15} />
                            </button>
                        </Link>
                        <button
                            title="Board view"
                            className="p-1.5 bg-card text-foreground font-semibold rounded-lg shadow-none border border-border/60"
                        >
                            <SquaresFour size={15} />
                        </button>
                    </div>

                    {/* New Task Button (Modal) */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:opacity-90 transition-colors shadow-none cursor-pointer"
                    >
                        <Plus size={14} className="stroke-[2.5]" />
                        <span>New task</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar: Search + Priority Chips */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-2.5 rounded-lg border border-border/60">
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} />
                    <input
                        type="text"
                        placeholder="Search tasks"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-1.5 text-xs bg-card border border-border rounded-lg focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/60"
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
                            "px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                            focusUrgentOnly
                                ? "bg-rose-500 text-white border-rose-600 shadow-none ring-2 ring-rose-500/20"
                                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/50"
                        )}
                        title="Show high and urgent priority tasks"
                    >
                        <Lightning size={12} weight={focusUrgentOnly ? "fill" : "regular"} className={focusUrgentOnly ? "text-white" : "text-amber-500"} />
                        <span>High priority</span>
                    </button>

                    {/* Jira-style Quick Filter: Assigned */}
                    <button
                        type="button"
                        onClick={() => setFilterAssignedToMe((prev) => !prev)}
                        className={cn(
                            "px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                            filterAssignedToMe
                                ? "bg-primary text-primary-foreground border-primary shadow-none ring-2 ring-primary/20"
                                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/50"
                        )}
                        title="Show assigned tasks"
                    >
                        <UserIcon size={12} weight={filterAssignedToMe ? "bold" : "regular"} />
                        <span>Assigned</span>
                    </button>

                    <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">Priority</span>
                        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                            <SelectTrigger className="h-8 w-[140px] text-xs rounded-lg bg-card border-border/80">
                                <SelectValue placeholder="All priorities" />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                                <SelectItem value="All" className="text-xs cursor-pointer">
                                    All priorities
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

            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2">
                <p className="text-[11px] font-medium text-muted-foreground">Scroll to view additional status columns</p>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => scrollBoard("left")}
                        disabled={!canScrollBoardLeft}
                        aria-label="Scroll board left"
                        title="Scroll left"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                    >
                        <CaretLeft size={15} weight="bold" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollBoard("right")}
                        disabled={!canScrollBoardRight}
                        aria-label="Scroll board right"
                        title="Scroll right"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                    >
                        <CaretRight size={15} weight="bold" />
                    </button>
                </div>
            </div>

            {/* Kanban Columns Grid powered by Framer Motion */}
            <div ref={boardScrollRef} className="flex scroll-smooth items-start gap-5 overflow-x-auto pb-4">
                {statusColumns.map((column) => {
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
                                "relative flex min-h-[560px] min-w-[280px] flex-1 flex-col rounded-xl border bg-card p-4 transition-colors duration-200",
                                containsDraggedTask ? "z-40" : isHovered ? "z-30" : "z-10",
                                isHovered
                                    ? "border-primary/80 ring-2 ring-primary/20 bg-primary/[0.04]"
                                    : "border-border/80 shadow-none hover:border-border"
                            )}
                        >
                            {/* Column Header */}
                            <div className={cn("mb-4 flex items-center justify-between border-b px-1 pb-3", column.headerBorder)}>
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", column.dotColor)} />
                                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                                        {column.title}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className={cn("inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-border/40 px-2 text-[11px] font-semibold", column.badgeStyle)}>
                                        {colTasks.length}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setQuickAddColumn(isAddingHere ? null : column.id);
                                            setQuickTitle("");
                                        }}
                                        title={`Add to ${column.title}`}
                                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        <Plus size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Cards Area with Motion */}
                            <div className="min-h-[220px] flex-1 space-y-3 rounded-lg p-0.5">
                                {/* Inline Quick Add Input */}
                                {isAddingHere && (
                                    <div className="bg-card border border-primary/50 p-3 rounded-lg shadow-none space-y-2 animate-in fade-in duration-200">
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
                                            className="h-28 border border-dashed border-border/70 rounded-lg flex flex-col items-center justify-center text-center p-3 select-none pointer-events-none"
                                        >
                                            <ColumnIcon className="text-muted-foreground/30 mb-1" size={18} />
                                            <span className="text-[11px] text-muted-foreground/70">
                                                No tasks in this lane
                                            </span>
                                        </motion.div>
                                    )}
                                    {colTasks.map((task) => {
                                        const priorityConf = getPriorityConfig(masterPriorities, task.priority);
                                        const issueTypeConf = getIssueTypeConfig(masterIssueTypes, task.issueType);
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
                                                    "group kanban-card-draggable relative flex min-h-[168px] cursor-grab touch-none select-none flex-col rounded-xl border border-border/80 bg-card p-4 active:cursor-grabbing",
                                                    isDragging
                                                        ? "!z-[100] !cursor-grabbing border-primary/80 ring-2 ring-primary/40 bg-card shadow-none"
                                                        : "z-10 shadow-none transition-colors hover:border-primary/35 hover:bg-card hover:ring-1 hover:ring-primary/15"
                                                )}
                                            >
                                                {/* Card Top: Issue Type + Key & Priority Badge & Actions */}
                                                <div className="mb-3 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {/* Issue Type Icon + Key */}
                                                        <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/60 px-2 py-1 font-mono text-[10px] font-bold text-muted-foreground/90">
                                                            <TypeIcon size={12} className={cn("shrink-0", issueTypeConf.colorClass.split(" ")[0])} weight="bold" />
                                                            <span>{task.key || `T-${task.id.slice(0, 4)}`}</span>
                                                        </div>

                                                        {/* Priority */}
                                                        <div
                                                            className={cn(
                                                                "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold",
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
                                                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-70 transition-colors hover:bg-muted/80 hover:text-foreground group-hover:opacity-100"
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
                                                                Edit task
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDuplicateTask(task);
                                                                }}
                                                                className="cursor-pointer flex items-center gap-2"
                                                            >
                                                                <Copy size={12} />
                                                                Duplicate task
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
                                                <h4 className="mb-4 line-clamp-2 text-[13px] font-semibold leading-[1.45] text-foreground">
                                                    {task.title}
                                                </h4>

                                                {/* Card Footer info */}
                                                <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
                                                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                                        <Briefcase size={12} className="shrink-0 text-muted-foreground/70" />
                                                        <span className="truncate text-[11px] font-medium">
                                                            {task.project}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {task.date && (
                                                            <div className="flex items-center gap-1 text-[11px] font-medium">
                                                                <Clock size={11} className="text-muted-foreground/70" />
                                                                <span>{task.date}</span>
                                                            </div>
                                                        )}
                                                        {task.assignee ? (
                                                            <div
                                                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[10px] font-bold text-primary"
                                                                title={`Assigned to ${task.assignee.name}`}
                                                            >
                                                                {task.assignee.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/60 text-[9px] text-muted-foreground/50"
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
                                    className="w-full py-2 border border-dashed border-border/80 hover:border-primary/60 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-card hover:bg-card mt-2"
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
                <SheetContent side="right" className="sm:max-w-xl w-full p-0 flex flex-col h-full bg-card border-l border-border shadow-none">
                    {selectedTask && (
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-border/60">
                                <SheetHeader className="p-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {/* Issue Type & Key */}
                                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-foreground bg-muted px-2.5 py-1 rounded-lg border border-border/60">
                                            {(() => { const config = getIssueTypeConfig(masterIssueTypes, selectedTask.issueType); const Icon = config.icon; return <Icon size={14} className={config.colorClass.split(" ")[0]} weight="bold" />; })()}
                                            <span>{selectedTask.key || `T-${selectedTask.id.slice(0, 4)}`}</span>
                                        </div>

                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border",
                                                getPriorityConfig(masterPriorities, selectedTask.priority).badgeClass
                                            )}
                                        >
                                            <span className={cn("w-1.5 h-1.5 rounded-full", getPriorityConfig(masterPriorities, selectedTask.priority).dotClass)} />
                                            {getPriorityConfig(masterPriorities, selectedTask.priority).label}
                                        </span>
                                        <span className="text-xs text-muted-foreground px-2.5 py-1 bg-muted rounded-lg font-medium">
                                            {statusColumns.find((c) => c.id === selectedTask.status)?.title || selectedTask.status}
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
                                <div className="grid grid-cols-3 gap-3 p-4 bg-muted/30 rounded-lg border border-border/60 text-xs">
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
                                            <Skeleton className="h-14 w-full rounded-lg" />
                                            <Skeleton className="h-14 w-full rounded-lg" />
                                            <Skeleton className="h-14 w-full rounded-lg" />
                                        </div>
                                    ) : taskActivities.length === 0 ? (
                                        <p className="text-xs text-muted-foreground py-6 text-center bg-muted/20 border border-dashed border-border rounded-lg">
                                            No logged activities recorded yet.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {taskActivities.map((act) => (
                                                <div key={act.id} className="text-xs flex items-start gap-2.5 bg-muted/30 p-3 rounded-lg border border-border/50">
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
                                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-rose-50 transition-colors"
                                >
                                    <Trash size={14} />
                                    Delete Task
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedTask(null)}
                                        className="px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => {
                                            const t = selectedTask;
                                            setSelectedTask(null);
                                            setEditingTask(t);
                                        }}
                                        className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-none transition-colors"
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

        </div>
    );
}
