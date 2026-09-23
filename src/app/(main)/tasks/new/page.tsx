"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CaretDown, Briefcase } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/lib/types";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function NewTaskPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefillProjectId = searchParams.get("projectId") || "";

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>(prefillProjectId);
    const [dueDate, setDueDate] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        apiFetch("/api/projects")
            .then((res) => res.json())
            .then((res) => {
                if (res.data) {
                    setProjects(res.data);
                    if (prefillProjectId) {
                        const found = res.data.find((p: Project) => p.id === prefillProjectId);
                        if (found) setSelectedProjectId(found.id);
                    } else if (res.data.length === 1) {
                        setSelectedProjectId(res.data[0].id);
                    }
                }
            })
            .catch(() => {});
    }, [prefillProjectId]);

    const activeProject = projects.find((p) => p.id === selectedProjectId);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const priority = formData.get("priority") as string;
        const description = formData.get("description") as string;

        if (!title.trim()) {
            toast.error("Task title is required");
            return;
        }

        if (!selectedProjectId) {
            toast.error("Please select a project for this task");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await apiFetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    projectId: selectedProjectId,
                    project: activeProject ? activeProject.title : "Project",
                    priority: priority || "Medium",
                    date: dueDate ? dueDate : undefined,
                    description: description.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to create task");
            }

            toast.success("Task created successfully!");
            router.push(selectedProjectId ? `/tasks?projectId=${selectedProjectId}` : "/tasks");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to save task.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-3xl">
            <div className="flex items-center gap-3">
                <Link href="/tasks" className="p-2 hover:bg-muted/70 rounded-xl text-foreground transition-all border border-border bg-card active:scale-95 shadow-2xs cursor-pointer">
                    <ArrowLeft size={15} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Create Task</h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Define task details, priority, and link to a project.</p>
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
                                placeholder="e.g. Implement webhook retry queue"
                                className="h-10 text-xs rounded-xl border border-border focus:border-primary font-medium px-3.5 bg-background/50 transition-all text-foreground shadow-2xs"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="font-semibold text-xs text-foreground px-0.5">Project *</Label>
                                    {projects.length === 0 && (
                                        <Link href="/projects/new" className="text-[11px] text-primary hover:underline font-semibold">
                                            + Create Project First
                                        </Link>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className={cn(
                                                "h-10 w-full flex items-center justify-between rounded-xl border px-3 bg-background/50 hover:bg-background transition-all text-foreground font-medium shadow-2xs text-xs cursor-pointer",
                                                !selectedProjectId ? "border-amber-300 text-muted-foreground" : "border-border"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Briefcase size={14} className={!activeProject ? "text-muted-foreground" : "text-primary"} />
                                                <span className={!activeProject ? "text-muted-foreground" : "text-foreground font-medium"}>
                                                    {activeProject ? activeProject.title : (projects.length === 0 ? "No Projects" : "Select Project")}
                                                </span>
                                            </div>
                                            <CaretDown size={13} className="text-muted-foreground opacity-60" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[280px] p-1 text-xs">
                                        {projects.map((project) => (
                                            <DropdownMenuItem
                                                key={project.id}
                                                className="cursor-pointer py-2 px-2.5 rounded-lg flex items-center justify-between"
                                                onClick={() => setSelectedProjectId(project.id)}
                                            >
                                                <span className="font-medium truncate">{project.title}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{project.category}</span>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="font-semibold text-xs text-foreground px-0.5">
                                    Due Date <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
                                </Label>
                                <DatePicker
                                    value={dueDate}
                                    onChange={(val) => setDueDate(val)}
                                    placeholder="Select due date..."
                                />
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label className="font-semibold text-xs text-foreground px-0.5">Priority</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                {[
                                    { id: 'Low', label: 'Low', value: 'Low' },
                                    { id: 'Medium', label: 'Medium', value: 'Medium' },
                                    { id: 'High', label: 'High', value: 'High' },
                                    { id: 'Critical', label: 'Urgent', value: 'Urgent' },
                                ].map((p) => (
                                    <label key={p.id} className="cursor-pointer group">
                                        <input type="radio" name="priority" value={p.value} className="sr-only peer" defaultChecked={p.id === 'Medium'} />
                                        <div className="flex items-center justify-center p-2.5 text-xs font-medium rounded-xl border border-border peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-checked:font-semibold transition-all hover:bg-muted/50 shadow-2xs">
                                            {p.label}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="description" className="font-semibold text-xs text-foreground px-0.5">Description & Acceptance Criteria</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Add technical background, testing checklist, or steps to complete..."
                                className="min-h-[110px] rounded-xl border border-border focus:border-primary resize-none p-3.5 font-normal text-xs bg-background/50 transition-all text-foreground shadow-2xs"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex items-center justify-end gap-2.5">
                        <Button type="button" variant="outline" size="sm" onClick={() => router.back()} className="rounded-xl text-xs h-9 px-4 border-border cursor-pointer hover:bg-muted">Cancel</Button>
                        <Button type="submit" size="sm" disabled={isSubmitting} className="rounded-xl text-xs h-9 px-5 bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-xs">
                            {isSubmitting ? "Creating..." : "Create Task"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}