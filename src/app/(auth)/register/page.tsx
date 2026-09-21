"use client";

import Link from "next/link";
import { User, Mail, Lock, ArrowLeft } from "lucide-react";
import { useActionState } from "react";
import { register } from "@/lib/actions";

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(register, undefined);

    return (
        <div className="min-h-screen bg-background flex flex-col bg-dot-grid relative">
            <div className="absolute top-6 left-6">
                <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </Link>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
                <div className="w-full max-w-[390px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-sans font-bold text-foreground tracking-tight">
                            Daftar Akun <span className="text-primary lowercase font-bold">numpux</span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2 font-normal">Mulai perjalanan produktivitas Anda gratis</p>
                    </div>

                    <div className="bg-white rounded-xl border border-border shadow-sm p-8 crave-shadow">
                        <form action={formAction} className="space-y-5">
                            <div className="space-y-1.5 text-left">
                                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Nama</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        name="name"
                                        placeholder="Nama Lengkap"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-stone-50/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-foreground placeholder:text-muted-foreground/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 text-left">
                                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="nama@email.com"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-stone-50/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-foreground placeholder:text-muted-foreground/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 text-left">
                                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Kata sandi</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-stone-50/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-foreground"
                                    />
                                </div>
                            </div>

                            {state?.message && (
                                <p className="text-sm font-semibold text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-lg px-3 py-2">
                                    {state.message}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full py-3.5 rounded-xl lime-glow-button text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-transform active:scale-95 shadow-sm"
                            >
                                {isPending ? "Memproses..." : "Daftar Gratis"}
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