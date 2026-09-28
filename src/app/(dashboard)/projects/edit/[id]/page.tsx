"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import type { Project } from "@/types";
import { apiFetch } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function EditProjectPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        setLoadError(null);
        apiFetch(`/api/projects/${id}`)
            .then((res) => { if (!res.ok) throw new Error("Project request failed"); return res.json(); })
            .then((res) => {
                if (res.data) setProject(res.data);
            })
            .catch(() => setLoadError("Project details could not be loaded."))
            .finally(() => setIsLoading(false));
    }, [id, reloadKey]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const category = formData.get("category") as string;
        const status = formData.get("status") as "Active" | "Planning" | "Completed";
        const description = formData.get("description") as string;

        setIsSaving(true);
        try {
            const res = await apiFetch(`/api/projects/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, category, status, description }),
            });
            if (!res.ok) throw new Error("Failed to save");
            toast.success(`Project "${title}" updated successfully!`);
            router.push("/projects");
            router.refresh();
        } catch {
            toast.error("Failed to update project.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-3xl space-y-6" aria-label="Loading project details">
                <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-3.5 w-72" /></div>
                <div className="space-y-5 rounded-xl border border-border/60 bg-white p-6 sm:p-8">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                </div>
            </div>
        );
    }

    if (loadError || !project) {
        return <LoadFailure message={loadError || "Project not found."} onRetry={() => setReloadKey((key) => key + 1)} />;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-3xl">
            <div className="flex items-center gap-3">
                <Link href="/projects" className="p-2 hover:bg-muted/70 rounded-xl text-foreground transition-all border border-border bg-card active:scale-95 shadow-2xs">
                    <ArrowLeft size={15} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Edit Project</h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Adjust initiative milestones, scope, and objectives.</p>
                </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-2xs">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                        <div className="grid gap-1.5">
                            <Label htmlFor="p-title" className="font-semibold text-xs text-foreground px-0.5">Project Name *</Label>
                            <Input
                                id="p-title"
                                name="title"
                                defaultValue={project?.title || ""}
                                className="h-10 text-xs rounded-xl border border-border focus:border-primary font-medium text-foreground px-3.5 bg-background/50 shadow-2xs"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="p-status" className="font-semibold text-xs text-foreground px-0.5">Status</Label>
                                <input type="hidden" name="status" value={project?.status || "Active"} />
                                <Select
                                    value={project?.status || "Active"}
                                    onValueChange={(val: any) => setProject((prev) => prev ? { ...prev, status: val } : null)}
                                >
                                    <SelectTrigger className="h-10 w-full rounded-xl border border-border bg-background/50 px-3 text-xs font-medium text-foreground shadow-2xs">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        <SelectItem value="Active" className="text-xs cursor-pointer">Active</SelectItem>
                                        <SelectItem value="Planning" className="text-xs cursor-pointer">Planning</SelectItem>
                                        <SelectItem value="Completed" className="text-xs cursor-pointer">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="p-category" className="font-semibold text-xs text-foreground px-0.5">Category</Label>
                                <Input
                                    id="p-category"
                                    name="category"
                                    defaultValue={project?.category || ""}
                                    className="h-10 text-xs rounded-xl border border-border focus:border-primary font-medium text-foreground px-3.5 bg-background/50 shadow-2xs"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="p-desc" className="font-semibold text-xs text-foreground px-0.5">Description & Objectives</Label>
                            <Textarea
                                id="p-desc"
                                name="description"
                                defaultValue={project?.description || ""}
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

function LoadFailure({ message, onRetry }: { message: string; onRetry: () => void }) {
    return <div className="flex min-h-64 max-w-3xl items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 text-center"><div><p className="text-sm font-medium text-foreground">{message}</p><p className="mt-1 text-xs text-muted-foreground">Check the project or try loading it again.</p><button type="button" onClick={onRetry} className="mt-4 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted">Try again</button></div></div>;
}
