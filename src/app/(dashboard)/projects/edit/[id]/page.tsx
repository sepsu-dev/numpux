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
import { useMasterDataStore } from "@/stores/master-data-store";
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
    const [isSaving, setIsSaving] = useState(false);
    const { categories, projectStatuses, loadAll } = useMasterDataStore();

    useEffect(() => { void loadAll(); }, [loadAll]);

    useEffect(() => {
        if (!id) return;
        apiFetch(`/api/projects/${id}`)
            .then((res) => res.json())
            .then((res) => {
                if (res.data) setProject(res.data);
            })
            .catch(() => { })
            .finally(() => setIsLoading(false));
    }, [id]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const category = formData.get("category") as string;
        const status = formData.get("status") as string;
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
            <div className="py-20 text-center text-muted-foreground text-sm font-medium">
                Loading project details...
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
                <Link href="/projects" className="p-2 hover:bg-muted/70 rounded-lg text-foreground transition-colors border border-border bg-card shadow-none">
                    <ArrowLeft size={15} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Edit project</h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Update the project name, status, category, and description.</p>
                </div>
            </div>

            <div className="bg-card border border-border/80 rounded-lg p-6 sm:p-8 shadow-none">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                        <div className="grid gap-1.5">
                            <Label htmlFor="p-title" className="font-semibold text-xs text-foreground px-0.5">Project Name *</Label>
                            <Input
                                id="p-title"
                                name="title"
                                defaultValue={project?.title || ""}
                                className="h-10 text-xs rounded-lg border border-border focus:border-primary font-medium text-foreground px-3.5 bg-white shadow-none"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="p-status" className="font-semibold text-xs text-foreground px-0.5">Status</Label>
                                <input type="hidden" name="status" value={project?.status || projectStatuses[0]?.id || ""} />
                                <Select
                                    value={project?.status || projectStatuses[0]?.id || ""}
                                    onValueChange={(val: any) => setProject((prev) => prev ? { ...prev, status: val } : null)}
                                >
                                    <SelectTrigger className="h-10 w-full rounded-lg border border-border bg-white px-3 text-xs font-medium text-foreground shadow-none">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        {projectStatuses.map((item) => <SelectItem key={item.id} value={item.id} className="text-xs cursor-pointer">{item.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="p-category" className="font-semibold text-xs text-foreground px-0.5">Category</Label>
                                <select
                                    id="p-category"
                                    name="category"
                                    value={project?.category || ""}
                                    onChange={(event) => setProject((prev) => prev ? { ...prev, category: event.target.value } : null)}
                                    className="h-10 text-xs rounded-lg border border-border focus:border-primary font-medium text-foreground px-3.5 bg-white shadow-none"
                                    required
                                ><option value="" disabled>Select category</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="p-desc" className="font-semibold text-xs text-foreground px-0.5">Description</Label>
                            <Textarea
                                id="p-desc"
                                name="description"
                                defaultValue={project?.description || ""}
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
