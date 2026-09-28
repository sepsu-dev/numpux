"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";

const faqs = [
  { q: "Can I use Numpux by myself?", a: "Yes. Numpux works well for personal projects, freelance work, study plans, or anything else that is easier with a clear task list." },
  { q: "What size team is it made for?", a: "Numpux is best for individuals and small teams that want a simple shared view of projects without an enterprise-sized setup." },
  { q: "What can I organize?", a: "You can manage projects, tasks, priorities, due dates, and simple Kanban boards. Invite members only to the projects they need." },
  { q: "Can I use it on mobile?", a: "Yes. The layout adapts to desktop, tablet, and mobile, so you can check or update work wherever you are." },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-card py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20 lg:px-10">
        <div>
          <p className="section-kicker">Good to know</p>
          <h2 className="mt-4 font-heading text-4xl font-medium leading-tight tracking-[-0.03em] sm:text-[2.75rem]">A few simple answers.</h2>
          <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">The easiest way to see if Numpux fits is to try it with one real project.</p>
        </div>

        <div className="border-t border-border">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.q} className="border-b border-border">
                <button type="button" onClick={() => setOpenIndex(isOpen ? null : index)} className="flex w-full items-center justify-between gap-6 py-5 text-left sm:py-6" aria-expanded={isOpen}>
                  <span className="font-heading text-lg font-medium tracking-tight sm:text-xl">{item.q}</span>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors ${isOpen ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}><CaretDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} weight="bold" /></span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden"><p className="max-w-2xl pb-6 pr-12 text-sm leading-7 text-muted-foreground">{item.a}</p></motion.div>}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
