"use client";

import { useState } from "react";
import {
    Filter,
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    LayoutGrid,
    List,
    CheckCircle2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { deleteTaskAction } from "@/lib/actions";
import type { Task } from "@/lib/types";

const PRIORITY_BADGES: Record<string, string> = {
    Rendah: "bg-gray-50 text-gray-500 border-gray-100 dark:bg-gray-950/20 dark:border-gray-900/40",
    Sedang: "bg-blue-50 text-blue-500 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/40",
    Tinggi: "bg-orange-50 text-orange-500 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/40",
    Mendesak: "bg-red-50 text-red-500 border-red-100 dark:bg-red-950/20 dark:border-red-900/40",
};

export function TasksClient({
    tasks,
    projects = [],
    activeProjectId,
    activeProjectTitle,
}: {
    tasks: Task[];
    projects?: import("@/lib/types").Project[];
    activeProjectId?: string;
    activeProjectTitle?: string;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("Semua");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const filteredTasks = tasks.filter(
        (task) =>
            (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.project.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (statusFilter === "Semua" || task.status === statusFilter)
    );

    const newTaskHref = activeProjectId ? `/tasks/new?projectId=${activeProjectId}` : "/tasks/new";

    return (
        <>
            <div className="flex items-center justify-between gap-8 pb-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-3xl font-bold text-foreground tracking-tight">Daftar Tugas</h2>
                        {activeProjectTitle && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
                                {activeProjectTitle}
                            </span>
                        )}
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mt-1">
                        {activeProjectTitle
                            ? `Menampilkan tugas khusus untuk proyek ${activeProjectTitle}`
                            : "Kelola pekerjaan harian Anda."}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-muted/60 p-1 rounded-lg flex border border-border/60">
                        <button className="p-2 bg-card text-primary rounded-md shadow-sm">
                            <List size={16} />
                        </button>
                        <Link href="/tasks/kanban">
                            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md">
                                <LayoutGrid size={16} />
                            </button>
                        </Link>
                    </div>
                    <Link href={newTaskHref}>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm active:scale-95">
                            <Plus size={15} />
                            Tugas Baru
                        </button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                    <input
                        type="text"
                        placeholder="Cari tugas atau proyek..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-all font-normal"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted/50 transition-all">
                            <Filter size={14} className="text-muted-foreground" />
                            <span>Status: {statusFilter}</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-lg border border-border font-sans bg-card shadow-sm">
                        {["Semua", "Proses", "Selesai", "Belum Mulai", "Peninjauan"].map((s) => (
                            <DropdownMenuItem
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={cn("cursor-pointer rounded-md text-xs py-2 px-3 font-medium", statusFilter === s && "bg-primary/10 text-primary font-semibold")}
                            >
                                {s}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="space-y-2.5">
                {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                        <div key={task.id} className="bg-card border border-border/80 p-4 rounded-xl flex items-center justify-between group hover:border-border transition-all">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg border border-border/60 bg-muted/40 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={16} className="text-muted-foreground/70" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-foreground truncate">{task.title}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[11px] font-medium text-muted-foreground">{task.project}</span>
                                        <span className="text-muted-foreground/40">•</span>
                                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.Rendah)}>
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0 pl-3">
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${task.status === "Selesai" ? "bg-emerald-50 text-emerald-600" : task.status === "Proses" ? "bg-blue-50 text-blue-600" : "bg-stone-100 text-stone-600"}`}>
                                    {task.status}
                                </span>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-lg border border-border bg-card font-sans shadow-sm">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/tasks/edit/${task.id}`} className="cursor-pointer text-xs py-2 px-3 font-medium">
                                                <Edit size={14} className="mr-2" /> Ubah
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-500 hover:bg-red-50 text-xs py-2 px-3 font-medium cursor-pointer"
                                            onClick={() => setDeleteId(task.id)}
                                        >
                                            <Trash2 size={14} className="mr-2" /> Hapus
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-16 text-center bg-card border border-dashed border-border rounded-xl">
                        <p className="text-sm font-medium text-muted-foreground">Tidak ada tugas yang ditemukan.</p>
                    </div>
                )}
            </div>

            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="rounded-xl border border-border p-6 font-sans shadow-md bg-card max-w-sm">
                    <DialogHeader className="space-y-2">
                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center mb-1">
                            <Trash2 size={20} />
                        </div>
                        <DialogTitle className="text-lg font-semibold text-foreground tracking-tight">Hapus Tugas?</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Data yang dihapus tidak bisa dikembalikan. Yakin ingin menghapus?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => setDeleteId(null)}>Batal</Button>
                        <form action={async () => { if (deleteId) await deleteTaskAction(deleteId); }} className="flex-1">
                            <Button type="submit" size="sm" className="w-full bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg">Hapus</Button>
                        </form>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}