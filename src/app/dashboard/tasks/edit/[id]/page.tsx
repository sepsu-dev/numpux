"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";

export default function EditTaskPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.info(`Perubahan pada tugas #${id} berhasil disimpan!`);
        router.push("/dashboard/tasks");
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/tasks" className="p-2 hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-foreground transition-colors border border-border/40">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tighter">Edit Tugas #{id}</h2>
                    <p className="text-muted-foreground font-medium">Perbarui status dan detail rencana Anda.</p>
                </div>
            </div>

            <div className="bg-white border border-border/60 rounded-lg p-10 shadow-sm max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="title" className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Judul Tugas</Label>
                            <Input
                                id="title"
                                defaultValue="Refactor API Gateway"
                                className="h-12 text-base rounded-lg border-border focus:border-primary font-medium text-foreground"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="project" className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Proyek</Label>
                                <Input
                                    id="project"
                                    defaultValue="Numpux Engine"
                                    className="rounded-lg border-border focus:border-primary font-medium text-foreground"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date" className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Tenggat Waktu</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    defaultValue="2026-05-25"
                                    className="rounded-lg border-border focus:border-primary font-medium text-foreground"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="priority" className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Prioritas</Label>
                            <div className="flex gap-4">
                                {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                                    <label key={p} className="flex-1 cursor-pointer">
                                        <input type="radio" name="priority" className="sr-only peer" defaultChecked={p === 'High'} />
                                        <div className="flex items-center justify-center p-3 text-[10px] font-bold uppercase border-2 border-border/40 rounded-lg peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all">
                                            {p}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description" className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Deskripsi Tugas</Label>
                            <Textarea
                                id="description"
                                defaultValue="Lakukan restrukturisasi pada modul gateway untuk mendukung latency yang lebih rendah."
                                className="min-h-[120px] rounded-lg border-border focus:border-primary resize-none p-4 font-medium text-foreground"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border/60 flex items-center justify-end gap-4">
                        <Button type="button" variant="ghost" onClick={() => router.back()} className="font-bold text-muted-foreground">Batal</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary text-white font-bold px-10 h-12 rounded-lg shadow-[0_8px_24px_rgba(217,166,64,0.25)] hover:shadow-none transition-all">
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
