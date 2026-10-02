"use client";

import { useEffect, useMemo, useState } from "react";
import { CaretDown, CaretUp, MagnifyingGlass, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { useMasterDataStore } from "@/stores/master-data-store";
import { MasterDataNotice } from "@/components/settings/master-data-notice";
import type { MasterStatusItem } from "@/lib/master-data";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const STATUS_COLORS = [
    {
        label: "Slate",
        dotColor: "bg-slate-400",
        badgeClass: "bg-slate-100 text-slate-700",
        headerBorder: "border-slate-200/80",
    },
    {
        label: "Brand Blue",
        dotColor: "bg-[#2984f7]",
        badgeClass: "bg-[#eef6ff] text-[#1768c5]",
        headerBorder: "border-[#c8e0ff]",
    },
    {
        label: "Brand Orange",
        dotColor: "bg-[#f5a300]",
        badgeClass: "bg-[#fff7e6] text-[#946000]",
        headerBorder: "border-[#ffe0a3]",
    },
    {
        label: "Brand Green",
        dotColor: "bg-primary",
        badgeClass: "bg-primary/10 text-primary",
        headerBorder: "border-primary/25",
    },
    {
        label: "Purple",
        dotColor: "bg-purple-500",
        badgeClass: "bg-purple-50 text-purple-700",
        headerBorder: "border-purple-200/80",
    },
    {
        label: "Rose",
        dotColor: "bg-rose-500",
        badgeClass: "bg-rose-50 text-rose-700",
        headerBorder: "border-rose-200/80",
    },
] as const;

export default function MasterStatusesPage() {
    const { statuses, loadStatuses, addStatus, updateStatus, reorderStatuses, removeStatus, isLoading, isSaving, error } = useMasterDataStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [colorIndex, setColorIndex] = useState(1);
    const [statusType, setStatusType] = useState<"open" | "completed">("open");
    const [editingStatus, setEditingStatus] = useState<MasterStatusItem | null>(null);

    useEffect(() => {
        loadStatuses();
        const handleUpdate = () => loadStatuses();
        window.addEventListener("numpux_master_data_updated", handleUpdate);
        return () => window.removeEventListener("numpux_master_data_updated", handleUpdate);
    }, [loadStatuses]);

    const filteredStatuses = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return statuses.filter(
            (status) =>
                status.name.toLowerCase().includes(query) ||
                status.description?.toLowerCase().includes(query)
        );
    }, [searchQuery, statuses]);

    const handleAdd = async (event: React.FormEvent) => {
        event.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;

        const color = STATUS_COLORS[colorIndex];
        const item: MasterStatusItem = {
            id: trimmedName,
            name: trimmedName,
            description: description.trim() || undefined,
            order: statuses.length + 1,
            dotColor: color.dotColor,
            badgeClass: color.badgeClass,
            headerBorder: color.headerBorder,
            isCompleted: statusType === "completed",
        };

        const success = editingStatus
            ? await updateStatus(editingStatus.id, {
                name: item.name,
                description: item.description,
                dotColor: item.dotColor,
                badgeClass: item.badgeClass,
                headerBorder: item.headerBorder,
                isCompleted: item.isCompleted,
            })
            : await addStatus(item);

        if (success) {
            setName("");
            setDescription("");
            setColorIndex(1);
            setStatusType("open");
            setEditingStatus(null);
            setIsCreateOpen(false);
        }
    };

    const handleCreate = () => {
        setEditingStatus(null);
        setName("");
        setDescription("");
        setColorIndex(1);
        setStatusType("open");
        setIsCreateOpen(true);
    };

    const handleEdit = (status: MasterStatusItem) => {
        const matchingColor = STATUS_COLORS.findIndex(
            (color) => color.dotColor === status.dotColor && color.badgeClass === status.badgeClass
        );
        setEditingStatus(status);
        setName(status.name);
        setDescription(status.description || "");
        setColorIndex(matchingColor >= 0 ? matchingColor : 0);
        setStatusType(status.isCompleted ? "completed" : "open");
        setIsCreateOpen(true);
    };

    const moveStatus = async (statusId: string, direction: "up" | "down") => {
        const currentIndex = statuses.findIndex((status) => status.id === statusId);
        const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= statuses.length) return;
        const reordered = [...statuses];
        [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
        await reorderStatuses(reordered);
    };

    return (
        <div className="space-y-6">
            <MasterDataNotice isLoading={isLoading} error={error} />
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Statuses</h2>
                        <span className="rounded-md bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                            {filteredStatuses.length} {filteredStatuses.length === 1 ? "status" : "statuses"}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Define the workflow columns available on the board.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleCreate}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                    <Plus size={14} weight="bold" />
                    Create status
                </button>
            </div>

            <div className="flex items-center rounded-lg border border-border/60 bg-card p-2.5">
                <div className="relative w-full max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} />
                    <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search statuses"
                        className="w-full rounded-lg border border-border bg-card py-1.5 pl-9 pr-8 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/80 focus:ring-2 focus:ring-primary/20"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
                <table className="w-full border-collapse text-left text-xs">
                    <thead>
                        <tr className="border-b border-border/60 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            <th className="px-5 py-3">Workflow status</th>
                            <th className="hidden px-5 py-3 sm:table-cell">Description</th>
                            <th className="w-28 px-5 py-3 text-center">Type</th>
                            <th className="w-28 px-5 py-3 text-center">Order</th>
                            <th className="w-24 px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filteredStatuses.map((status) => (
                            <tr key={status.id} className="transition-colors hover:bg-muted/20">
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.dotColor}`} />
                                        <span className={`rounded-md border border-border/40 px-2.5 py-1 font-semibold ${status.badgeClass}`}>
                                            {status.name}
                                        </span>
                                        {status.isDefault && (
                                            <span className="rounded-full border border-border/50 bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="hidden px-5 py-3.5 text-muted-foreground sm:table-cell">
                                    {status.description || "-"}
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                    <span className={status.isCompleted ? "font-semibold text-primary" : "text-muted-foreground"}>
                                        {status.isCompleted ? "Completed" : "Open"}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                            type="button"
                                            disabled={statuses.findIndex((item) => item.id === status.id) === 0 || isSaving}
                                            onClick={() => void moveStatus(status.id, "up")}
                                            title={`Move ${status.name} up`}
                                            className="rounded-md border border-border/60 p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            <CaretUp size={13} weight="bold" />
                                        </button>
                                        <span className="min-w-6 text-center text-[11px] font-semibold text-muted-foreground">{status.order}</span>
                                        <button
                                            type="button"
                                            disabled={statuses.findIndex((item) => item.id === status.id) === statuses.length - 1 || isSaving}
                                            onClick={() => void moveStatus(status.id, "down")}
                                            title={`Move ${status.name} down`}
                                            className="rounded-md border border-border/60 p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            <CaretDown size={13} weight="bold" />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(status)}
                                            title={`Edit status ${status.name}`}
                                            className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                        >
                                            <PencilSimple size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeStatus(status.id)}
                                            title={`Delete status ${status.name}`}
                                            className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Sheet
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open);
                    if (!open) setEditingStatus(null);
                }}
            >
                <SheetContent side="right" className="h-full w-full overflow-y-auto border-l border-border bg-card p-6 shadow-none sm:max-w-md">
                    <SheetHeader className="px-0 pt-0">
                        <SheetTitle className="text-base font-bold">
                            {editingStatus ? "Edit task status" : "Create task status"}
                        </SheetTitle>
                    </SheetHeader>
                    <form onSubmit={handleAdd} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">Status name</label>
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="e.g. QA Testing, Blocked, Ready to deploy"
                                maxLength={50}
                                required
                                autoFocus
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">Description</label>
                            <input
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="When should tasks use this status?"
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Color</label>
                                <Select value={String(colorIndex)} onValueChange={(value) => setColorIndex(Number(value))}>
                                    <SelectTrigger className="h-9 w-full rounded-lg bg-background text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_COLORS.map((color, index) => (
                                            <SelectItem key={color.label} value={String(index)} className="text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 rounded-full ${color.dotColor}`} />
                                                    {color.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Status type</label>
                                <Select value={statusType} onValueChange={(value) => setStatusType(value as "open" | "completed")}>
                                    <SelectTrigger className="h-9 w-full rounded-lg bg-background text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open" className="text-xs">Open</SelectItem>
                                        <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <SheetFooter className="gap-2 px-0 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="cursor-pointer rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="cursor-pointer rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
                            >
                                {editingStatus ? "Save changes" : "Save status"}
                            </button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}
