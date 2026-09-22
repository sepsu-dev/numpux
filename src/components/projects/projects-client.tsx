"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Briefcase, Edit, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { deleteProjectAction } from "@/lib/actions";
import type { Project } from "@/lib/types";

export function ProjectsClient({ projects }: { projects: Project[] }) {
    const [deleteId, setDeleteId] = useState<string | null>(null);

    return (
        <>
            <div className="flex items-center justify-between gap-4 pb-6">
                <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">Project Workspaces</h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Manage key initiatives, deliverables, and team sprint velocity.</p>
                </div>

                <Link href="/projects/new">
                    <button className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all shadow-sm cursor-pointer">
                        <Plus size={14} />
                        New Project
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                    <div
                        key={project.id}
                        className="bg-card border border-border p-5 rounded-xl shadow-xs group hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                                    {project.category}
                                </span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-lg border border-border bg-card font-sans text-xs shadow-sm">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/projects/edit/${project.id}`} className="cursor-pointer py-1.5 px-2.5">
                                                <Edit size={13} className="mr-2" /> Edit Project
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-500 hover:bg-red-50 cursor-pointer py-1.5 px-2.5"
                                            onClick={() => setDeleteId(project.id)}
                                        >
                                            <Trash2 size={13} className="mr-2" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <h3 className="text-base font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors mb-1">
                                {project.title}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {project.description}
                            </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-border/50 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground font-medium">{project.tasks} Tasks</span>
                                <span className="font-semibold text-foreground">{project.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <Link href="/projects/new" className="group">
                    <div className="h-full min-h-[160px] border border-dashed border-border rounded-xl flex flex-col items-center justify-center p-6 text-center hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 flex items-center justify-center transition-all mb-2">
                            <Plus size={18} />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">Create New Project</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Add a new initiative for your team.</p>
                    </div>
                </Link>
            </div>

            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="rounded-xl border border-border p-6 font-sans shadow-md bg-card max-w-sm">
                    <DialogHeader className="space-y-2">
                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center mb-1">
                            <Trash2 size={20} />
                        </div>
                        <DialogTitle className="text-lg font-semibold text-foreground tracking-tight">Delete Project?</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            All tasks and assets associated with this project will be permanently deleted. Continue?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <form action={async () => { if (deleteId) await deleteProjectAction(deleteId); }} className="flex-1">
                            <Button type="submit" size="sm" className="w-full bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg">Yes, Delete</Button>
                        </form>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}