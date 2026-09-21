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
        setTimeout(() => router.push("/projects"), 1500);
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-6">
                <Link href="/projects" className="p-2 hover:bg-muted/50 rounded-lg text-foreground transition-all border border-border bg-white active:scale-95 shadow-sm">
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
                        <div className="grid gap-2.5">
                            <Label htmlFor="title" className="font-semibold text-xs text-foreground px-0.5">Nama Proyek</Label>
                            <Input
                                id="title"
                                placeholder="Misal: Aplikasi Numpux"
                                className="h-12 text-sm rounded-lg border border-border focus:border-primary font-medium px-4 bg-white transition-all text-foreground shadow-sm"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="grid gap-2.5">
                                <Label htmlFor="category" className="font-semibold text-xs text-foreground px-0.5">Kategori</Label>
                                <Input
                                    id="category"
                                    placeholder="Produk, Desain, dll..."
                                    className="h-12 rounded-lg border border-border focus:border-primary font-medium px-4 bg-white transition-all text-foreground shadow-sm text-sm"
                                />
                            </div>
                            <div className="grid gap-2.5">
                                <Label className="font-semibold text-xs text-foreground px-0.5">Tipe</Label>
                                <div className="flex bg-muted/60 border border-border/60 p-1 rounded-lg shadow-sm">
                                    <button type="button" className="flex-1 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground shadow-sm">Pribadi</button>
                                    <button type="button" className="flex-1 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground">Publik</button>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2.5">
                            <Label htmlFor="description" className="font-semibold text-xs text-foreground px-0.5">Deskripsi Proyek</Label>
                            <Textarea
                                id="description"
                                placeholder="Apa tujuan dari proyek ini?"
                                className="min-h-[140px] rounded-lg border border-border focus:border-primary resize-none p-4 font-normal text-sm bg-white transition-all text-foreground shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-border/40 flex items-center justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()} className="font-medium text-muted-foreground border border-border h-11 px-6 rounded-lg hover:bg-muted transition-all text-sm">Batal</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary text-primary-foreground font-semibold px-8 h-11 rounded-lg shadow-sm active:scale-95 transition-all text-sm">
                            Buat Proyek
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
