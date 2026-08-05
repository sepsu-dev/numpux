"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
    { q: "Apakah Numpux benar-benar gratis?", a: "Ya, Numpux 100% gratis digunakan selamanya. Anda dapat membuat tugas, mengelola proyek, dan berkolaborasi tanpa dipungut biaya." },
    { q: "Bisa digunakan untuk kolaborasi tim?", a: "Tentu saja. Anda dapat mengundang rekan kerja atau anggota tim Anda ke dalam workspace proyek untuk memantau pengerjaan tugas secara real-time." },
    { q: "Bagaimana Numpux menjaga keamanan data saya?", a: "Semua data proyek dan tugas Anda dienkripsi secara aman menggunakan protokol HTTPS standar industri dan disimpan di server cloud yang andal." },
    { q: "Apakah Numpux responsif di perangkat mobile?", a: "Ya, Numpux dirancang dengan antarmuka yang sangat responsif, sehingga Anda bisa mengelola tugas Anda dengan nyaman melalui smartphone, tablet, maupun komputer." },
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleIndex = (idx: number) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <section className="py-24 relative overflow-hidden bg-background">
            {/* Soft grid background */}
            <div className="absolute inset-0 bg-dot-grid pointer-events-none z-0" />

            <div className="container max-w-5xl mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row gap-16 items-start">
                    {/* Left */}
                    <div className="lg:w-1/3 lg:sticky lg:top-32">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground bg-primary/20 px-3.5 py-1.5 rounded-xl mb-4">
                            <HelpCircle className="w-3.5 h-3.5 text-green-800" />
                            FAQ
                        </span>
                        <h2 className="text-3xl md:text-4xl font-sans font-black text-foreground tracking-tight mb-4">
                            Pertanyaan Umum
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Temukan jawaban cepat untuk pertanyaan yang sering diajukan mengenai Numpux.
                        </p>
                    </div>

                    {/* Right — accordion */}
                    <div className="flex-1 w-full space-y-3.5">
                        {faqs.map((item, idx) => {
                            const isOpen = openIndex === idx;
                            return (
                                <div
                                    key={idx}
                                    className="rounded-xl border border-border bg-white overflow-hidden transition-all duration-300 hover:border-foreground/20 crave-shadow"
                                >
                                    <button
                                        onClick={() => toggleIndex(idx)}
                                        className="w-full flex items-center justify-between p-5 text-left font-bold text-xs text-foreground hover:bg-stone-50 transition-colors cursor-pointer"
                                    >
                                        <span>{item.q}</span>
                                        <ChevronDown
                                            size={16}
                                            className={`text-muted-foreground transition-transform duration-300 ${
                                                isOpen ? "rotate-180 text-primary" : ""
                                            }`}
                                        />
                                    </button>

                                    <div
                                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                            isOpen ? "max-h-40 border-t border-stone-100" : "max-h-0"
                                        }`}
                                    >
                                        <div className="p-5 text-left text-xs font-bold leading-relaxed text-muted-foreground">
                                            {item.a}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}