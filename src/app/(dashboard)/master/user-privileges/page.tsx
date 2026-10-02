"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowClockwise, MagnifyingGlass, X } from "@phosphor-icons/react";
import { getMenuIcon } from "@/lib/menu-icons";
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
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-bold tracking-tight">User Access</h2>
                        <span className="rounded-md bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                            {filteredMenus.length} {filteredMenus.length === 1 ? "menu" : "menus"}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Choose which navigation links each system role can access.</p>
                </div>
                <button
                    onClick={() => void loadAllPrivileges()}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs font-semibold disabled:opacity-50"
                >
                    <ArrowClockwise size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full max-w-sm">
                    <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search menus"
                        className="w-full rounded-lg border border-border bg-card py-1.5 pl-9 pr-8 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><X size={13} /></button>}
                </div>
                <Select value={selectedUserGroup} onValueChange={setSelectedUserGroup}>
                    <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                        {userGroups.map((group) => (
                            <SelectItem key={group.id} value={group.name} className="text-xs">
                                {group.displayName || (group.name === "superadmin" ? "Super Administrator" : group.name === "admin" ? "Administrator" : group.name.charAt(0).toUpperCase() + group.name.slice(1))}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-border/60 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            <th className="px-4 py-3">Menu</th>
                            <th className="hidden px-4 py-3 sm:table-cell">Route</th>
                            <th className="px-4 py-3 text-center">Access</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {isLoading && dbMenus.length === 0 ? Array.from({ length: 6 }).map((_, index) => (
                            <tr key={index}>
                                <td className="px-4 py-3"><Skeleton className="h-5 w-36" /></td>
                                <td className="hidden px-4 py-3 sm:table-cell"><Skeleton className="h-5 w-24" /></td>
                                <td className="px-4 py-3"><Skeleton className="mx-auto h-5 w-8 rounded-full" /></td>
                            </tr>
                        )) : filteredMenus.length === 0 ? (
                            <tr><td colSpan={3} className="py-12 text-center text-muted-foreground">{dbMenus.length === 0 ? "No menus found." : "No menus match your search."}</td></tr>
                        ) : filteredMenus.map((menu) => {
                            const currentGroup = userGroups.find((group) => group.name.toLowerCase() === selectedUserGroup.toLowerCase());
                            const privilege = privileges.find((item) => item.groupId === currentGroup?.id && item.menuId === menu.id);
                            const canView = privilege?.canView ?? false;
                            const Icon = getMenuIcon(menu.icon);

                            return (
                                <tr key={menu.id} className="hover:bg-muted/20">
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={16} /></span>
                                            <div><p className="font-semibold">{menu.name}</p>{menu.parentId && <p className="text-[10px] text-muted-foreground">Submenu</p>}</div>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3.5 sm:table-cell"><code className="rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground">{menu.path}</code></td>
                                    <td className="px-4 py-3.5 text-center">
                                        <Switch
                                            checked={canView}
                                            disabled={selectedUserGroup.toLowerCase() === "superadmin"}
                                            onCheckedChange={() => void handleTogglePrivilege(selectedUserGroup, menu.id, canView)}
                                            aria-label={`Toggle ${menu.name} access`}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
