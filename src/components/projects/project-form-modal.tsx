"use client";

import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Project } from "@/types";
import { apiFetch } from "@/lib/api-client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CaretDown, Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ProjectFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project?: Project | null; // If provided, edit mode
    categories?: string[];
    onSuccess: (project: Project, isEdit: boolean) => void;
}

export function ProjectFormModal({
    open,
    onOpenChange,
    project,
    categories = ["General", "System", "Web", "Product", "Design", "Mobile", "Backend"],
    onSuccess,
}: ProjectFormModalProps) {
    const isEdit = !!project;

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("General");
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (project) {
            setTitle(project.title || "");
            setCategory(project.category || "General");
            setDescription(project.description || "");
            setIsCustomCategory(!categories.includes(project.category || "General"));
        } else {
            setTitle("");
            setCategory("General");
            setDescription("");
            setIsCustomCategory(false);
        }
    }, [project, open, categories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Project name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const endpoint = isEdit ? `/api/projects/${project.id}` : "/api/projects";
            const method = isEdit ? "PUT" : "POST";

            const payload: any = {
                title: title.trim(),
                category: category.trim() || "General",
                description: description.trim(),
                status: project?.status || "Active",
            };

            const res = await apiFetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to ${isEdit ? "update" : "create"} project`);
            }

            const resData = await res.json();
            const savedProject = resData.data || {
                ...payload,
                id: project?.id || Date.now().toString(),
                tasks: project?.tasks || 0,
                progress: project?.progress || 0,
            };

            toast.success(isEdit ? "Project updated successfully" : "Project created successfully");
            onSuccess(savedProject, isEdit);
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to save project");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col h-full bg-card border-l border-border shadow-2xl">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-border/60">
                        <SheetHeader className="p-0">
                            <SheetTitle className="text-lg font-bold text-foreground tracking-tight">
                                {isEdit ? "Edit Project" : "New Project"}
                            </SheetTitle>
                            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                                {isEdit
                                    ? "Update workspace title, category, and description."
                                    : "Create a new project workspace for your team deliverables."}
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                        <div className="space-y-1.5">
                            <Label htmlFor="proj-modal-title" className="text-xs font-semibold text-foreground">
                                Project Name <span className="text-primary">*</span>
                            </Label>
                            <Input
                                id="proj-modal-title"
                                placeholder="e.g. Mobile App Redesign"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-10 text-xs rounded-xl bg-background/50 border-border focus:border-primary transition-all font-medium"
                                autoFocus
                                required
                            />
                        </div>

                        {/* Master Category Selector */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="proj-modal-cat" className="text-xs font-semibold text-foreground">
                                    Category
                                </Label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCustomCategory(!isCustomCategory);
                                        if (isCustomCategory && !categories.includes(category)) {
                                            setCategory("General");
                                        }
                                    }}
                                    className="text-[11px] text-primary hover:underline cursor-pointer"
                                >
                                    {isCustomCategory ? "Select from list" : "+ Custom category"}
                                </button>
                            </div>

                            {isCustomCategory ? (
                                <Input
                                    id="proj-modal-cat"
                                    placeholder="Type custom category name..."
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="h-10 text-xs rounded-xl bg-background/50 border-border focus:border-primary transition-all font-medium"
                                />
                            ) : (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="w-full h-10 px-3 flex items-center justify-between text-xs rounded-xl bg-background/50 border border-border hover:border-primary/60 transition-colors font-medium cursor-pointer"
                                        >
                                            <span>{category || "Select category"}</span>
                                            <CaretDown size={14} className="opacity-60" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] p-1 text-xs">
                                        {categories.map((cat) => (
                                            <DropdownMenuItem
                                                key={cat}
                                                onClick={() => setCategory(cat)}
                                                className={cn(
                                                    "cursor-pointer flex items-center justify-between py-2 rounded-lg",
                                                    category === cat && "bg-primary/10 text-primary font-semibold"
                                                )}
                                            >
                                                <span>{cat}</span>
                                                {category === cat && <Check size={14} className="text-primary" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="proj-modal-desc" className="text-xs font-semibold text-foreground">
                                Scope & Description
                            </Label>
                            <Textarea
                                id="proj-modal-desc"
                                placeholder="Short summary about key deliverables and objectives..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[90px] text-xs rounded-xl bg-background/50 border-border focus:border-primary transition-all font-normal resize-none"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl text-xs h-9 px-4 border-border cursor-pointer hover:bg-muted"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting}
                            className="rounded-xl text-xs h-9 px-5 bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-xs"
                        >
                            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Project"}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
