"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
    {
        q: "Is Numpux truly free to use?",
        a: "Yes, Numpux is 100% free with no hidden paywalls. You can create unlimited tasks, manage projects, and collaborate with your team without spending a dime."
    },
    {
        q: "Can I collaborate with team members?",
        a: "Absolutely. You can organize workspaces, assign owners to tasks, and monitor live progress across Kanban boards with real-time updates."
    },
    {
        q: "How does Numpux protect my data?",
        a: "All project and task records are encrypted using industry-standard HTTPS protocols, hosted on high-reliability cloud infrastructure with strict access controls."
    },
    {
        q: "Does Numpux work on mobile and tablet devices?",
        a: "Yes, Numpux is responsive by design. Whether you are on your smartphone, tablet, or desktop workstation, you get a seamless experience."
    },
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
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground bg-primary/20 px-3 py-1 rounded-full mb-4">
                            <HelpCircle className="w-3.5 h-3.5 text-green-800" />
                            FAQ
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-normal">
                            Find quick answers to common questions about workflows, security, and features in Numpux.
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
                                        className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm text-foreground hover:bg-stone-50 transition-colors cursor-pointer"
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
                                        <div className="p-5 text-left text-xs leading-relaxed text-muted-foreground font-normal">
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