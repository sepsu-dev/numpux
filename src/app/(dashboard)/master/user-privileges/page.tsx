"use client";

import { useState, useEffect, useMemo } from "react";
import { ShieldCheck, ArrowClockwise, MagnifyingGlass, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { usePrivilegesStore } from "@/stores/privileges-store";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function UserPrivilegesPage() {
    const {
        menus: dbMenus,
        userGroups,
        userPrivileges: privileges,
        isLoading,
        loadAllPrivileges,
        toggleUserPrivilege,
    } = usePrivilegesStore();

    const [selectedUserGroup, setSelectedUserGroup] = useState<string>("admin");
    const [searchQuery, setSearchQuery] = useState("");

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

    const handleTogglePrivilege = async (groupName: string, menuId: string, currentVal: boolean) => {
        await toggleUserPrivilege(groupName, menuId, currentVal);
    };

    return (
        <div className="space-y-6">
            {/* Header matching Projects page */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">User Privileges</h2>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            {filteredMenus.length} {filteredMenus.length === 1 ? "menu item" : "menu items"}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                        Manage sidebar menu visibility and privileges for each system user role.
                    </p>
                </div>

                <div className="flex items-center gap-2">
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

            {/* Search & Role Filter Bar matching Projects page */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 p-2.5 rounded-2xl border border-border/60">
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} />
                    <input
                        type="text"
                        placeholder="Search menu name or path..."
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

                {/* Role Switcher Select */}
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">Role Group:</span>
                    <Select value={selectedUserGroup} onValueChange={setSelectedUserGroup}>
                        <SelectTrigger className="h-8 w-[160px] text-xs rounded-xl bg-card border-border/80">
                            <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                            {userGroups.map((g) => (
                                <SelectItem key={g.id} value={g.name} className="text-xs cursor-pointer">
                                    {g.displayName || (g.name === "admin" ? "Administrator" : g.name.charAt(0).toUpperCase() + g.name.slice(1))}
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
                                const currentGroup = userGroups.find(
                                    (g) => g.name.toLowerCase() === selectedUserGroup.toLowerCase()
                                );
                                const priv = privileges.find(
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
                                                    onCheckedChange={() => handleTogglePrivilege(selectedUserGroup, menu.id, canView)}
                                                    aria-label="Toggle privilege"
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
        </div>
    );
}
