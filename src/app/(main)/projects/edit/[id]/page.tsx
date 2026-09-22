"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import type { Project } from "@/lib/types";

export default function EditProjectPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/projects/${id}`)
            .then((res) => res.json())
            .then((res) => {
                if (res.data) setProject(res.data);
            })
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, [id]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const category = formData.get("category") as string;
        const status = formData.get("status") as "Aktif" | "Perencanaan" | "Selesai";
        const description = formData.get("description") as string;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/projects/${id}`, {
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
            <div className="py-20 text-center text-muted-foreground text-sm font-medium">
                Loading project details...
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Link href="/projects" className="p-2 hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-foreground transition-colors border border-border/40 cursor-pointer">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tighter">Edit Project</h2>
                    <p className="text-muted-foreground font-medium text-xs">Adjust initiative milestones, scope, and objectives.</p>
                </div>
            </div>

            <div className="bg-white border border-border/60 rounded-lg p-10 shadow-sm max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="p-title" className="font-semibold text-xs text-foreground">Project Name</Label>
                            <Input
                                id="p-title"
                                name="title"
                                defaultValue={project?.title || ""}
                                className="h-11 text-sm rounded-lg border border-border focus:border-primary font-medium text-foreground px-3.5"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="p-status" className="font-semibold text-xs text-foreground">Status</Label>
                                <select
                                    id="p-status"
                                    name="status"
                                    defaultValue={project?.status || "Aktif"}
                                    className="h-11 w-full rounded-lg border border-border bg-transparent px-3 text-sm focus:border-primary focus:outline-none font-medium text-foreground cursor-pointer"
                                >
                                    <option value="Aktif">Active</option>
                                    <option value="Perencanaan">Planning</option>
                                    <option value="Selesai">Completed</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="p-category" className="font-semibold text-xs text-foreground">Category</Label>
                                <Input
                                    id="p-category"
                                    name="category"
                                    defaultValue={project?.category || ""}
                                    className="h-11 text-sm rounded-lg border border-border focus:border-primary font-medium text-foreground px-3.5"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="p-desc" className="font-semibold text-xs text-foreground">Description & Objectives</Label>
                            <Textarea
                                id="p-desc"
                                name="description"
                                defaultValue={project?.description || ""}
                                className="min-h-[120px] rounded-lg border border-border focus:border-primary resize-none p-3.5 font-normal text-sm text-foreground"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border/60 flex items-center justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => router.back()} className="font-medium text-muted-foreground text-sm cursor-pointer">Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary text-primary-foreground font-semibold px-8 h-11 rounded-lg shadow-sm hover:shadow-none transition-all text-sm cursor-pointer">
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}