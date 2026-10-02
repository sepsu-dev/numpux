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
import type { Task, Project } from "@/types";
import { apiFetch } from "@/lib/api-client";
import { useMasterDataStore } from "@/stores/master-data-store";

export default function EditTaskPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [task, setTask] = useState<Task | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { priorities, loadAll } = useMasterDataStore();

    useEffect(() => { void loadAll(); }, [loadAll]);

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
            router.push("/tasks/backlog");
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
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
                <Link href="/tasks/backlog" className="p-2 hover:bg-muted/70 rounded-lg text-foreground transition-colors border border-border bg-card shadow-none cursor-pointer">
                    <ArrowLeft size={15} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Edit task</h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Update progress, priority, and implementation notes.</p>
                </div>
            </div>

            <div className="bg-card border border-border/80 rounded-lg p-6 sm:p-8 shadow-none">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                        <div className="grid gap-1.5">
                            <Label htmlFor="title" className="font-semibold text-xs text-foreground px-0.5">Task Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={task?.title || ""}
                                className="h-10 text-xs rounded-lg border border-border focus:border-primary font-medium text-foreground px-3.5 bg-white transition-colors shadow-none"
                                required
                            />
                        </div>

                        {/* Project (Full Width) */}
                        <div className="grid gap-1.5">
                            <Label className="font-semibold text-xs text-foreground px-0.5">Project *</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="h-10 w-full flex items-center justify-between rounded-lg border border-border px-3 bg-white hover:bg-background transition-colors text-foreground font-medium shadow-none text-xs cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <Briefcase size={14} className={!activeProject ? "text-muted-foreground shrink-0" : "text-primary shrink-0"} />
                                            <span className="text-xs truncate">
                                                {activeProject ? activeProject.title : (task?.project || "Select a project")}
                                            </span>
                                        </div>
                                        <CaretDown size={13} className="text-muted-foreground opacity-60 shrink-0 ml-2" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[280px] max-h-60 overflow-y-auto rounded-lg border border-border p-1 text-xs shadow-md">
                                    {projects.map((proj) => (
                                        <DropdownMenuItem
                                            key={proj.id}
                                            className="cursor-pointer py-2 px-2.5 rounded-lg flex items-center justify-between"
                                            onClick={() => setSelectedProjectId(proj.id)}
                                        >
                                            <div className="flex items-center gap-2 truncate pr-2">
                                                <span className="font-medium text-foreground truncate">{proj.title}</span>
                                                {proj.category && (
                                                    <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/40 shrink-0">
                                                        {proj.category}
                                                    </span>
                                                )}
                                            </div>
                                            {selectedProjectId === proj.id && <span className="text-primary text-xs font-bold shrink-0">✓</span>}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="date" className="font-semibold text-xs text-foreground px-0.5">
                                    Due Date <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
                                </Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    defaultValue={task?.date || ""}
                                    className="h-10 text-xs rounded-lg border border-border focus:border-primary font-medium text-foreground px-3.5 bg-white shadow-none"
                                />
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="priority" className="font-semibold text-xs text-foreground px-0.5">Priority Level</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                {priorities.map((p) => (
                                    <label key={p.id} className="cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value={p.id}
                                            className="sr-only peer"
                                            defaultChecked={task?.priority === p.id || (!task?.priority && p.id === priorities[0]?.id)}
                                        />
                                        <div className="flex items-center justify-center p-2.5 text-xs font-medium border border-border rounded-lg peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-checked:font-semibold transition-colors shadow-none hover:bg-muted/50">
                                            {p.name}
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
                                className="min-h-[110px] rounded-lg border border-border focus:border-primary resize-none p-3.5 font-normal text-xs text-foreground bg-white shadow-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex items-center justify-end gap-2.5">
                        <Button type="button" variant="outline" size="sm" onClick={() => router.back()} className="rounded-lg text-xs h-9 px-4 border-border cursor-pointer hover:bg-muted">Cancel</Button>
                        <Button type="submit" size="sm" disabled={isSaving} className="rounded-lg text-xs h-9 px-5 bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-colors cursor-pointer shadow-none">
                            {isSaving ? "Saving..." : "Save changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
