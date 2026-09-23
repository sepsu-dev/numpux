"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

export default function NewProjectPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const category = (formData.get("category") as string) || "General";
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
                    status: "Active",
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Project created successfully!");
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-3xl">
            <div className="flex items-center gap-3">
                <Link href="/projects" className="p-2 hover:bg-muted/70 rounded-xl text-foreground transition-all border border-border bg-card active:scale-95 shadow-2xs">
                    <ArrowLeft size={15} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Create Project</h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Plan and organize your team's initiatives and sprints.</p>
                </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-2xs">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                        <div className="grid gap-1.5">
                            <Label htmlFor="title" className="font-semibold text-xs text-foreground px-0.5">Project Name *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="e.g. Mobile App Redesign"
                                className="h-10 text-xs rounded-xl border border-border focus:border-primary font-medium px-3.5 bg-background/50 transition-all text-foreground shadow-2xs"
                                required
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="category" className="font-semibold text-xs text-foreground px-0.5">Category</Label>
                            <Input
                                id="category"
                                name="category"
                                placeholder="e.g. Product & Tech, Client Work, Operations..."
                                className="h-10 rounded-xl border border-border focus:border-primary font-medium px-3.5 bg-background/50 transition-all text-foreground shadow-2xs text-xs"
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="description" className="font-semibold text-xs text-foreground px-0.5">Description & Objectives</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Key goals, deliverables, and milestones for this project..."
                                className="min-h-[110px] rounded-xl border border-border focus:border-primary resize-none p-3.5 font-normal text-xs bg-background/50 transition-all text-foreground shadow-2xs"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex items-center justify-end gap-2.5">
                        <Button type="button" variant="outline" size="sm" onClick={() => router.back()} className="rounded-xl text-xs h-9 px-4 border-border cursor-pointer hover:bg-muted">Cancel</Button>
                        <Button type="submit" size="sm" disabled={isSubmitting} className="rounded-xl text-xs h-9 px-5 bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-xs">
                            {isSubmitting ? "Creating..." : "Create Project"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
