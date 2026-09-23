"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Plus, Trash, Check } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ManageCategoriesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: string[];
    onCategoriesChange: (categories: string[]) => void;
}

export function ManageCategoriesModal({
    open,
    onOpenChange,
    categories,
    onCategoriesChange,
}: ManageCategoriesModalProps) {
    const [newCategory, setNewCategory] = useState("");

    const handleAdd = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = newCategory.trim();
        if (!trimmed) return;

        if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
            toast.error(`Category "${trimmed}" already exists.`);
            return;
        }

        const updated = [...categories, trimmed];
        onCategoriesChange(updated);
        try {
            localStorage.setItem("numpux_master_categories", JSON.stringify(updated));
        } catch {}
        toast.success(`Category "${trimmed}" added!`);
        setNewCategory("");
    };

    const handleDelete = (cat: string) => {
        if (cat === "General") {
            toast.error("Category 'General' cannot be removed.");
            return;
        }
        const updated = categories.filter((c) => c !== cat);
        onCategoriesChange(updated);
        try {
            localStorage.setItem("numpux_master_categories", JSON.stringify(updated));
        } catch {}
        toast.success(`Category "${cat}" removed.`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 font-sans border-border bg-card overflow-hidden shadow-xl rounded-2xl">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-border/60">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <Tag size={15} weight="bold" />
                            </div>
                            <DialogTitle className="text-base font-bold text-foreground tracking-tight">
                                Master Categories
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Organize workspace categories to categorize and filter initiatives effortlessly.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Add Category Form */}
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <Input
                            placeholder="Enter new category (e.g. Mobile, DevOps, AI)..."
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="h-9 text-xs rounded-xl bg-background/50 border-border focus:border-primary flex-1 font-medium"
                        />
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!newCategory.trim()}
                            className="h-9 px-3.5 rounded-xl text-xs bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all shrink-0 cursor-pointer"
                        >
                            <Plus size={13} className="mr-1 stroke-[2.5]" />
                            Add
                        </Button>
                    </form>

                    {/* Existing Categories List */}
                    <div className="space-y-1.5 pt-2">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Current Categories ({categories.length})
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                            {categories.map((cat) => (
                                <div
                                    key={cat}
                                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border border-border/60 group hover:border-border transition-colors text-xs"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="w-2 h-2 rounded-full bg-primary/60 shrink-0" />
                                        <span className="font-semibold text-foreground truncate">{cat}</span>
                                        {cat === "General" && (
                                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    {cat !== "General" && (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(cat)}
                                            className="text-muted-foreground hover:text-rose-600 p-1 rounded-md opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                                            title={`Delete category "${cat}"`}
                                        >
                                            <Trash size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-end">
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl text-xs h-8 px-4 bg-foreground text-background font-semibold hover:opacity-90 transition-all cursor-pointer"
                    >
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
