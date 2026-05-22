"use client";

import Image from "next/image";
import Link from "next/link";
import { User, Mail, Lock } from "lucide-react";
import { Highlighter } from "@/components/highlighter";

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col relative">


            {/* Grid bg matching landing page */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <div className="flex-1 flex flex-col justify-center items-center px-4 relative z-10 py-12">
                <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Form Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-[28px] md:text-[36px] font-black tracking-[-0.03em] text-[#0A0A0A] leading-tight font-heading">
                            Buat Akun{" "}
                            <span className="relative inline-block">
                                <em className="not-italic text-accent">Gratis.</em>
                                <Highlighter variant={2} className="text-accent/25" />
                            </span>
                        </h1>
                        <p className="text-[13px] text-[#6B7280] font-medium mt-2">Mulai produktivitas Anda hari ini</p>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-sm border border-black/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-8">
                        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#6B7280]">Nama Lengkap</label>
                                <div className="relative group">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within:text-accent transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full pl-10 pr-4 py-3 rounded-sm border border-black/[0.08] bg-[#FAFAFA] focus:outline-none focus:border-accent/40 focus:bg-white transition-all text-sm font-medium text-[#0A0A0A] placeholder:text-[#D1D5DB]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#6B7280]">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within:text-accent transition-colors" />
                                    <input
                                        type="email"
                                        placeholder="nama@email.com"
                                        className="w-full pl-10 pr-4 py-3 rounded-sm border border-black/[0.08] bg-[#FAFAFA] focus:outline-none focus:border-accent/40 focus:bg-white transition-all text-sm font-medium text-[#0A0A0A] placeholder:text-[#D1D5DB]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#6B7280]">Sandi</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within:text-accent transition-colors" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 rounded-sm border border-black/[0.08] bg-[#FAFAFA] focus:outline-none focus:border-accent/40 focus:bg-white transition-all text-sm font-medium text-[#0A0A0A]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 rounded-sm bg-accent text-white font-black text-[14px] hover:bg-[#0A0A0A] transition-colors shadow-[3px_3px_0_0_rgba(168,85,247,0.2)] hover:shadow-none active:scale-[0.98] mt-2"
                            >
                                Buat Akun Sekarang
                            </button>
                        </form>
                    </div>

                    <p className="mt-7 text-center text-[13px] font-medium text-[#6B7280]">
                        Sudah punya akun?{" "}
                        <Link href="/login" className="font-black text-primary hover:underline underline-offset-4">
                            Masuk Saja
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
