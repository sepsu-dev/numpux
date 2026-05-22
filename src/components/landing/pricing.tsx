import Link from "next/link";
import { Highlighter } from "@/components/highlighter";

export function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-white">
            <div className="container max-w-5xl mx-auto px-8">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="inline-block px-4 py-1.5 rounded-sm bg-accent/10 text-accent text-[10px] font-black mb-5 uppercase tracking-[0.25em] border border-accent/15">
                        Pricing
                    </span>
                    <h2 className="text-[32px] md:text-[48px] font-black tracking-[-0.03em] text-[#0A0A0A] font-heading leading-[1.1] mb-5">
                        Pilih Paket{" "}
                        <span className="relative inline-block">
                            <em className="not-italic text-accent">Yang Sesuai.</em>
                            <Highlighter variant={3} className="text-accent/30" />
                        </span>
                    </h2>
                    <p className="text-[15px] text-[#6B7280] font-medium leading-[1.7]">
                        Mulai dengan yang gratis selama Early Access. Tingkatkan efektivitas kerja Anda saat sudah siap mengelola proyek lebih pro.
                    </p>
                </div>

                <div className="max-w-md mx-auto relative group">
                    <div className="absolute -left-6 -top-6 w-20 h-20 text-accent/20 rotate-[-15deg] pointer-events-none group-hover:rotate-0 transition-transform">
                        <Highlighter variant={2} />
                    </div>
                    <div className="rounded-sm border-2 border-black/[0.08] bg-[#FAFAFA] p-8 text-center relative overflow-hidden hover:border-accent/40 transition-colors z-10">


                        <div className="absolute top-4 right-4">
                            <span className="bg-accent text-white text-[9px] font-black px-2.5 py-1.5 rounded-sm shadow uppercase tracking-widest">EARLY ACCESS</span>

                        </div>


                        <div className="mb-8">
                            <span className="relative inline-block text-[64px] font-black text-[#0A0A0A] leading-none tracking-tight">
                                Rp 0
                                <Highlighter variant={1} className="text-primary/10 bottom-0 top-auto translate-y-2 h-[40%]" />
                            </span>
                            <p className="text-[13px] text-[#6B7280] font-medium mt-6">per bulan</p>
                        </div>


                        <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                            {[
                                "Proyek Tidak Terbatas",
                                "Kolaborasi Tim",
                                "Penyimpanan Cloud",
                                "Board Kanban",
                                "Integrasi Kalender",
                                "Analitik Progres"
                            ].map((f) => (
                                <div key={f} className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[8px] shrink-0">✓</div>
                                    <span className="text-[12px] font-bold text-[#374151]">{f}</span>
                                </div>
                            ))}
                        </div>

                        <Link
                            href="/register"
                            className="w-full py-4 rounded-sm bg-[#0A0A0A] text-white font-black text-[15px] hover:bg-accent transition-colors shadow-[4px_4px_0_0_rgba(168,85,247,0.2)] hover:shadow-none flex items-center justify-center"
                        >
                            Daftar Sekarang, Gratis →
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
