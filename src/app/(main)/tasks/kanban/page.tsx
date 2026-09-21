"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    Plus,
    MoreHorizontal,
    LayoutGrid,
    List,
    Clock,
    Briefcase
} from "lucide-react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/types";

const STATUS_COLUMNS: { id: TaskStatus; title: string }[] = [
    { id: "Belum Mulai", title: "Belum Mulai" },
    { id: "Proses", title: "Sedang Dikerjakan" },
    { id: "Peninjauan", title: "Peninjauan" },
    { id: "Selesai", title: "Selesai" },
];

const PRIORITY_BADGE_STYLE: Record<string, string> = {
    Rendah: "bg-gray-50 text-gray-500 border-gray-100",
    Sedang: "bg-blue-50 text-blue-500 border-blue-100",
    Tinggi: "bg-orange-50 text-orange-500 border-orange-100",
    Mendesak: "bg-red-50 text-red-500 border-red-100",
};

export default function KanbanPage() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get("projectId") || "";

    const [tasks, setTasks] = useState<Task[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const [projectName, setProjectName] = useState<string>("");

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

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const targetStatus = destination.droppableId as TaskStatus;

        setTasks((prev) =>
            prev.map((t) => (t.id === draggableId ? { ...t, status: targetStatus } : t))
        );
    };

    if (!isMounted) return null;

    const listHref = projectId ? `/tasks?projectId=${projectId}` : "/tasks";
    const newHref = projectId ? `/tasks/new?projectId=${projectId}` : "/tasks/new";

    return (
        <div className="space-y-6 pb-16 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 pb-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-bold text-foreground tracking-tight">Kanban</h2>
                        {projectName && (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                                {projectName}
                            </span>
                        )}
                    </div>
                    <p className="text-muted-foreground text-xs mt-0.5">
                        {projectName
                            ? `Alur tugas visual khusus proyek ${projectName}`
                            : "Pantau alur tugas visual tim Anda secara dinamis."}
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="bg-muted p-0.5 rounded-lg flex border border-border">
                        <Link href={listHref}>
                            <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md cursor-pointer">
                                <List size={15} />
                            </button>
                        </Link>
                        <button className="p-1.5 bg-card text-primary rounded-md shadow-xs">
                            <LayoutGrid size={15} />
                        </button>
                    </div>
                    <Link href={newHref}>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all shadow-sm cursor-pointer">
                            <Plus size={14} />
                            Tugas Baru
                        </button>
                    </Link>
                </div>
            </div>

            {/* Kanban Grid */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                    {STATUS_COLUMNS.map((column) => {
                        const colTasks = tasks.filter((t) => t.status === column.id);

                        return (
                            <div key={column.id} className="bg-muted/40 border border-border rounded-xl p-3.5 flex flex-col min-h-[500px]">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-xs tracking-tight text-foreground">{column.title}</h3>
                                        <span className="text-[10px] font-medium text-muted-foreground bg-card border border-border px-1.5 py-0.2 rounded-full">
                                            {colTasks.length}
                                        </span>
                                    </div>
                                </div>

                                <Droppable droppableId={column.id}>
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="space-y-3 flex-1"
                                        >
                                            {colTasks.map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={cn(
                                                                "bg-card border border-border/60 p-3.5 rounded-xl transition-all group cursor-grab active:cursor-grabbing",
                                                                snapshot.isDragging
                                                                    ? "shadow-lg border-primary scale-105 z-50 bg-card"
                                                                    : "shadow-sm hover:border-primary/30"
                                                            )}
                                                        >
                                                            <div className="flex justify-between items-start mb-2.5">
                                                                <div className={cn(
                                                                    "px-2 py-0.5 text-[9px] font-semibold uppercase rounded-md border",
                                                                    PRIORITY_BADGE_STYLE[task.priority] || PRIORITY_BADGE_STYLE.Sedang
                                                                )}>
                                                                    {task.priority}
                                                                </div>
                                                                <Link href={`/tasks/edit/${task.id}`}>
                                                                    <button className="text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:text-foreground transition-all cursor-pointer">
                                                                        <MoreHorizontal size={14} />
                                                                    </button>
                                                                </Link>
                                                            </div>
                                                            <h4 className="text-xs font-semibold text-foreground mb-3 leading-snug">
                                                                {task.title}
                                                            </h4>

                                                            <div className="flex items-center justify-between pt-2.5 border-t border-border/40">
                                                                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                                                    <Briefcase size={11} className="text-muted-foreground shrink-0" />
                                                                    <span className="text-[10px] font-medium text-muted-foreground truncate">
                                                                        {task.project}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground shrink-0">
                                                                    <Clock size={10} />
                                                                    <span>{task.date}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}

                                            <Link href={newHref} className="block w-full">
                                                <button className="w-full py-2 border border-dashed border-border/80 hover:border-primary/50 rounded-xl text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-card/50 hover:bg-card">
                                                    <Plus size={13} />
                                                    Tambah Tugas
                                                </button>
                                            </Link>
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}
