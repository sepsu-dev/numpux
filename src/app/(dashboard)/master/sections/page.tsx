"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Rows,
    Plus,
    Trash,
    ArrowClockwise,
    MagnifyingGlass,
    X,
    CaretUp,
    CaretDown,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { usePrivilegesStore } from "@/stores/privileges-store";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function MasterSectionsPage() {
    const {
        sections,
        menus,
        isLoading,
        loadAllPrivileges,
        addSection,
        updateSection,
        removeSection,
        reorderSections,
    } = usePrivilegesStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSectionName, setNewSectionName] = useState("");

    useEffect(() => {
        loadAllPrivileges();
        const handleUpdate = () => loadAllPrivileges();
        window.addEventListener("numpux_master_data_updated", handleUpdate);
        return () => window.removeEventListener("numpux_master_data_updated", handleUpdate);
    }, [loadAllPrivileges]);

    const filteredSections = useMemo(() => {
        return sections.filter((s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [sections, searchQuery]);

    const handleCreateSection = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newSectionName.trim();
        if (!name) return;

        const success = await addSection(name);
        if (success) {
            setNewSectionName("");
            setIsCreateModalOpen(false);
        }
    };

    const handleRenameSection = async (id: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        await updateSection(id, trimmed);
    };

    const handleDeleteSection = async (id: string, name: string) => {
        if (
            confirm(
                `Yakin ingin menghapus section "${name}"? Menu yang terdaftar di section ini akan otomatis dipindahkan ke "General".`
            )
        ) {
            await removeSection(id);
        }
    };

    const handleMoveSection = async (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;
        const copy = [...sections];
        const [moved] = copy.splice(index, 1);
        copy.splice(targetIndex, 0, moved);

        const ok = await reorderSections(copy);
        if (ok) {
            toast.success(`Section "${moved.name}" moved ${direction}!`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header matching Projects page */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Master Sections</h2>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            {filteredSections.length} {filteredSections.length === 1 ? "section" : "sections"}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                        Kelola grup / section header pada sidebar navigation secara fleksibel dan dinamis.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-xs cursor-pointer"
                    >
                        <Plus size={14} className="stroke-[2.5]" />
                        <span>Add Section</span>
                    </button>
                    <button
                        onClick={loadAllPrivileges}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-muted/60 hover:bg-muted text-foreground rounded-xl text-xs font-semibold border border-border/60 hover:border-border transition-all cursor-pointer disabled:opacity-50"
                        title="Refresh Data"
                    >
                        <ArrowClockwise size={14} className={isLoading ? "animate-spin" : ""} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Search Bar matching Projects page */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 p-2.5 rounded-2xl border border-border/60">
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} />
                    <input
                        type="text"
                        placeholder="Search section name..."
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
                            <th className="py-3 px-4 w-12 text-center">#</th>
                            <th className="py-3 px-4">Section Name</th>
                            <th className="py-3 px-4 hidden sm:table-cell">Associated Menus</th>
                            <th className="py-3 px-4 text-center w-28">Order</th>
                            <th className="py-3 px-4 text-right pr-6 w-16">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 bg-card">
                        {isLoading && sections.length === 0 ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="py-3 px-4 text-center">
                                        <Skeleton className="h-4 w-4 mx-auto rounded" />
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2.5">
                                            <Skeleton className="h-4 w-4 rounded" />
                                            <Skeleton className="h-4 w-28 rounded" />
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 hidden sm:table-cell">
                                        <Skeleton className="h-5 w-16 rounded-md" />
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Skeleton className="h-4 w-12 mx-auto rounded" />
                                    </td>
                                    <td className="py-3 px-4 text-right pr-6">
                                        <Skeleton className="h-6 w-6 ml-auto rounded-md" />
                                    </td>
                                </tr>
                            ))
                        ) : filteredSections.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                    No sections found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredSections.map((sec, idx) => {
                                const menuCount = menus.filter(
                                    (m) => (m.section || "Planning").toLowerCase() === sec.name.toLowerCase()
                                ).length;

                                return (
                                    <tr key={sec.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                                            {idx + 1}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-muted-foreground text-sm select-none">🗂️</span>
                                                <input
                                                    type="text"
                                                    value={sec.name}
                                                    onChange={(e) => handleRenameSection(sec.id, e.target.value)}
                                                    className="font-semibold text-xs text-foreground bg-transparent border border-transparent hover:border-border focus:border-primary focus:bg-background rounded-lg px-2 py-1 transition-all outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 hidden sm:table-cell">
                                            <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40 font-medium">
                                                {menuCount} {menuCount === 1 ? "menu" : "menus"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    disabled={idx === 0}
                                                    onClick={() => handleMoveSection(idx, "up")}
                                                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                                    title="Move Up"
                                                >
                                                    <CaretUp size={14} weight="bold" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={idx === sections.length - 1}
                                                    onClick={() => handleMoveSection(idx, "down")}
                                                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                                    title="Move Down"
                                                >
                                                    <CaretDown size={14} weight="bold" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right pr-6">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSection(sec.id, sec.name)}
                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                                                title="Delete Section"
                                            >
                                                <Trash size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Section Dialog */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-2xl bg-card border border-border p-6 shadow-xl">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                            Add Master Section
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground">
                            Tambah section baru untuk mengelompokkan menu pada sidebar.
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleCreateSection} className="space-y-4 pt-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                Section Name <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Analytics, Management, System"
                                value={newSectionName}
                                onChange={(e) => setNewSectionName(e.target.value)}
                                required
                                className="w-full px-3 py-2 text-xs bg-muted/30 border border-border rounded-xl focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                            />
                        </div>

                        <DialogFooter className="pt-3 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted rounded-xl transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!newSectionName.trim()}
                                className="px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                Create Section
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
