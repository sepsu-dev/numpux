"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Plus,
    Trash,
    MagnifyingGlass,
    X,
} from "@phosphor-icons/react";
import { type MasterPriorityItem } from "@/lib/master-data";
import { useMasterDataStore } from "@/stores/master-data-store";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const AVAILABLE_DOTS = [
    { label: "Slate (Low)", color: "bg-slate-400", badge: "bg-slate-50 text-slate-600 border-slate-200/80 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800" },
    { label: "Sky (Medium)", color: "bg-sky-500", badge: "bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40" },
    { label: "Amber (High)", color: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40" },
    { label: "Rose (Urgent)", color: "bg-rose-500", badge: "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40" },
    { label: "Purple (Critical)", color: "bg-purple-500", badge: "bg-purple-50 text-purple-700 border-purple-200/70 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40" },
];

export default function MasterPrioritiesPage() {
    const { priorities, loadPriorities, addPriority, removePriority } = useMasterDataStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [level, setLevel] = useState(1);
    const [dotColorIdx, setDotColorIdx] = useState(0);

    useEffect(() => {
        loadPriorities();
        const handleUpdate = () => loadPriorities();
        window.addEventListener("numpux_master_data_updated", handleUpdate);
        return () => window.removeEventListener("numpux_master_data_updated", handleUpdate);
    }, [loadPriorities]);

    const filteredPriorities = useMemo(() => {
        return priorities.filter((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [priorities, searchQuery]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        const selectedPreset = AVAILABLE_DOTS[dotColorIdx];
        const newItem: MasterPriorityItem = {
            id: trimmed,
            name: trimmed,
            level: Number(level),
            dotColor: selectedPreset.color,
            badgeClass: selectedPreset.badge,
        };

        const success = addPriority(newItem);
        if (success) {
            setName("");
            setIsCreateModalOpen(false);
        }
    };

    const handleRemove = (id: string) => {
        removePriority(id);
    };

    return (
        <div className="space-y-6">
            {/* Header matching Projects page */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Priorities</h2>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            {filteredPriorities.length} {filteredPriorities.length === 1 ? "level" : "levels"}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                        Configure task priority levels, urgency badges, and sorting indicators.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-xs cursor-pointer"
                    >
                        <Plus size={14} className="stroke-[2.5]" />
                        <span>Create Priority</span>
                    </button>
                </div>
            </div>

            {/* Search Bar matching Projects page */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 p-2.5 rounded-2xl border border-border/60">
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} />
                    <input
                        type="text"
                        placeholder="Search priorities..."
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
                            <th className="py-3 px-5">Priority Level & Badge</th>
                            <th className="py-3 px-5 text-center w-28">Severity</th>
                            <th className="py-3 px-5 text-right pr-6 w-28">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 bg-card">
                        {filteredPriorities.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="py-12 text-center text-muted-foreground">
                                    No priorities match your search.
                                </td>
                            </tr>
                        ) : (
                            filteredPriorities.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="py-3.5 px-5">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-3 h-3 rounded-full ${item.dotColor} shrink-0 ring-2 ring-background`} />
                                            <span className="font-semibold text-xs text-foreground">
                                                {item.name}
                                            </span>
                                            {item.isDefault && (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-5 text-center">
                                        <span
                                            className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${item.badgeClass}`}
                                        >
                                            Level {item.level}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-5 text-right pr-6">
                                        {!item.isDefault ? (
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(item.id)}
                                                className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                                                title="Delete priority"
                                            >
                                                <Trash size={14} />
                                            </button>
                                        ) : (
                                            <span className="text-[11px] text-muted-foreground/60 italic">System</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Priority Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground">
                            Create Priority
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Priority Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Blocker, Critical..."
                                autoFocus
                                required
                                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    Severity Level (1-5)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={level}
                                    onChange={(e) => setLevel(Number(e.target.value))}
                                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    Color Tag
                                </label>
                                <Select
                                    value={String(dotColorIdx)}
                                    onValueChange={(val) => setDotColorIdx(Number(val))}
                                >
                                    <SelectTrigger className="h-9 w-full text-xs rounded-xl bg-background border-border">
                                        <SelectValue placeholder="Select Color" />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        {AVAILABLE_DOTS.map((d, idx) => (
                                            <SelectItem key={idx} value={String(idx)} className="text-xs cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${d.color}`} />
                                                    <span>{d.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 pt-2">
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
                                Save Priority
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
