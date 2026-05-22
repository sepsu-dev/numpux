import { Highlighter } from "@/components/highlighter";

const faqs = [
    { q: "Apakah benar-benar gratis?", a: "Ya, 100% gratis selama masa early access." },
    { q: "Bisa digunakan untuk tim?", a: "Numpux dirancang untuk kolaborasi tim dari skala kecil hingga enterprise." },
    { q: "Seberapa aman data saya?", a: "Data dienkripsi dengan standar industri. Keamanan adalah prioritas utama kami." },
    { q: "Tersedia di mobile?", a: "Web app Numpux sepenuhnya responsif dan optimal di semua perangkat." },
];

export function FAQ() {
    return (
        <section className="py-24 bg-[#F9FAFB]">
            <div className="container max-w-5xl mx-auto px-8">
                <div className="flex flex-col lg:flex-row gap-16 items-start">
                    {/* Left */}
                    <div className="lg:w-1/3 lg:sticky lg:top-32">
                        <span className="inline-block px-4 py-1.5 rounded-sm bg-accent/10 text-accent text-[10px] font-black mb-5 uppercase tracking-[0.25em] border border-accent/15">
                            Pusat Bantuan
                        </span>
                        <h2 className="text-[32px] md:text-[40px] font-black tracking-[-0.03em] text-[#0A0A0A] font-heading leading-[1.1] mb-4">
                            Pertanyaan<br />
                            <span className="relative inline-block">
                                Umum.
                                <Highlighter variant={2} className="text-primary/25" />
                            </span>
                        </h2>
                        <p className="text-[14px] text-[#6B7280] font-medium leading-[1.7]">
                            Tidak menemukan jawaban? Hubungi kami kapan saja.
                        </p>
                    </div>

                    <div className="flex-1 space-y-4">
                        {faqs.map((item, i) => (
                            <div key={i} className="p-6 rounded-sm bg-white border border-black/[0.06] hover:border-black/15 transition-colors">

                                <h4 className="text-[15px] font-black text-[#0A0A0A] mb-2">{item.q}</h4>
                                <p className="text-[13px] text-[#6B7280] font-medium leading-[1.6]">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
