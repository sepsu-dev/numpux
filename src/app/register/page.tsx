"use client";

import Link from "next/link";
import { User, Mail, Lock, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !password) {
            toast.error("Mohon isi semua bidang");
            return;
        }

        toast.success("Berhasil daftar! Mengalihkan...");
        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen bg-background flex flex-col bg-dot-grid relative">
            {/* Back link */}
            <div className="absolute top-6 left-6">
                <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </Link>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
                <div className="w-full max-w-[390px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-sans font-black text-foreground tracking-tight">
                            Daftar Akun <span className="text-primary lowercase font-black">numpux</span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2">Mulai perjalanan produktivitas Anda gratis</p>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-xl border border-border shadow-sm p-8 crave-shadow">
                        <form className="space-y-5" onSubmit={handleRegister}>
                            <div className="space-y-1.5 text-left">
                                <label className="text-xs font-black text-foreground uppercase tracking-wider">Nama</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        placeholder="Nama Lengkap"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-stone-50/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-foreground placeholder:text-muted-foreground/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 text-left">
                                <label className="text-xs font-black text-foreground uppercase tracking-wider">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        placeholder="nama@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-stone-50/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-foreground placeholder:text-muted-foreground/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 text-left">
                                <label className="text-xs font-black text-foreground uppercase tracking-wider">Kata sandi</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-stone-50/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-foreground"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 rounded-xl lime-glow-button text-primary-foreground font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                Daftar Gratis
                            </button>
                        </form>
                    </div>

                    <p className="mt-6 text-center text-sm text-muted-foreground font-medium">
                        Sudah punya akun?{" "}
                        <Link href="/login" className="font-bold text-primary hover:opacity-85">
                            Masuk
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}