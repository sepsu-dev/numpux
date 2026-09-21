"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/lib/types";

export default function NewTaskPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefillProjectId = searchParams.get("projectId") || "";

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>(prefillProjectId);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetch("/api/projects")
            .then((res) => res.json())
            .then((res) => {
                if (res.data) {
                    setProjects(res.data);
                    if (prefillProjectId) {
                        const found = res.data.find((p: Project) => p.id === prefillProjectId);
                        if (found) setSelectedProjectId(found.id);
                    }
                }
            })
            .catch(() => {});
    }, [prefillProjectId]);

    const activeProject = projects.find((p) => p.id === selectedProjectId);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const priority = formData.get("priority") as string;
        const date = formData.get("date") as string;
        const description = formData.get("description") as string;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    projectId: selectedProjectId || undefined,
                    project: activeProject ? activeProject.title : "Proyek Utama",
                    priority: priority || "Sedang",
                    date: date || "Segera",
                    description,
                }),
            });

            if (!res.ok) throw new Error("Gagal membuat tugas");

            toast.success("Tugas berhasil disimpan!");
            router.push(selectedProjectId ? `/projects` : "/tasks");
            router.refresh();
        } catch {
            toast.error("Gagal menyimpan tugas.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-6">
                <Link href="/tasks" className="p-2 hover:bg-muted/50 rounded-lg text-foreground transition-all border border-border bg-white active:scale-95 shadow-sm">
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tighter">Tambah Tugas</h2>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Buat detail rencana kerja Anda.</p>
                </div>
            </div>

            <div className="bg-white border border-border/60 rounded-lg p-10 shadow-sm hover:shadow-sm hover:border-primary/20 transition-all max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="space-y-8">
                        <div className="grid gap-2.5">
                            <Label htmlFor="title" className="font-semibold text-xs text-foreground px-0.5">Nama Tugas</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="Misal: Update Dashboard"
                                className="h-12 text-sm rounded-lg border border-border focus:border-primary font-medium px-4 bg-white transition-all text-foreground shadow-sm"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="grid gap-2.5">
                                <Label className="font-semibold text-xs text-foreground px-0.5">Pilih Proyek</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="h-12 w-full flex items-center justify-between rounded-lg border border-border px-4 bg-white hover:border-primary transition-all text-foreground font-medium shadow-sm text-sm"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Briefcase size={15} className={!activeProject ? "text-border" : "text-primary"} />
                                                <span className={!activeProject ? "text-muted-foreground" : "text-foreground font-semibold"}>
                                                    {activeProject ? activeProject.title : "Pilih Proyek (Opsional)"}
                                                </span>
                                            </div>
                                            <ChevronDown size={14} className="text-muted-foreground opacity-60" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[300px] md:w-[400px] rounded-lg border border-border/60 p-1.5 font-sans shadow-sm">
                                        <DropdownMenuItem
                                            className="h-10 rounded-lg cursor-pointer hover:bg-muted transition-colors pl-3 text-xs font-medium"
                                            onClick={() => setSelectedProjectId("")}
                                        >
                                            Tanpa Proyek Khusus
                                        </DropdownMenuItem>
                                        {projects.map((project) => (
                                            <DropdownMenuItem
                                                key={project.id}
                                                className="h-10 rounded-lg cursor-pointer hover:bg-muted transition-colors pl-3 text-xs font-medium flex items-center justify-between"
                                                onClick={() => setSelectedProjectId(project.id)}
                                            >
                                                <span className="font-semibold">{project.title}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{project.category}</span>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="grid gap-2.5">
                                <Label htmlFor="date" className="font-semibold text-xs text-foreground px-0.5">Tenggat Waktu</Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    className="h-12 rounded-lg border border-border focus:border-primary font-medium px-4 bg-white transition-all text-foreground shadow-sm text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2.5">
                            <Label className="font-semibold text-xs text-foreground px-0.5">Prioritas</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { id: 'Low', label: 'Rendah' },
                                    { id: 'Medium', label: 'Sedang' },
                                    { id: 'High', label: 'Tinggi' },
                                    { id: 'Critical', label: 'Mendesak' }
                                ].map((p) => (
                                    <label key={p.id} className="cursor-pointer group">
                                        <input type="radio" name="priority" value={p.label} className="sr-only peer" defaultChecked={p.id === 'Medium'} />
                                        <div className="flex items-center justify-center p-3 text-xs font-medium rounded-lg border border-border peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:font-semibold transition-all hover:bg-muted/50 shadow-sm">
                                            {p.label}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-2.5">
                            <Label htmlFor="description" className="font-semibold text-xs text-foreground px-0.5">Deskripsi & Catatan</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Tulis catatan atau detail tugas..."
                                className="min-h-[140px] rounded-lg border border-border focus:border-primary resize-none p-4 font-normal text-sm bg-white transition-all text-foreground shadow-sm focus:shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-border/40 flex items-center justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()} className="font-medium text-muted-foreground border border-border h-11 px-6 rounded-lg hover:bg-muted transition-all text-sm">Batal</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary text-primary-foreground font-semibold px-8 h-11 rounded-lg shadow-sm active:scale-95 transition-all text-sm">
                            {isSubmitting ? "Menyimpan..." : "Simpan Tugas"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}