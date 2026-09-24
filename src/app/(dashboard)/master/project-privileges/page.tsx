"use client";

import { useState, useEffect, useMemo } from "react";
import { UsersThree, ArrowClockwise, MagnifyingGlass, X, Plus, Trash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
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

export default function ProjectPrivilegesPage() {
    const {
        menus: dbMenus,
        projectGroups,
        projectPrivileges,
        isLoading,
        loadAllPrivileges,
        toggleProjectPrivilege,
        addProjectGroup,
        removeProjectGroup,
    } = usePrivilegesStore();

    const [selectedProjectGroup, setSelectedProjectGroup] = useState<string>("member");
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleDisplayName, setNewRoleDisplayName] = useState("");
    const [newRoleDescription, setNewRoleDescription] = useState("");

    useEffect(() => {
        loadAllPrivileges();
        const handleUpdate = () => loadAllPrivileges();
        window.addEventListener("numpux_master_data_updated", handleUpdate);
        return () => window.removeEventListener("numpux_master_data_updated", handleUpdate);
    }, [loadAllPrivileges]);

    const filteredMenus = useMemo(() => {
        return dbMenus.filter((m) => {
            const matchesSearch =
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.path.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [dbMenus, searchQuery]);

    const handleToggleProjectPrivilege = async (groupName: string, menuId: string, currentVal: boolean) => {
        await toggleProjectPrivilege(groupName, menuId, currentVal);
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = newRoleName.trim().toLowerCase().replace(/\s+/g, "_");
        const display = newRoleDisplayName.trim() || newRoleName.trim();
        if (!code) return;

        const success = await addProjectGroup({
            name: code,
            displayName: display,
            description: newRoleDescription.trim() || undefined,
        });

        if (success) {
            setSelectedProjectGroup(code);
            setNewRoleName("");
            setNewRoleDisplayName("");
            setNewRoleDescription("");
            setIsCreateRoleModalOpen(false);
        }
    };

    const handleRemoveRole = async (groupId: string, roleName: string) => {
        if (confirm(`Hapus role project "${roleName}"?`)) {
            const success = await removeProjectGroup(groupId);
            if (success && selectedProjectGroup === roleName) {
                setSelectedProjectGroup("member");
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header matching Projects page */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Project Privileges</h2>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            {filteredMenus.length} {filteredMenus.length === 1 ? "feature item" : "feature items"}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                        Manage feature and menu access levels based on project member roles (Owner, Admin, Member, or custom roles).
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCreateRoleModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-xs cursor-pointer"
                    >
                        <Plus size={14} className="stroke-[2.5]" />
                        <span>Add Project Role</span>
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

            {/* Search & Project Role Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 p-2.5 rounded-2xl border border-border/60">
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} />
                    <input
                        type="text"
                        placeholder="Search menu or action..."
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

                {/* Project Role Switcher Select */}
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">Project Role:</span>
                    <Select value={selectedProjectGroup} onValueChange={setSelectedProjectGroup}>
                        <SelectTrigger className="h-8 w-[160px] text-xs rounded-xl bg-card border-border/80">
                            <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                            {projectGroups.map((g) => (
                                <SelectItem key={g.id} value={g.name} className="text-xs cursor-pointer">
                                    {g.displayName || g.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {(() => {
                        const currentGroup = projectGroups.find((g) => g.name === selectedProjectGroup);
                        const isSystemRole = currentGroup && ["owner", "admin", "member"].includes(currentGroup.name.toLowerCase());
                        if (currentGroup && !isSystemRole) {
                            return (
                                <button
                                    onClick={() => handleRemoveRole(currentGroup.id, currentGroup.displayName || currentGroup.name)}
                                    className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                    title="Delete selected custom role"
                                >
                                    <Trash size={14} />
                                </button>
                            );
                        }
                        return null;
                    })()}
                </div>
            </div>

            {/* Clean Table Container */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground uppercase font-bold text-[11px] tracking-wider">
                            <th className="py-3 px-5 w-2/3">MENU</th>
                            <th className="py-3 px-5 w-1/3 text-right pr-6">ACTION</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 bg-card">
                        {isLoading && dbMenus.length === 0 ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="py-3.5 px-5">
                                        <div className="flex items-center gap-2.5">
                                            <Skeleton className="h-4 w-4 rounded" />
                                            <Skeleton className="h-4 w-36 rounded" />
                                            <Skeleton className="h-3 w-20 rounded" />
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-5 text-right pr-6">
                                        <div className="inline-flex items-center gap-2.5">
                                            <Skeleton className="h-3 w-8 rounded" />
                                            <Skeleton className="h-5 w-8 rounded-full" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : dbMenus.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="text-center py-12 text-muted-foreground">
                                    No menus found in database.
                                </td>
                            </tr>
                        ) : filteredMenus.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="text-center py-12 text-muted-foreground">
                                    No menus match your search.
                                </td>
                            </tr>
                        ) : (
                            filteredMenus.map((menu) => {
                                const currentGroup = projectGroups.find(
                                    (g) => g.name.toLowerCase() === selectedProjectGroup.toLowerCase()
                                );
                                const priv = projectPrivileges.find(
                                    (p) => p.groupId === currentGroup?.id && p.menuId === menu.id
                                );
                                const canView = priv ? priv.canView : false;

                                return (
                                    <tr key={menu.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="py-3.5 px-5 font-medium text-foreground">
                                            <div className="flex items-center gap-2">
                                                {menu.parentId ? (
                                                    <span className="text-primary text-xs pl-3.5 select-none font-bold">↳</span>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm select-none">📁</span>
                                                )}
                                                <span className={cn("text-xs text-foreground", menu.parentId ? "font-normal text-foreground/90" : "font-semibold")}>
                                                    {menu.name}
                                                </span>
                                                <code className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/40">
                                                    {menu.path}
                                                </code>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-5 text-right pr-6">
                                            <div className="inline-flex items-center gap-2.5">
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    view
                                                </span>
                                                <Switch
                                                    checked={canView}
                                                    onCheckedChange={() =>
                                                        handleToggleProjectPrivilege(selectedProjectGroup, menu.id, canView)
                                                    }
                                                    aria-label="Toggle project privilege"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Project Role Modal */}
            <Dialog open={isCreateRoleModalOpen} onOpenChange={setIsCreateRoleModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground">
                            Add Project Role
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateRole} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Role Code / Name
                            </label>
                            <input
                                type="text"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                placeholder="e.g. viewer, contributor, reviewer..."
                                autoFocus
                                required
                                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Display Label
                            </label>
                            <input
                                type="text"
                                value={newRoleDisplayName}
                                onChange={(e) => setNewRoleDisplayName(e.target.value)}
                                placeholder="e.g. Project Viewer, External Auditor..."
                                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Description
                            </label>
                            <input
                                type="text"
                                value={newRoleDescription}
                                onChange={(e) => setNewRoleDescription(e.target.value)}
                                placeholder="Brief description of member role scope..."
                                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreateRoleModalOpen(false)}
                                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                            >
                                Save Role
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
