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
    CheckCircle2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TasksPage() {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("Semua");

    const tasks = [
        { id: 1, title: "Refactor spaghetti code di auth service", project: "Refactor", priority: "Tinggi", date: "Hari ini", status: "Proses", badgeColor: "bg-orange-50 text-orange-500 border-orange-100" },
        { id: 2, title: "Fix bug 'Works on my machine' di Dockerfile", project: "Bug Fixes", priority: "Sedang", date: "Besok", status: "Belum Mulai", badgeColor: "bg-blue-50 text-blue-500 border-blue-100" },
        { id: 3, title: "Optimize query database Numpux", project: "Refactor", priority: "Mendesak", date: "24 Mei", status: "Selesai", badgeColor: "bg-red-50 text-red-500 border-red-100" },
        { id: 4, title: "Tulis dokumentasi API dengan Swagger", project: "Docs", priority: "Rendah", date: "25 Mei", status: "Peninjauan", badgeColor: "bg-gray-50 text-gray-500 border-gray-100" },
    ];

    const filteredTasks = tasks.filter(task =>
        (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.project.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (statusFilter === "Semua" || task.status === statusFilter)
    );

    const handleDelete = () => {
        toast.error("Tugas berhasil dihapus!");
        setIsDeleteDialogOpen(false);
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between gap-8 pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">Daftar Tugas</h2>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Kelola pekerjaan harian Anda.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-muted/60 p-1 rounded-lg flex border border-border/60">
                        <button className="p-2 bg-card text-primary rounded-md shadow-sm">
                            <List size={16} />
                        </button>
                        <Link href="/dashboard/tasks/kanban">
                            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md">
                                <LayoutGrid size={16} />
                            </button>
                        </Link>
                    </div>
                    <Link href="/dashboard/tasks/new">
                        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full text-[11px] font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-95">
                            <Plus size={16} />
                            TUGAS BARU
                        </button>
                    </Link>
                </div>
            </div>

            {/* Pencarian & Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Cari tugas atau proyek..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary shadow-sm transition-all"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-lg text-xs font-bold text-foreground hover:bg-muted/50 transition-all shadow-sm">
                            <Filter size={16} />
                            Filter Status: {statusFilter}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border border-border/40 font-sans shadow-xl bg-card">
                        {["Semua", "Proses", "Selesai", "Belum Mulai", "Peninjauan"].map((s) => (
                            <DropdownMenuItem
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={cn("cursor-pointer rounded-lg hover:bg-muted font-semibold text-xs py-2.5 px-3", statusFilter === s && "bg-primary/10 text-primary font-bold")}
                            >
                                {s}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* List Tugas */}
            <div className="grid grid-cols-1 gap-4">
                {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                        <div key={task.id} className="bg-card border border-border/40 p-6 rounded-2xl shadow-sm flex items-center justify-between group hover:shadow-md hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-10 h-10 rounded-lg border border-border/40 bg-muted/50 flex items-center justify-center group-hover:text-primary transition-colors">
                                    <CheckCircle2 size={18} className="text-muted-foreground/60 group-hover:text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-[15px] font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">{task.title}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{task.project}</span>
                                        <span className={cn(
                                            "text-[9px] font-bold px-2 py-0.5 rounded-lg border",
                                            task.badgeColor
                                        )}>
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Status</span>
                                    <span className={`text-[11px] font-bold ${
                                        task.status === 'Selesai' ? 'text-emerald-500' :
                                        task.status === 'Proses' ? 'text-blue-500' : 'text-foreground'
                                    }`}>{task.status}</span>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-3 bg-card rounded-lg text-foreground hover:bg-muted/50 border border-border transition-all shadow-sm">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl border border-border bg-card font-sans shadow-xl">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/tasks/edit/${task.id}`} className="cursor-pointer py-2 px-3 hover:bg-muted/50">
                                                <Edit size={14} className="mr-2" /> Ubah
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-500 hover:bg-red-50 cursor-pointer py-2 px-3"
                                            onClick={() => setIsDeleteDialogOpen(true)}
                                        >
                                            <Trash2 size={14} className="mr-2" /> Hapus
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center bg-card border border-dashed border-border rounded-2xl">
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Tidak ada tugas yang ditemukan.</p>
                    </div>
                )}
            </div>

            {/* Dialog Hapus */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="rounded-2xl border border-border p-10 font-sans shadow-2xl bg-card">
                    <DialogHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mb-2 shadow-sm">
                            <Trash2 size={28} />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">Hapus Tugas?</DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground">
                            Data yang dihapus tidak bisa dikembalikan. Apakah Anda yakin?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-10 flex gap-4">
                        <Button variant="outline" className="font-bold text-muted-foreground flex-1 h-12 rounded-xl border border-border bg-card" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
                        <Button className="bg-red-500 hover:bg-red-600 text-white font-bold flex-1 h-12 rounded-xl shadow-sm" onClick={handleDelete}>Hapus Sekarang</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
