"use client";

import { useState } from "react";
import { CaretDown, Question } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

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
        <section className="py-20 relative overflow-hidden bg-background">
            <div className="container max-w-5xl mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
                    {/* Left */}
                    <div className="lg:w-1/3 lg:sticky lg:top-28">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                            <Question className="w-3.5 h-3.5" />
                            FAQ
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
                            Common questions
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed font-normal">
                            Answers to common questions about accounts, workspaces, and privacy in Numpux.
                        </p>
                    </div>

                    {/* Right — accordion */}
                    <div className="flex-1 w-full space-y-3">
                        {faqs.map((item, idx) => {
                            const isOpen = openIndex === idx;
                            return (
                                <div
                                    key={idx}
                                    className="rounded-xl border border-border/80 bg-card overflow-hidden transition-colors hover:border-border shadow-2xs"
                                >
                                    <button
                                        onClick={() => toggleIndex(idx)}
                                        className="w-full flex items-center justify-between p-4.5 text-left font-medium text-sm text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                                    >
                                        <span>{item.q}</span>
                                        <CaretDown
                                            size={16}
                                            className={`text-muted-foreground transition-transform duration-200 shrink-0 ml-3 ${
                                                isOpen ? "rotate-180 text-primary" : ""
                                            }`}
                                        />
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                                className="border-t border-border/60 overflow-hidden"
                                            >
                                                <div className="p-4.5 text-left text-xs leading-relaxed text-muted-foreground font-normal">
                                                    {item.a}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}