"use client";

import { useState, useEffect, useMemo } from "react";
import {
    CheckSquare,
    Bug,
    BookmarkSimple,
    Lightning,
    Shield,
    Fire,
    Rocket,
    Plus,
    Trash,
    MagnifyingGlass,
    X,
} from "@phosphor-icons/react";
import { type MasterIssueTypeItem } from "@/lib/master-data";
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

const AVAILABLE_ICONS = [
    { name: "CheckSquare", icon: CheckSquare, label: "Task Check" },
    { name: "Bug", icon: Bug, label: "Bug Defect" },
    { name: "BookmarkSimple", icon: BookmarkSimple, label: "Story Bookmark" },
    { name: "Lightning", icon: Lightning, label: "Improvement Lightning" },
    { name: "Shield", icon: Shield, label: "Security Shield" },
    { name: "Fire", icon: Fire, label: "Hotfix Fire" },
    { name: "Rocket", icon: Rocket, label: "Release Rocket" },
] as const;

const AVAILABLE_COLORS = [
    { label: "Blue", class: "text-blue-500 bg-blue-500/10 border-blue-200/50 dark:border-blue-900/50" },
    { label: "Rose", class: "text-rose-500 bg-rose-500/10 border-rose-200/50 dark:border-rose-900/50" },
    { label: "Emerald", class: "text-emerald-500 bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-900/50" },
    { label: "Purple", class: "text-purple-500 bg-purple-500/10 border-purple-200/50 dark:border-purple-900/50" },
    { label: "Amber", class: "text-amber-500 bg-amber-500/10 border-amber-200/50 dark:border-amber-900/50" },
    { label: "Cyan", class: "text-cyan-500 bg-cyan-500/10 border-cyan-200/50 dark:border-cyan-900/50" },
];

export default function MasterIssueTypesPage() {
    const { issueTypes, loadIssueTypes, addIssueType, removeIssueType } = useMasterDataStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [selectedIcon, setSelectedIcon] = useState<(typeof AVAILABLE_ICONS)[number]["name"]>("CheckSquare");
    const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0].class);

    useEffect(() => {
        loadIssueTypes();
        const handleUpdate = () => loadIssueTypes();
        window.addEventListener("numpux_master_data_updated", handleUpdate);
        return () => window.removeEventListener("numpux_master_data_updated", handleUpdate);
    }, [loadIssueTypes]);

    const filteredIssueTypes = useMemo(() => {
        return issueTypes.filter((t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [issueTypes, searchQuery]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        const newItem: MasterIssueTypeItem = {
            id: trimmed,
            name: trimmed,
            description: desc.trim() || undefined,
            iconName: selectedIcon,
            colorClass: selectedColor,
        };

        const success = addIssueType(newItem);
        if (success) {
            setName("");
            setDesc("");
            setIsCreateModalOpen(false);
        }
    };

    const handleRemove = (id: string) => {
        removeIssueType(id);
    };

    return (
        <div className="space-y-6">
            {/* Header matching Projects page */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Issue Types</h2>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            {filteredIssueTypes.length} {filteredIssueTypes.length === 1 ? "type" : "types"}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                        Configure tracker issue items, badges, and icons used across Kanban boards and backlogs.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-xs cursor-pointer"
                    >
                        <Plus size={14} className="stroke-[2.5]" />
                        <span>Create Issue Type</span>
                    </button>
                </div>
            </div>

            {/* Search Bar matching Projects page */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 p-2.5 rounded-2xl border border-border/60">
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} />
                    <input
                        type="text"
                        placeholder="Search issue types..."
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
                            <th className="py-3 px-5">Issue Type</th>
                            <th className="py-3 px-5 hidden sm:table-cell">Description</th>
                            <th className="py-3 px-5 text-right pr-6 w-28">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 bg-card">
                        {filteredIssueTypes.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="py-12 text-center text-muted-foreground">
                                    No issue types match your search.
                                </td>
                            </tr>
                        ) : (
                            filteredIssueTypes.map((type) => {
                                const IconComponent =
                                    AVAILABLE_ICONS.find((i) => i.name === type.iconName)?.icon || CheckSquare;

                                return (
                                    <tr key={type.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="py-3.5 px-5">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-2xs ${type.colorClass}`}
                                                >
                                                    <IconComponent className="w-4 h-4" weight="duotone" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-xs text-foreground">
                                                        {type.name}
                                                    </span>
                                                    {type.isDefault && (
                                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-5 hidden sm:table-cell text-muted-foreground">
                                            {type.description || "-"}
                                        </td>
                                        <td className="py-3.5 px-5 text-right pr-6">
                                            {!type.isDefault ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemove(type.id)}
                                                    className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                                                    title="Delete issue type"
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground/60 italic">System</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Issue Type Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground">
                            Create Issue Type
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Type Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Hotfix, Defect, Improvement..."
                                autoFocus
                                required
                                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Description
                            </label>
                            <input
                                type="text"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                placeholder="Short explanation of what this item represents..."
                                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    Icon
                                </label>
                                <Select
                                    value={selectedIcon}
                                    onValueChange={(val) => setSelectedIcon(val as any)}
                                >
                                    <SelectTrigger className="h-9 w-full text-xs rounded-xl bg-background border-border">
                                        <SelectValue placeholder="Select Icon" />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        {AVAILABLE_ICONS.map((i) => {
                                            const IconComp = i.icon;
                                            return (
                                                <SelectItem key={i.name} value={i.name} className="text-xs cursor-pointer">
                                                    <div className="flex items-center gap-2">
                                                        <IconComp size={13} />
                                                        <span>{i.label}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    Color Badge
                                </label>
                                <Select
                                    value={selectedColor}
                                    onValueChange={setSelectedColor}
                                >
                                    <SelectTrigger className="h-9 w-full text-xs rounded-xl bg-background border-border">
                                        <SelectValue placeholder="Select Color" />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        {AVAILABLE_COLORS.map((c) => (
                                            <SelectItem key={c.label} value={c.class} className="text-xs cursor-pointer">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${c.class}`}>
                                                    {c.label}
                                                </span>
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
                                Save Issue Type
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
