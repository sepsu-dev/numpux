"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useMasterDataStore } from "@/stores/master-data-store";

export default function NewProjectPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [category, setCategory] = useState("");
    const { categories, loadAll, isLoading } = useMasterDataStore();

    useEffect(() => { void loadAll(); }, [loadAll]);
    useEffect(() => {
        if (!category && categories[0]) setCategory(categories[0]);
    }, [category, categories]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const description = (formData.get("description") as string) || "";

        if (!title.trim()) {
            toast.error("Project title is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await apiFetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    category: category.trim(),
                    description: description.trim(),
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Project created");
                router.push("/projects");
                router.refresh();
            } else {
                toast.error(data.message || "Failed to create project");
            }
        } catch {
            toast.error("An error occurred while creating project");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
                <Link href="/projects" className="p-2 hover:bg-muted/70 rounded-lg text-foreground transition-colors border border-border bg-card shadow-none">
                    <ArrowLeft size={15} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Create project</h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Create a clear home for related tasks, owners, and dates.</p>
                </div>
            </div>

            <div className="bg-card border border-border/80 rounded-lg p-6 sm:p-8 shadow-none">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                        <div className="grid gap-1.5">
                            <Label htmlFor="title" className="font-semibold text-xs text-foreground px-0.5">Project Name *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="e.g. Mobile App Redesign"
                                className="h-10 text-xs rounded-lg border border-border focus:border-primary font-medium px-3.5 bg-white transition-colors text-foreground shadow-none"
                                required
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="category" className="font-semibold text-xs text-foreground px-0.5">Category</Label>
                            <select
                                id="category"
                                name="category"
                                value={category}
                                onChange={(event) => setCategory(event.target.value)}
                                className="h-10 rounded-lg border border-border focus:border-primary font-medium px-3.5 bg-white transition-colors text-foreground shadow-none text-xs"
                            ><option value="" disabled>Select category</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="description" className="font-semibold text-xs text-foreground px-0.5">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="What is this project for?"
                                className="min-h-[110px] rounded-lg border border-border focus:border-primary resize-none p-3.5 font-normal text-xs bg-white transition-colors text-foreground shadow-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex items-center justify-end gap-2.5">
                        <Button type="button" variant="outline" size="sm" onClick={() => router.back()} className="rounded-lg text-xs h-9 px-4 border-border cursor-pointer hover:bg-muted">Cancel</Button>
                        <Button type="submit" size="sm" disabled={isSubmitting || isLoading || !category} className="rounded-lg text-xs h-9 px-5 bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-colors cursor-pointer shadow-none">
                            {isSubmitting ? "Creating..." : "Create project"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
