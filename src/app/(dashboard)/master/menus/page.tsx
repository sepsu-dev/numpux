"use client";

import { useState, useEffect, useMemo } from "react";
import {
    ListNumbers,
    MagnifyingGlass,
    X,
    CaretUp,
    CaretDown,
    ArrowClockwise,
    Plus,
    Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MasterMenu } from "@/types";
import { usePrivilegesStore } from "@/stores/privileges-store";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function MasterMenusPage() {
    const { menus: dbMenus, sections: dbSections, isLoading, loadAllPrivileges, updateMenu, reorderMenus, addMenu, removeMenu } = usePrivilegesStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSection, setSelectedSection] = useState<string>("All");
    const [isCreateMenuModalOpen, setIsCreateMenuModalOpen] = useState(false);
    const [newMenuName, setNewMenuName] = useState("");
    const [newMenuPath, setNewMenuPath] = useState("");
    const [newMenuSection, setNewMenuSection] = useState("Planning");
    const [newMenuIcon, setNewMenuIcon] = useState("SquaresFour");
    const [newMenuParentId, setNewMenuParentId] = useState<string>("");

    useEffect(() => {
        loadAllPrivileges();
        const handleUpdate = () => loadAllPrivileges();
        window.addEventListener("numpux_master_data_updated", handleUpdate);
        return () => window.removeEventListener("numpux_master_data_updated", handleUpdate);
    }, [loadAllPrivileges]);

    // Parent candidates are menus that are not submenus themselves (top-level menus)
    const parentCandidates = useMemo(() => {
        return dbMenus.filter((m) => !m.parentId);
    }, [dbMenus]);

    const sections = useMemo(() => {
        const set = new Set<string>(["All"]);
        dbSections.forEach((s) => set.add(s.name));
        dbMenus.forEach((m) => {
            if (m.section) set.add(m.section);
        });
        return Array.from(set);
    }, [dbMenus, dbSections]);

    const filteredMenus = useMemo(() => {
        return dbMenus.filter((m) => {
            const matchesSearch =
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.path.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSection =
                selectedSection === "All" || m.section === selectedSection;
            return matchesSearch && matchesSection;
        });
    }, [dbMenus, searchQuery, selectedSection]);

    const handleCreateMenu = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newMenuName.trim();
        let path = newMenuPath.trim();
        if (!name || !path) return;
        if (!path.startsWith("/")) path = "/" + path;

        const success = await addMenu({
            name,
            path,
            section: newMenuSection,
            icon: newMenuIcon,
            parentId: newMenuParentId ? newMenuParentId : null,
        });

        if (success) {
            setNewMenuName("");
            setNewMenuPath("");
            setNewMenuSection("Planning");
            setNewMenuParentId("");
            setIsCreateMenuModalOpen(false);
        }
    };

    const handleDeleteMenu = async (id: string, name: string) => {
        if (confirm(`Yakin ingin menghapus menu "${name}"? Menu ini akan dihapus dari sidebar dan daftar privilege.`)) {
            await removeMenu(id);
        }
    };

    const handleParentChange = async (id: string, parentIdValue: string) => {
        const target = dbMenus.find((i) => i.id === id);
        if (!target) return;
        const val = parentIdValue === "none" || !parentIdValue ? null : parentIdValue;
        await updateMenu(target.id, { parentId: val });
    };

    const handleMoveMenu = async (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= dbMenus.length) return;
        const copy = [...dbMenus];
        const [moved] = copy.splice(index, 1);
        copy.splice(targetIndex, 0, moved);

        const ok = await reorderMenus(copy);
        if (ok) {
            toast.success(`Menu "${moved.name}" moved ${direction}!`);
        }
    };

    const handleToggleMenu = async (id: string, currentActive: boolean) => {
        const target = dbMenus.find((i) => i.id === id);
        if (!target) return;
        const newActive = !currentActive;

        const ok = await updateMenu(target.id, { isActive: newActive });
        if (ok) {
            toast.success(`Menu "${target.name}" is now ${newActive ? "visible" : "hidden"}`);
        } else {
            toast.error("Failed to toggle menu status");
        }
    };

    const handleRenameMenu = async (id: string, newLabel: string) => {
        const target = dbMenus.find((i) => i.id === id);
        if (!target) return;
        await updateMenu(target.id, { name: newLabel });
    };

    return (
        <div className="space-y-6">
            {/* Header matching Projects page */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Master Menus</h2>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            {filteredMenus.length} {filteredMenus.length === 1 ? "menu" : "menus"}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                        Atur urutan menu sidebar, ubah label nama, dan tentukan visibilitas secara global.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCreateMenuModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-xs cursor-pointer"
                    >
                        <Plus size={14} className="stroke-[2.5]" />
                        <span>Add Menu</span>
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

            {/* Search & Filter Bar matching Projects page */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 p-2.5 rounded-2xl border border-border/60">
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} />
                    <input
                        type="text"
                        placeholder="Search menu by name or path..."
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

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">Section:</span>
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                        <SelectTrigger className="h-8 w-[140px] text-xs rounded-xl bg-card border-border/80">
                            <SelectValue placeholder="All Sections" />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                            {sections.map((sec) => (
                                <SelectItem key={sec} value={sec} className="text-xs cursor-pointer">
                                    {sec === "All" ? "All Sections" : sec}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Clean Table Container */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground uppercase font-bold text-[11px] tracking-wider">
                            <th className="py-3 px-4 w-12 text-center">#</th>
                            <th className="py-3 px-4">Menu Name</th>
                            <th className="py-3 px-4 hidden sm:table-cell">Path Route</th>
                            <th className="py-3 px-4 hidden md:table-cell">Parent Menu</th>
                            <th className="py-3 px-4 hidden lg:table-cell">Section</th>
                            <th className="py-3 px-4 text-center w-28">Order</th>
                            <th className="py-3 px-4 text-center w-20">Visible</th>
                            <th className="py-3 px-4 text-right pr-6 w-16">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 bg-card">
                        {isLoading && dbMenus.length === 0 ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="py-3.5 px-4 text-center">
                                        <Skeleton className="h-4 w-4 mx-auto rounded" />
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <div className="flex items-center gap-2.5">
                                            <Skeleton className="h-4 w-4 rounded" />
                                            <Skeleton className="h-4 w-32 rounded" />
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 hidden sm:table-cell">
                                        <Skeleton className="h-4 w-24 rounded" />
                                    </td>
                                    <td className="py-3.5 px-4 hidden md:table-cell">
                                        <Skeleton className="h-6 w-28 rounded-lg" />
                                    </td>
                                    <td className="py-3.5 px-4 hidden lg:table-cell">
                                        <Skeleton className="h-6 w-20 rounded-lg" />
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <Skeleton className="h-4 w-12 mx-auto rounded" />
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <Skeleton className="h-5 w-8 mx-auto rounded-full" />
                                    </td>
                                    <td className="py-3.5 px-4 text-right pr-6">
                                        <Skeleton className="h-6 w-6 ml-auto rounded-md" />
                                    </td>
                                </tr>
                            ))
                        ) : filteredMenus.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                    No menus found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredMenus.map((item, idx) => {
                                const isSubmenu = !!item.parentId;
                                const parent = dbMenus.find((p) => p.id === item.parentId);

                                return (
                                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                                            {idx + 1}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                {isSubmenu ? (
                                                    <span className="text-muted-foreground text-xs pl-3 select-none text-primary font-bold">↳</span>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm select-none">📁</span>
                                                )}
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => handleRenameMenu(item.id, e.target.value)}
                                                    className={cn(
                                                        "text-xs bg-transparent border border-transparent hover:border-border focus:border-primary focus:bg-background rounded-lg px-2 py-1 transition-all outline-none",
                                                        isSubmenu ? "font-normal text-foreground/90" : "font-semibold text-foreground"
                                                    )}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 hidden sm:table-cell">
                                            <code className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                                                {item.path}
                                            </code>
                                        </td>
                                        <td className="py-3 px-4 hidden md:table-cell">
                                            <Select
                                                value={item.parentId || "none"}
                                                onValueChange={(val) => handleParentChange(item.id, val)}
                                            >
                                                <SelectTrigger className="h-7 w-[130px] text-[11px] rounded-lg bg-muted/30 border-border/60">
                                                    <SelectValue placeholder="Parent Menu" />
                                                </SelectTrigger>
                                                <SelectContent className="text-xs">
                                                    <SelectItem value="none" className="text-xs">None (Top-level)</SelectItem>
                                                    {parentCandidates
                                                        .filter((p) => p.id !== item.id)
                                                        .map((p) => (
                                                            <SelectItem key={p.id} value={p.id} className="text-xs">
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="py-3 px-4 hidden lg:table-cell">
                                            <Select
                                                value={item.section || "General"}
                                                onValueChange={(val) => updateMenu(item.id, { section: val })}
                                            >
                                                <SelectTrigger className="h-7 w-[120px] text-[11px] rounded-lg bg-muted/30 border-border/60">
                                                    <SelectValue placeholder="Section" />
                                                </SelectTrigger>
                                                <SelectContent className="text-xs">
                                                    {sections
                                                        .filter((s) => s !== "All")
                                                        .map((sec) => (
                                                            <SelectItem key={sec} value={sec} className="text-xs">
                                                                {sec}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    disabled={idx === 0}
                                                    onClick={() => handleMoveMenu(idx, "up")}
                                                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                                    title="Move Up"
                                                >
                                                    <CaretUp size={14} weight="bold" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={idx === dbMenus.length - 1}
                                                    onClick={() => handleMoveMenu(idx, "down")}
                                                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                                    title="Move Down"
                                                >
                                                    <CaretDown size={14} weight="bold" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center">
                                                <Switch
                                                    checked={item.isActive}
                                                    onCheckedChange={() => handleToggleMenu(item.id, item.isActive)}
                                                    aria-label={item.isActive ? "Visible in sidebar" : "Hidden in sidebar"}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right pr-6">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteMenu(item.id, item.name)}
                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                                                title="Delete Menu"
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

            {/* Create Menu Dialog */}
            <Dialog open={isCreateMenuModalOpen} onOpenChange={setIsCreateMenuModalOpen}>
                <DialogContent className="sm:max-w-[420px] rounded-2xl bg-card border border-border p-6 shadow-xl">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                            Add Master Menu
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground">
                            Tambah menu atau submenu baru ke sistem navigasi aplikasi.
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleCreateMenu} className="space-y-4 pt-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                Menu Name <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Analytics, Milestones, Reports"
                                value={newMenuName}
                                onChange={(e) => setNewMenuName(e.target.value)}
                                required
                                className="w-full px-3 py-2 text-xs bg-muted/30 border border-border rounded-xl focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                Route Path <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. /analytics or /master/milestones"
                                value={newMenuPath}
                                onChange={(e) => setNewMenuPath(e.target.value)}
                                required
                                className="w-full px-3 py-2 text-xs font-mono bg-muted/30 border border-border rounded-xl focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                Parent Menu (Opsional untuk Submenu)
                            </label>
                            <Select
                                value={newMenuParentId || "none"}
                                onValueChange={(val) => setNewMenuParentId(val === "none" ? "" : val)}
                            >
                                <SelectTrigger className="h-9 w-full text-xs rounded-xl bg-card border-border">
                                    <SelectValue placeholder="None (Jadikan Menu Utama / Top-level)" />
                                </SelectTrigger>
                                <SelectContent className="text-xs">
                                    <SelectItem value="none" className="text-xs">None (Jadikan Menu Utama / Top-level)</SelectItem>
                                    {parentCandidates.map((p) => (
                                        <SelectItem key={p.id} value={p.id} className="text-xs">
                                            {p.name} ({p.section || "General"})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Section</label>
                                <Select
                                    value={newMenuSection}
                                    onValueChange={setNewMenuSection}
                                >
                                    <SelectTrigger className="h-9 w-full text-xs rounded-xl bg-card border-border">
                                        <SelectValue placeholder="Select Section" />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        {sections
                                            .filter((s) => s !== "All")
                                            .map((sec) => (
                                                <SelectItem key={sec} value={sec} className="text-xs">
                                                    {sec}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Icon Code</label>
                                <input
                                    type="text"
                                    placeholder="e.g. ChartBar, Folder"
                                    value={newMenuIcon}
                                    onChange={(e) => setNewMenuIcon(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-muted/30 border border-border rounded-xl focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-3 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCreateMenuModalOpen(false)}
                                className="px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted rounded-xl transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!newMenuName.trim() || !newMenuPath.trim()}
                                className="px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                Create Menu
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
