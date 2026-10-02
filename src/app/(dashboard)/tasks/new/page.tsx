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
import type { Project } from "@/types";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useMasterDataStore } from "@/stores/master-data-store";

export default function NewTaskPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefillProjectId = searchParams.get("projectId") || "";

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>(prefillProjectId);
    const [dueDate, setDueDate] = useState<string>("");
    const [priority, setPriority] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { priorities, statuses, issueTypes, loadAll, isLoading: isMasterLoading } = useMasterDataStore();

    useEffect(() => { void loadAll(); }, [loadAll]);
    useEffect(() => { if (!priority && priorities[0]) setPriority(priorities[0].id); }, [priority, priorities]);

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
                    priority,
                    status: statuses[0]?.id,
                    issueType: issueTypes[0]?.id,
                    date: dueDate ? dueDate : undefined,
                    description: description.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to create task");
            }

            toast.success("Task created");
            router.push(selectedProjectId ? `/tasks/backlog?projectId=${selectedProjectId}` : "/tasks/backlog");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to save task.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
                <Link href="/tasks/backlog" className="p-2 hover:bg-muted/70 rounded-lg text-foreground transition-colors border border-border bg-card shadow-none cursor-pointer">
                    <ArrowLeft size={15} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Create task</h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Add the information someone needs to start this task.</p>
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
                                placeholder="e.g. Implement webhook retry queue"
                                className="h-10 text-xs rounded-lg border border-border focus:border-primary font-medium px-3.5 bg-white transition-colors text-foreground shadow-none"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="font-semibold text-xs text-foreground px-0.5">Project *</Label>
                                    {projects.length === 0 && (
                                        <Link href="/projects/new" className="text-[11px] text-primary hover:underline font-semibold">
                                            + Create a project first
                                        </Link>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className={cn(
                                                "h-10 w-full flex items-center justify-between rounded-lg border px-3 bg-white hover:bg-background transition-colors text-foreground font-medium shadow-none text-xs cursor-pointer",
                                                !selectedProjectId ? "border-amber-300 text-muted-foreground" : "border-border"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Briefcase size={14} className={!activeProject ? "text-muted-foreground" : "text-primary"} />
                                                <span className={!activeProject ? "text-muted-foreground" : "text-foreground font-medium"}>
                                                    {activeProject ? activeProject.title : (projects.length === 0 ? "No projects" : "Select a project")}
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
                                    placeholder="Select a due date"
                                />
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label className="font-semibold text-xs text-foreground px-0.5">Priority</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                {priorities.map((p) => (
                                    <label key={p.id} className="cursor-pointer group">
                                        <input type="radio" name="priority" value={p.id} checked={priority === p.id} onChange={() => setPriority(p.id)} className="sr-only peer" />
                                        <div className="flex items-center justify-center p-2.5 text-xs font-medium rounded-lg border border-border peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-checked:font-semibold transition-colors hover:bg-muted/50 shadow-none">
                                            {p.name}
                                        </div>
                                    </label>
                                ))}
                                {isMasterLoading && <div className="col-span-full h-10 animate-pulse rounded-lg bg-muted" />}
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="description" className="font-semibold text-xs text-foreground px-0.5">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Add context, expected outcome, or useful notes."
                                className="min-h-[110px] rounded-lg border border-border focus:border-primary resize-none p-3.5 font-normal text-xs bg-white transition-colors text-foreground shadow-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex items-center justify-end gap-2.5">
                        <Button type="button" variant="outline" size="sm" onClick={() => router.back()} className="rounded-lg text-xs h-9 px-4 border-border cursor-pointer hover:bg-muted">Cancel</Button>
                        <Button type="submit" size="sm" disabled={isSubmitting || !priority || !statuses[0] || !issueTypes[0]} className="rounded-lg text-xs h-9 px-5 bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-colors cursor-pointer shadow-none">
                            {isSubmitting ? "Creating..." : "Create task"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
