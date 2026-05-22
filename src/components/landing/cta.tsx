import Link from "next/link";
import { Highlighter } from "@/components/highlighter";

export function CTA() {
    return (
        <section className="py-24 bg-[#0A0A0A]">
            <div className="container max-w-5xl mx-auto px-8 text-center">
                <span className="inline-block px-4 py-1.5 rounded-sm bg-white/5 text-white/50 text-[10px] font-black mb-8 uppercase tracking-[0.25em] border border-white/10">
                    Get Started
                </span>

                <div className="relative z-10">
                    <h2 className="text-[32px] md:text-[48px] font-black tracking-[-0.03em] text-white font-heading leading-[1.1] mb-6 relative inline-block">
                        Siap Berhenti Menumpuk?
                        <Highlighter variant={3} className="text-white/10 -bottom-2" />
                    </h2>
                    <h2 className="text-[32px] md:text-[52px] font-black tracking-[-0.03em] text-white font-heading leading-[1.05] mb-6">
                        Mulai Produktif{" "}
                        <span className="relative inline-block">
                            <em className="not-italic text-accent">Hari Ini.</em>
                            <Highlighter variant={1} className="text-accent/30" />
                        </span>
                    </h2>
                </div>
                <p className="text-[15px] text-white/40 font-medium max-w-sm mx-auto mb-10 leading-[1.7]">
                    Bergabung dan nikmati akses penuh secara gratis selama masa Early Access.
                </p>
                <Link
                    href="/register"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-sm bg-accent text-white font-black text-[15px] hover:bg-white hover:text-[#0A0A0A] transition-all shadow-[0_0_40px_rgba(168,85,247,0.3)] active:scale-95"
                >

                    Daftar Gratis Sekarang
                    <span className="text-[13px]">→</span>
                </Link>
                <p className="text-[11px] text-white/20 font-bold mt-5 uppercase tracking-[0.2em]">
                    Tidak perlu kartu kredit · Akses penuh semua fitur
                </p>
            </div>
        </section>
    );
}
