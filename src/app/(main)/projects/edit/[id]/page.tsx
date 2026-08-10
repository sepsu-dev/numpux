"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";

export default function EditProjectPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Proyek #${id} berhasil diperbarui!`);
        router.push("/projects");
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Link href="/projects" className="p-2 hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-foreground transition-colors border border-border/40">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tighter">Edit Proyek #{id}</h2>
                    <p className="text-muted-foreground font-medium">Sesuaikan detail visi proyek Anda.</p>
                </div>
            </div>

            <div className="bg-white border border-border/60 rounded-lg p-10 shadow-sm max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="p-title" className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Nama Proyek</Label>
                            <Input
                                id="p-title"
                                defaultValue="Numpux Engine"
                                className="h-12 text-base rounded-lg border-border focus:border-primary font-medium text-foreground"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="p-status" className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Status</Label>
                                <select id="p-status" defaultValue="Active" className="h-10 w-full rounded-lg border border-border bg-transparent px-3 text-sm focus:border-primary focus:outline-none font-bold text-foreground">
                                    <option>Active</option>
                                    <option>Planning</option>
                                    <option>On Hold</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="p-category" className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Kategori</Label>
                                <Input
                                    id="p-category"
                                    defaultValue="Backend Engine"
                                    className="rounded-lg border-border focus:border-primary font-medium text-foreground"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="p-desc" className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Deskripsi Proyek</Label>
                            <Textarea
                                id="p-desc"
                                defaultValue="Sistem inti untuk manajemen task real-time yang menggunakan arsitektur event-driven."
                                className="min-h-[120px] rounded-lg border-border focus:border-primary resize-none p-4 font-medium text-foreground"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border/60 flex items-center justify-end gap-4">
                        <Button type="button" variant="ghost" onClick={() => router.back()} className="font-bold text-muted-foreground">Batal</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary text-white font-bold px-10 h-12 rounded-lg shadow-sm hover:shadow-none transition-all">
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}