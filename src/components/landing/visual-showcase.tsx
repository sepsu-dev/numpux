import Link from "next/link";
import { Highlighter } from "@/components/highlighter";

export function VisualShowcase() {
    return (
        <section className="py-24 bg-white">
            <div className="container max-w-5xl mx-auto px-8">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Text */}
                    <div className="flex-1 text-left">
                        <span className="inline-block px-4 py-1.5 rounded-sm bg-accent/10 text-accent text-[10px] font-black mb-6 uppercase tracking-[0.25em] border border-accent/15">
                            Workflow
                        </span>

                        <h2 className="text-[32px] md:text-[44px] font-black tracking-[-0.03em] text-[#0A0A0A] font-heading leading-[1.1] mb-6">
                            Satu Tempat <br />
                            <span className="relative inline-block">
                                <em className="not-italic text-accent">Semua Terkendali.</em>
                                <Highlighter variant={2} className="text-accent/25" />
                            </span>
                        </h2>
                        <p className="text-[15px] text-[#6B7280] font-medium leading-[1.7] mb-8 max-w-sm">
                            Numpux beradaptasi dengan cara kerja tim Anda, bukan sebaliknya. Alihkan perspektif sesuai kebutuhan.
                        </p>

                        <ul className="space-y-5">
                            {[
                                { label: "Visual Kanban", desc: "Pantau alur kerja dengan kejelasan penuh." },
                                { label: "Priority Engine", desc: "Fokus pada hal yang paling berdampak." },
                                { label: "Timeline Strategis", desc: "Rencanakan milestone dengan presisi." },
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-4">
                                    <div className="w-7 h-7 rounded-sm bg-[#0A0A0A] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                                        0{i + 1}
                                    </div>

                                    <div>
                                        <p className="text-[14px] font-black text-[#0A0A0A]">{item.label}</p>
                                        <p className="text-[13px] text-[#6B7280] font-medium">{item.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <Link href="/register" className="inline-flex items-center gap-2 mt-10 text-[13px] font-black text-accent hover:underline underline-offset-4">
                            Coba Sekarang →
                        </Link>
                    </div>

                    {/* Visual */}
                    <div className="flex-1 w-full relative">
                        <div className="absolute -top-10 -right-10 w-32 h-32 text-accent/10 rotate-12 pointer-events-none">
                            <Highlighter variant={3} />
                        </div>
                        <div className="rounded-sm border-2 border-black/[0.08] bg-[#FAFAFA] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)] relative z-10">

                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mei 2026</span>
                                <div className="flex gap-1">
                                    <div className="w-5 h-5 rounded-sm bg-black/[0.04] flex items-center justify-center text-[10px]">‹</div>
                                    <div className="w-5 h-5 rounded-sm bg-black/[0.04] flex items-center justify-center text-[10px]">›</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-3">
                                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                                    <div key={i} className="text-center text-[9px] font-black text-muted-foreground/50 uppercase">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: 35 }, (_, i) => {
                                    const day = i - 3;
                                    const isToday = day === 22;
                                    const hasEvent = [5, 12, 19, 25, 28].includes(day);
                                    if (day < 1 || day > 31) return <div key={i} className="aspect-square" />;
                                    return (
                                        <div key={i} className={`aspect-square flex items-center justify-center rounded-sm text-[11px] font-bold relative
                                            ${isToday ? "bg-accent text-white shadow-md" : "hover:bg-black/[0.04] text-[#0A0A0A]"}
                                        `}>
                                            {day}
                                            {hasEvent && !isToday && (
                                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 space-y-2">
                                {[
                                    { label: "Kick-off Meeting", time: "9:00", color: "bg-primary/10 text-primary border-primary/20" },
                                    { label: "Review Design Sprint", time: "14:00", color: "bg-accent/10 text-accent border-accent/20" },
                                ].map((ev, i) => (
                                    <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-sm border text-[11px] font-bold ${ev.color}`}>

                                        <span className="opacity-60 shrink-0">{ev.time}</span>
                                        <span>{ev.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}