"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";

export default function NewProjectPage() {
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Sedang membuat proyek...',
                success: 'Proyek baru berhasil dibuat!',
                error: 'Gagal membuat proyek.',
            }
        );
        setTimeout(() => router.push("/dashboard/projects"), 1500);
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-6">
                <Link href="/dashboard/projects" className="p-2 hover:bg-muted/50 rounded-lg text-foreground transition-all border border-border bg-white active:scale-95 shadow-sm">
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tighter">Proyek Baru</h2>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Mulai rencanakan visi besar Anda.</p>
                </div>
            </div>

            <div className="bg-white border border-border/60 rounded-lg p-10 shadow-sm max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="space-y-8">
                        <div className="grid gap-3">
                            <Label htmlFor="title" className="font-bold text-[10px] uppercase tracking-[0.2em] text-foreground px-1">Nama Proyek</Label>
                            <Input
                                id="title"
                                placeholder="Misal: Aplikasi Numpux"
                                className="h-14 text-base rounded-lg border border-border focus:border-primary font-bold px-6 bg-white transition-all text-foreground shadow-sm"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="grid gap-3">
                                <Label htmlFor="category" className="font-bold text-[10px] uppercase tracking-[0.2em] text-foreground px-1">Kategori</Label>
                                <Input
                                    id="category"
                                    placeholder="Produk, Desain, dll..."
                                    className="h-14 rounded-lg border border-border focus:border-primary font-bold px-6 bg-white transition-all text-foreground shadow-sm"
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label className="font-bold text-[10px] uppercase tracking-[0.2em] text-foreground px-1">Tipe</Label>
                                <div className="flex bg-muted/60 border border-border/60 p-1 rounded-lg shadow-sm">
                                    <button type="button" className="flex-1 py-3 text-[10px] font-bold uppercase rounded-lg bg-primary text-white shadow-sm">Pribadi</button>
                                    <button type="button" className="flex-1 py-3 text-[10px] font-bold uppercase rounded-lg text-muted-foreground hover:text-muted-foreground">Publik</button>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="description" className="font-bold text-[10px] uppercase tracking-[0.2em] text-foreground px-1">Deskripsi Proyek</Label>
                            <Textarea
                                id="description"
                                placeholder="Apa tujuan dari proyek ini?"
                                className="min-h-[160px] rounded-lg border border-border focus:border-primary resize-none p-6 font-bold text-sm bg-white transition-all text-foreground shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-10 border-t border-border/40 flex items-center justify-end gap-6">
                        <Button type="button" variant="outline" onClick={() => router.back()} className="font-bold text-muted-foreground border border-border h-14 px-8 rounded-lg hover:bg-muted transition-all">Batal</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary text-white font-bold px-12 h-14 rounded-lg shadow-sm active:scale-95 transition-all">
                            Buat Proyek
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
