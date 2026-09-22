"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
    Plus,
    MoreHorizontal,
    LayoutGrid,
    List,
    Clock,
    Briefcase,
    Search,
    CheckCircle2,
    CircleDot,
    Timer,
    AlertCircle,
    Edit2,
    Trash2,
    X,
    Sparkles,
    Check
} from "lucide-react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus, Priority } from "@/lib/types";

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
        id: "Belum Mulai",
        title: "To Do",
        description: "Backlog & scheduled deliverables",
        dotColor: "bg-slate-400",
        badgeStyle: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        headerBorder: "border-slate-200/80 dark:border-slate-800",
        icon: CircleDot,
    },
    {
        id: "Proses",
        title: "In Progress",
        description: "Currently under active development",
        dotColor: "bg-blue-500",
        badgeStyle: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
        headerBorder: "border-blue-200/80 dark:border-blue-800",
        icon: Timer,
    },
    {
        id: "Peninjauan",
        title: "Under Review",
        description: "Awaiting QA, code review, or approval",
        dotColor: "bg-amber-500",
        badgeStyle: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
        headerBorder: "border-amber-200/80 dark:border-amber-800",
        icon: AlertCircle,
    },
    {
        id: "Selesai",
        title: "Completed",
        description: "Verified and shipped to production",
        dotColor: "bg-emerald-500",
        badgeStyle: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
        headerBorder: "border-emerald-200/80 dark:border-emerald-800",
        icon: CheckCircle2,
    },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; badgeClass: string; dotClass: string }> = {
    Rendah: {
        label: "Low",
        badgeClass: "bg-muted/80 text-muted-foreground border-border/80",
        dotClass: "bg-muted-foreground/60",
    },
    Sedang: {
        label: "Medium",
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40",
        dotClass: "bg-sky-500",
    },
    Tinggi: {
        label: "High",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
        dotClass: "bg-amber-500",
    },
    Mendesak: {
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

    // Quick add inline
    const [quickAddColumn, setQuickAddColumn] = useState<TaskStatus | null>(null);
    const [quickTitle, setQuickTitle] = useState("");
    const [isSavingQuick, setIsSavingQuick] = useState(false);

    // Detail Preview Modal
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const loadTasks = () => {
        const url = projectId ? `/api/tasks?projectId=${projectId}` : "/api/tasks";
        fetch(url)
            .then((res) => res.json())
            .then((res) => {
                if (res.data) setTasks(res.data);
            })
            .catch(() => {});

        if (projectId) {
            fetch(`/api/projects`)
                .then((res) => res.json())
                .then((res) => {
                    const found = res.data?.find((p: any) => p.id === projectId);
                    if (found) setProjectName(found.title);
                })
                .catch(() => {});
        } else {
            setProjectName("");
        }
    };

    useEffect(() => {
        setIsMounted(true);
        loadTasks();
    }, [projectId]);

    const updateTaskStatusBackend = async (taskId: string, targetStatus: TaskStatus) => {
        try {
            await fetch(`/api/tasks/${taskId}`, {
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
            await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
        } catch {
            loadTasks();
        }
    };

    const handleCreateQuickTask = async (columnId: TaskStatus) => {
        if (!quickTitle.trim()) {
            setQuickAddColumn(null);
            return;
        }

        setIsSavingQuick(true);
        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: quickTitle.trim(),
                    projectId: projectId || undefined,
                    project: projectName || "Main Project",
                    priority: "Sedang",
                    date: "Today",
                    status: columnId,
                }),
            });

            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    setTasks((prev) => [json.data, ...prev]);
                    toast.success("New task created!");
                }
            }
        } catch {
            toast.error("Failed to add task");
        } finally {
            setIsSavingQuick(false);
            setQuickTitle("");
            setQuickAddColumn(null);
        }
    };

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const sourceStatus = source.droppableId as TaskStatus;
        const targetStatus = destination.droppableId as TaskStatus;

        setTasks((prevTasks) => {
            // Reordering tasks array
            const next = [...prevTasks];
            const currentItem = next.find((t) => t.id === draggableId);
            if (!currentItem) return prevTasks;

            // Tasks in target column before insertion
            const currentDestColumnTasks = next.filter(
                (t) => t.status === targetStatus && t.id !== draggableId
            );

            // Remove dragged item from its current position
            const filteredNext = next.filter((t) => t.id !== draggableId);
            const updatedItem = { ...currentItem, status: targetStatus };

            if (currentDestColumnTasks.length === 0) {
                // If column was empty, append
                return [...filteredNext, updatedItem];
            }

            if (destination.index >= currentDestColumnTasks.length) {
                // Insert after the last item in target column
                const lastDestTask = currentDestColumnTasks[currentDestColumnTasks.length - 1];
                const lastIndex = filteredNext.indexOf(lastDestTask);
                filteredNext.splice(lastIndex + 1, 0, updatedItem);
            } else {
                // Insert right before the item currently at destination.index
                const targetTask = currentDestColumnTasks[destination.index];
                const targetIndex = filteredNext.indexOf(targetTask);
                filteredNext.splice(targetIndex, 0, updatedItem);
            }

            return filteredNext;
        });

        if (sourceStatus !== targetStatus) {
            updateTaskStatusBackend(draggableId, targetStatus);
        }
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const matchesSearch =
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.project.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPriority =
                selectedPriority === "All" || task.priority === selectedPriority;
            return matchesSearch && matchesPriority;
        });
    }, [tasks, searchQuery, selectedPriority]);

    if (!isMounted) return null;

    const listHref = projectId ? `/tasks?projectId=${projectId}` : "/tasks";
    const newHref = projectId ? `/tasks/new?projectId=${projectId}` : "/tasks/new";

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-16">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            Kanban Board
                        </h2>
                        {projectName && (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                                {projectName}
                            </span>
                        )}
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            Total {filteredTasks.length} tasks
                        </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                        {projectName
                            ? `Visual workflow status and task movement for ${projectName}`
                            : "Drag and drop cards to update task delivery status in real time."}
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
                                <List size={15} />
                            </button>
                        </Link>
                        <button
                            title="Kanban View"
                            className="p-1.5 bg-card text-foreground font-semibold rounded-lg shadow-2xs border border-border/60"
                        >
                            <LayoutGrid size={15} />
                        </button>
                    </div>

                    {/* New Task Button */}
                    <Link href={newHref}>
                        <button className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 active:scale-98 transition-all shadow-xs cursor-pointer">
                            <Plus size={14} className="stroke-[2.5]" />
                            <span>New Task</span>
                        </button>
                    </Link>
                </div>
            </div>

            {/* Filter Bar: Search + Priority Chips */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 p-2.5 rounded-2xl border border-border/60">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} />
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
                    <span className="text-[11px] font-medium text-muted-foreground mr-1 hidden sm:inline">Priority:</span>
                    {[
                        { key: "All", label: "All" },
                        { key: "Rendah", label: "Low" },
                        { key: "Sedang", label: "Medium" },
                        { key: "Tinggi", label: "High" },
                        { key: "Mendesak", label: "Urgent" }
                    ].map((p) => {
                        const active = selectedPriority === p.key;
                        return (
                            <button
                                key={p.key}
                                onClick={() => setSelectedPriority(p.key)}
                                className={cn(
                                    "px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all cursor-pointer whitespace-nowrap",
                                    active
                                        ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                                        : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                {p.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Kanban Columns Grid */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                    {STATUS_COLUMNS.map((column) => {
                        const colTasks = filteredTasks.filter((t) => t.status === column.id);
                        const ColumnIcon = column.icon;
                        const isAddingHere = quickAddColumn === column.id;

                        return (
                            <div
                                key={column.id}
                                className="bg-card/50 backdrop-blur-xs border border-border/80 rounded-2xl p-3.5 flex flex-col min-h-[520px] shadow-2xs hover:border-border transition-all"
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

                                {/* Droppable Card Container */}
                                <Droppable droppableId={column.id}>
                                    {(provided, droppableSnapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={cn(
                                                "space-y-2.5 flex-1 p-0.5 rounded-xl transition-colors min-h-[220px]",
                                                droppableSnapshot.isDraggingOver && "bg-muted/40 ring-1 ring-primary/40"
                                            )}
                                        >
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

                                            {colTasks.length === 0 && !isAddingHere && !droppableSnapshot.isDraggingOver && (
                                                <div className="h-28 border border-dashed border-border/70 rounded-xl flex flex-col items-center justify-center text-center p-3 select-none pointer-events-none">
                                                    <ColumnIcon className="text-muted-foreground/30 mb-1" size={18} />
                                                    <span className="text-[11px] text-muted-foreground/70">
                                                        No tasks in this lane
                                                    </span>
                                                </div>
                                            )}

                                            {colTasks.map((task, index) => {
                                                const priorityConf = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Sedang;

                                                return (
                                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={provided.draggableProps.style}
                                                                onClick={() => setSelectedTask(task)}
                                                                className={cn(
                                                                    "bg-card border border-border/80 p-3.5 rounded-xl group cursor-grab active:cursor-grabbing select-none",
                                                                    snapshot.isDragging
                                                                        ? "shadow-2xl border-primary ring-2 ring-primary/25 z-50 bg-card cursor-grabbing opacity-95 pointer-events-none"
                                                                        : "shadow-2xs hover:shadow-xs hover:border-foreground/20 hover:bg-card/95 transition-[border-color,box-shadow,background-color] duration-150"
                                                                )}
                                                            >
                                                                {/* Card Top: Priority Badge & Actions */}
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <div className={cn(
                                                                        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md border",
                                                                        priorityConf.badgeClass
                                                                    )}>
                                                                        <span className={cn("w-1.5 h-1.5 rounded-full", priorityConf.dotClass)} />
                                                                        {priorityConf.label}
                                                                    </div>

                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <button
                                                                                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <MoreHorizontal size={13} />
                                                                            </button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="w-36 p-1 text-xs">
                                                                            <DropdownMenuItem asChild className="cursor-pointer">
                                                                                <Link href={`/tasks/edit/${task.id}`} className="flex items-center gap-2">
                                                                                    <Edit2 size={12} />
                                                                                    Edit Task
                                                                                </Link>
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteTask(task.id);
                                                                                }}
                                                                                className="text-rose-600 focus:text-rose-600 cursor-pointer flex items-center gap-2"
                                                                            >
                                                                                <Trash2 size={12} />
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
                                                                    <div className="flex items-center gap-1 shrink-0 font-medium text-[10px]">
                                                                        <Clock size={10} className="text-muted-foreground/70" />
                                                                        <span>{task.date}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>

                                {/* Quick Inline Trigger Button at bottom (outside droppable) */}
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
            </DragDropContext>

            {/* Task Detail Modal */}
            <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                <DialogContent className="max-w-md p-6 font-sans">
                    {selectedTask && (
                        <div className="space-y-4">
                            <DialogHeader>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md border",
                                        (PRIORITY_CONFIG[selectedTask.priority] || PRIORITY_CONFIG.Sedang).badgeClass
                                    )}>
                                        <span className={cn("w-1.5 h-1.5 rounded-full", (PRIORITY_CONFIG[selectedTask.priority] || PRIORITY_CONFIG.Sedang).dotClass)} />
                                        {(PRIORITY_CONFIG[selectedTask.priority] || PRIORITY_CONFIG.Sedang).label}
                                    </span>
                                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-md">
                                        {STATUS_COLUMNS.find((c) => c.id === selectedTask.status)?.title || selectedTask.status}
                                    </span>
                                </div>
                                <DialogTitle className="text-base font-bold text-foreground leading-snug">
                                    {selectedTask.title}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    {selectedTask.description || "No additional notes or description provided."}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-2 gap-3 py-3 border-y border-border/60 text-xs">
                                <div>
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Project</span>
                                    <span className="font-semibold text-foreground mt-0.5 block">{selectedTask.project}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Due Date</span>
                                    <span className="font-semibold text-foreground mt-0.5 block">{selectedTask.date}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <button
                                    onClick={() => handleDeleteTask(selectedTask.id)}
                                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Trash2 size={13} />
                                    Delete Task
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedTask(null)}
                                        className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg cursor-pointer"
                                    >
                                        Close
                                    </button>
                                    <Link href={`/tasks/edit/${selectedTask.id}`}>
                                        <button className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-1.5 cursor-pointer">
                                            <Edit2 size={12} />
                                            Edit Details
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}


