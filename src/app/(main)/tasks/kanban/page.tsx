"use client";

import { useState } from "react";
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
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export default function KanbanPage() {
    const [columns, setColumns] = useState([
        {
            id: "todo",
            title: "To Do",
            tasks: [
                { id: 2, title: "Argue about spaces vs tabs", project: "Refactor", priority: "Medium", date: "Besok", badgeColor: "bg-blue-50 text-blue-500 border-blue-100" },
                { id: 5, title: "Write integration tests (maybe)", project: "Docs", priority: "Low", date: "28 Mei", badgeColor: "bg-gray-50 text-gray-500 border-gray-100" },
            ]
        },
        {
            id: "inprogress",
            title: "In Progress",
            tasks: [
                { id: 1, title: "Fix 'Works on my machine' bug", project: "Bug Fixes", priority: "High", date: "Hari ini", badgeColor: "bg-orange-50 text-orange-500 border-orange-100" },
            ]
        },
        {
            id: "review",
            title: "Review",
            tasks: [
                { id: 4, title: "Refactor spaghetti auth code", project: "Refactor", priority: "Critical", date: "25 Mei", badgeColor: "bg-red-50 text-red-500 border-red-100" },
            ]
        },
        {
            id: "done",
            title: "Done",
            tasks: [
                { id: 3, title: "Center a div in CSS", project: "Features", priority: "Medium", date: "Kemarin", badgeColor: "bg-blue-50 text-blue-500 border-blue-100" },
            ]
        }
    ]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const onDragEnd = (result: DropResult) => {
        const { destination, source } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const sourceCol = columns.find(col => col.id === source.droppableId);
        const destCol = columns.find(col => col.id === destination.droppableId);

        if (!sourceCol || !destCol) return;

        if (sourceCol === destCol) {
            const newTasks = Array.from(sourceCol.tasks);
            const [removed] = newTasks.splice(source.index, 1);
            newTasks.splice(destination.index, 0, removed);

            const newColumns = columns.map(col => {
                if (col.id === sourceCol.id) {
                    return { ...col, tasks: newTasks };
                }
                return col;
            });

            setColumns(newColumns);
        } else {
            const sourceTasks = Array.from(sourceCol.tasks);
            const [removed] = sourceTasks.splice(source.index, 1);

            const destTasks = Array.from(destCol.tasks);
            destTasks.splice(destination.index, 0, removed);

            const newColumns = columns.map(col => {
                if (col.id === sourceCol.id) {
                    return { ...col, tasks: sourceTasks };
                }
                if (col.id === destCol.id) {
                    return { ...col, tasks: destTasks };
                }
                return col;
            });

            setColumns(newColumns);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between gap-8 pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">Kanban</h2>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Kelola workflow visual Anda.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-muted/60 p-1 rounded-lg flex border border-border/60">
                        <Link href="/dashboard/tasks">
                            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md">
                                <List size={16} />
                            </button>
                        </Link>
                        <button className="p-2 bg-card text-primary rounded-md shadow-sm">
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                    <Link href="/dashboard/tasks/new">
                        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full text-[11px] font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-95">
                            <Plus size={16} />
                            TUGAS BARU
                        </button>
                    </Link>
                </div>
            </div>

            {/* Kanban Grid */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                    {columns.map((column) => (
                        <div key={column.id} className="bg-muted/40 dark:bg-zinc-900/10 border border-border/30 rounded-2xl p-5 flex flex-col min-h-[560px]">
                            <div className="flex items-center justify-between mb-6 px-1">
                                <div className="flex items-center gap-2.5">
                                    <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">{column.title}</h3>
                                    <span className="text-[10px] font-bold text-muted-foreground bg-card border border-border/60 px-2 py-0.5 rounded-full">{column.tasks.length}</span>
                                </div>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-4 flex-1"
                                    >
                                        {column.tasks.map((task, index) => (
                                            <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={cn(
                                                            "bg-card border border-border/40 p-5 rounded-2xl transition-all group cursor-grab active:cursor-grabbing",
                                                            snapshot.isDragging ? 'shadow-lg border-primary/45 scale-105 z-50' : 'shadow-sm hover:shadow-sm hover:border-primary/20'
                                                        )}
                                                    >
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className={cn(
                                                                "px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border",
                                                                task.badgeColor
                                                            )}>
                                                                {task.priority}
                                                            </div>
                                                            <button className="text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:text-foreground transition-all">
                                                                <MoreHorizontal size={14} />
                                                            </button>
                                                        </div>
                                                        <h4 className="text-sm font-bold text-foreground mb-5 transition-colors leading-normal">{task.title}</h4>

                                                        <div className="flex items-center justify-between pt-4 border-t border-border/30">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-5 h-5 rounded-md bg-muted/60 flex items-center justify-center border border-border/30">
                                                                    <Briefcase size={10} className="text-muted-foreground" />
                                                                </div>
                                                                <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-tight">{task.project}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground font-mono">
                                                                <Clock size={10} />
                                                                {task.date}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        <button className="w-full py-3 border border-dashed border-border/60 hover:border-primary/40 rounded-xl text-[10px] font-bold uppercase text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2 group cursor-pointer bg-card shadow-sm">
                                            <Plus size={14} className="group-hover:scale-110 transition-transform" />
                                            TAMBAH TUGAS
                                        </button>
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
