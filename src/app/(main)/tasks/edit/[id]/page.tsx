"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CaretDown, Briefcase } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Link from "next/link";
import type { Task, Project } from "@/lib/types";
import { apiFetch } from "@/lib/api-client";

export default function EditTaskPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [task, setTask] = useState<Task | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!id) return;
        Promise.all([
            apiFetch(`/api/tasks/${id}`).then((r) => r.json()),
            apiFetch("/api/projects").then((r) => r.json())
        ])
            .then(([taskRes, projectsRes]) => {
                if (taskRes.data) {
                    setTask(taskRes.data);
                    setSelectedProjectId(taskRes.data.projectId || "");
                }
                if (projectsRes.data) {
                    setProjects(projectsRes.data);
                }
            })
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, [id]);

    const activeProject = projects.find((p) => p.id === selectedProjectId);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const priority = formData.get("priority") as string;
        const date = formData.get("date") as string;
        const description = formData.get("description") as string;

        if (!title.trim()) {
            toast.error("Task title is required");
            return;
        }

        if (!selectedProjectId) {
            toast.error("Please select a project for this task");
            return;
        }

        setIsSaving(true);
        try {
            const res = await apiFetch(`/api/tasks/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    projectId: selectedProjectId,
                    project: activeProject ? activeProject.title : (task?.project || "Project"),
                    priority,
                    date: date ? date : null,
                    description: description.trim() || undefined,
                }),
            });
            if (!res.ok) throw new Error("Failed to save");
            toast.success("Task updated successfully!");
            router.push("/tasks");
            router.refresh();
        } catch {
            toast.error("Failed to update task.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="py-20 text-center text-muted-foreground text-sm font-medium">
                Loading task details...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-3xl">
            <div className="flex items-center gap-3">
                <Link href="/tasks" className="p-2 hover:bg-muted/70 rounded-xl text-foreground transition-all border border-border bg-card active:scale-95 shadow-2xs cursor-pointer">
                    <ArrowLeft size={15} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Edit Task</h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Update progress, priority, and implementation notes.</p>
                </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-2xs">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                        <div className="grid gap-1.5">
                            <Label htmlFor="title" className="font-semibold text-xs text-foreground px-0.5">Task Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={task?.title || ""}
                                className="h-10 text-xs rounded-xl border border-border focus:border-primary font-medium text-foreground px-3.5 bg-background/50 transition-all shadow-2xs"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label className="font-semibold text-xs text-foreground px-0.5">Project Workspace *</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="h-10 w-full flex items-center justify-between rounded-xl border border-border px-3 bg-background/50 hover:bg-background transition-all text-foreground font-medium shadow-2xs text-xs cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Briefcase size={14} className={!activeProject ? "text-muted-foreground" : "text-primary"} />
                                                <span className="text-xs truncate">
                                                    {activeProject ? activeProject.title : (task?.project || "Select Project")}
                                                </span>
                                            </div>
                                            <CaretDown size={13} className="text-muted-foreground opacity-60" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[280px] rounded-xl border border-border p-1 text-xs shadow-md">
                                        {projects.map((proj) => (
                                            <DropdownMenuItem
                                                key={proj.id}
                                                className="cursor-pointer py-2 px-2.5 rounded-lg flex items-center justify-between"
                                                onClick={() => setSelectedProjectId(proj.id)}
                                            >
                                                <span className="font-medium truncate">{proj.title}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{proj.category}</span>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="date" className="font-semibold text-xs text-foreground px-0.5">
                                    Due Date <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
                                </Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    defaultValue={task?.date || ""}
                                    className="h-10 text-xs rounded-xl border border-border focus:border-primary font-medium text-foreground px-3.5 bg-background/50 shadow-2xs"
                                />
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="priority" className="font-semibold text-xs text-foreground px-0.5">Priority Level</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                {[
                                    { id: 'Low', label: 'Low', value: 'Low' },
                                    { id: 'Medium', label: 'Medium', value: 'Medium' },
                                    { id: 'High', label: 'High', value: 'High' },
                                    { id: 'Critical', label: 'Urgent', value: 'Urgent' }
                                ].map((p) => (
                                    <label key={p.id} className="cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value={p.value}
                                            className="sr-only peer"
                                            defaultChecked={task?.priority === p.value || (!task?.priority && p.id === 'Medium')}
                                        />
                                        <div className="flex items-center justify-center p-2.5 text-xs font-medium border border-border rounded-xl peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-checked:font-semibold transition-all shadow-2xs hover:bg-muted/50">
                                            {p.label}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="description" className="font-semibold text-xs text-foreground px-0.5">Task Notes & Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={task?.description || ""}
                                className="min-h-[110px] rounded-xl border border-border focus:border-primary resize-none p-3.5 font-normal text-xs text-foreground bg-background/50 shadow-2xs"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex items-center justify-end gap-2.5">
                        <Button type="button" variant="outline" size="sm" onClick={() => router.back()} className="rounded-xl text-xs h-9 px-4 border-border cursor-pointer hover:bg-muted">Cancel</Button>
                        <Button type="submit" size="sm" disabled={isSaving} className="rounded-xl text-xs h-9 px-5 bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-xs">
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}