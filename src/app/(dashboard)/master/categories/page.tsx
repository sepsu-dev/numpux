"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Plus,
    Trash,
    Check,
    PencilSimple,
    X,
    MagnifyingGlass,
} from "@phosphor-icons/react";
import { useMasterDataStore } from "@/stores/master-data-store";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export default function MasterCategoriesPage() {
    const {
        categories,
        loadCategories,
        addCategory,
        updateCategory,
        removeCategory,
    } = useMasterDataStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");

    useEffect(() => {
        loadCategories();
        const handleUpdate = () => loadCategories();
        window.addEventListener("numpux_master_data_updated", handleUpdate);
        return () => window.removeEventListener("numpux_master_data_updated", handleUpdate);
    }, [loadCategories]);

    const filteredCategories = useMemo(() => {
        return categories.filter((c) =>
            c.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [categories, searchQuery]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const success = addCategory(newCatName);
        if (success) {
            setNewCatName("");
            setIsCreateModalOpen(false);
        }
    };

    const handleRemove = (cat: string) => {
        removeCategory(cat);
    };

    const handleStartEdit = (idx: number, cat: string) => {
        setEditingIdx(idx);
        setEditValue(cat);
    };

    const handleSaveEdit = (idx: number) => {
        updateCategory(idx, editValue);
        setEditingIdx(null);
    };

    return (
        <div className="space-y-6">
            {/* Header matching Projects page */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Project Categories</h2>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            {filteredCategories.length} {filteredCategories.length === 1 ? "category" : "categories"}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                        Manage global classification tags used across project creation, filtering, and reporting.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-xs cursor-pointer"
                    >
                        <Plus size={14} className="stroke-[2.5]" />
                        <span>Create Category</span>
                    </button>
                </div>
            </div>

            {/* Search Bar matching Projects page */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 p-2.5 rounded-2xl border border-border/60">
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-1.5 text-xs bg-card border border-border rounded-xl focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>

            {/* Clean Table Container */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground uppercase font-bold text-[11px] tracking-wider">
                            <th className="py-3 px-5 w-16 text-center">#</th>
                            <th className="py-3 px-5">Category Name</th>
                            <th className="py-3 px-5 text-right pr-6 w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 bg-card">
                        {filteredCategories.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="py-12 text-center text-muted-foreground">
                                    No categories match your search.
                                </td>
                            </tr>
                        ) : (
                            filteredCategories.map((cat, idx) => (
                                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                    <td className="py-3 px-5 text-center font-mono text-muted-foreground">
                                        {idx + 1}
                                    </td>
                                    <td className="py-3 px-5">
                                        {editingIdx === idx ? (
                                            <div className="flex items-center gap-2 max-w-sm">
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleSaveEdit(idx);
                                                        if (e.key === "Escape") setEditingIdx(null);
                                                    }}
                                                    autoFocus
                                                    className="h-8 px-2.5 text-xs rounded-lg border border-primary bg-background focus:outline-none w-full"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveEdit(idx)}
                                                    className="h-8 px-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                                                    title="Simpan"
                                                >
                                                    <Check size={14} weight="bold" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingIdx(null)}
                                                    className="h-8 px-2.5 rounded-lg border border-border text-muted-foreground hover:bg-muted cursor-pointer"
                                                    title="Batal"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground text-sm">📁</span>
                                                <span className="font-semibold text-xs text-foreground">
                                                    {cat}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-5 text-right pr-6">
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(idx, cat)}
                                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                                                title="Edit category"
                                            >
                                                <PencilSimple size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(cat)}
                                                className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                                                title="Delete category"
                                            >
                                                <Trash size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Category Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground">
                            Create Project Category
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Category Name
                            </label>
                            <input
                                type="text"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                placeholder="e.g. Mobile Apps, Infrastructure..."
                                autoFocus
                                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <DialogFooter className="gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                            >
                                Save Category
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
