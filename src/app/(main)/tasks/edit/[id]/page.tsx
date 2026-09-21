"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ChevronDown, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Link from "next/link";
import type { Task, Project } from "@/lib/types";

export default function EditTaskPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [task, setTask] = useState<Task | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!id) return;
        Promise.all([
            fetch(`/api/tasks/${id}`).then((r) => r.json()),
            fetch("/api/projects").then((r) => r.json())
        ])
            .then(([taskRes, projectsRes]) => {
                if (taskRes.data) {
                    setTask(taskRes.data);
                    setSelectedProjectId(taskRes.data.projectId || "");
                }
                if (projectsRes.data) {
                    setProjects(projectsRes.data);
                }
            })
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, [id]);

    const activeProject = projects.find((p) => p.id === selectedProjectId);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const priority = formData.get("priority") as string;
        const date = formData.get("date") as string;
        const description = formData.get("description") as string;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    projectId: selectedProjectId || undefined,
                    project: activeProject ? activeProject.title : (task?.project || "Proyek"),
                    priority,
                    date,
                    description,
                }),
            });
            if (!res.ok) throw new Error("Gagal menyimpan");
            toast.success("Perubahan tugas berhasil disimpan!");
            router.push("/tasks");
            router.refresh();
        } catch {
            toast.error("Gagal menyimpan perubahan tugas.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="py-20 text-center text-muted-foreground text-sm font-medium">
                Memuat data tugas...
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Link href="/tasks" className="p-2 hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-foreground transition-colors border border-border/40">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tighter">Edit Tugas</h2>
                    <p className="text-muted-foreground font-medium text-xs">Perbarui status dan detail rencana Anda.</p>
                </div>
            </div>

            <div className="bg-white border border-border/60 rounded-lg p-10 shadow-sm max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="title" className="font-semibold text-xs text-foreground">Judul Tugas</Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={task?.title || ""}
                                className="h-11 text-sm rounded-lg border border-border focus:border-primary font-medium text-foreground px-3.5"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label className="font-semibold text-xs text-foreground">Proyek</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="h-11 w-full flex items-center justify-between rounded-lg border border-border px-3.5 bg-white hover:border-primary transition-all text-foreground font-medium shadow-sm text-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Briefcase size={14} className={!activeProject ? "text-muted-foreground" : "text-primary"} />
                                                <span className="text-xs truncate">
                                                    {activeProject ? activeProject.title : (task?.project || "Pilih Proyek")}
                                                </span>
                                            </div>
                                            <ChevronDown size={14} className="text-muted-foreground opacity-60" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[300px] rounded-lg border border-border p-1.5 font-sans shadow-sm">
                                        <DropdownMenuItem
                                            className="h-9 rounded-lg cursor-pointer hover:bg-muted text-xs font-medium"
                                            onClick={() => setSelectedProjectId("")}
                                        >
                                            Tanpa Proyek Khusus
                                        </DropdownMenuItem>
                                        {projects.map((proj) => (
                                            <DropdownMenuItem
                                                key={proj.id}
                                                className="h-9 rounded-lg cursor-pointer hover:bg-muted text-xs font-medium flex items-center justify-between"
                                                onClick={() => setSelectedProjectId(proj.id)}
                                            >
                                                <span>{proj.title}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{proj.category}</span>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date" className="font-semibold text-xs text-foreground">Tenggat Waktu</Label>
                                <Input
                                    id="date"
                                    name="date"
                                    defaultValue={task?.date || ""}
                                    className="h-11 text-sm rounded-lg border border-border focus:border-primary font-medium text-foreground px-3.5"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="priority" className="font-semibold text-xs text-foreground">Prioritas</Label>
                            <div className="flex gap-3">
                                {['Rendah', 'Sedang', 'Tinggi', 'Mendesak'].map((p) => (
                                    <label key={p} className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value={p}
                                            className="sr-only peer"
                                            defaultChecked={task?.priority === p || (!task?.priority && p === 'Sedang')}
                                        />
                                        <div className="flex items-center justify-center p-2.5 text-xs font-medium border border-border/60 rounded-lg peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:font-semibold transition-all">
                                            {p}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description" className="font-semibold text-xs text-foreground">Deskripsi Tugas</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={task?.description || ""}
                                className="min-h-[120px] rounded-lg border border-border focus:border-primary resize-none p-3.5 font-normal text-sm text-foreground"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border/60 flex items-center justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => router.back()} className="font-medium text-muted-foreground text-sm">Batal</Button>
                        <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary text-primary-foreground font-semibold px-8 h-11 rounded-lg shadow-sm hover:shadow-none transition-all text-sm">
                            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}