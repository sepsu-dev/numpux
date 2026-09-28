"use client";

import { ArrowUpRight, Eye, Lightning, SlidersHorizontal } from "@phosphor-icons/react";
import { motion } from "framer-motion";

const principles = [
  { icon: Eye, title: "Easy to understand", text: "Open Numpux and see what matters now. No crowded screens or long setup to get through.", color: "bg-[#e4efff] text-[#1556a7]" },
  { icon: Lightning, title: "Quick to update", text: "Add a task, set a priority, and move on. Everyday planning should only take a moment.", color: "bg-[#fff0c7] text-[#745600]" },
  { icon: SlidersHorizontal, title: "Flexible enough", text: "Keep things personal or share a project with a few people. Use only the structure that helps.", color: "bg-[#d9f7e9] text-[#0b6845]" },
];

export function WhyChooseUs() {
  return (
    <section id="principles" className="border-y border-border/70 bg-[#f8faf7] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="section-kicker">Made for a smaller scale</p>
            <h2 className="mt-4 max-w-2xl font-heading text-4xl font-medium leading-[1.08] tracking-[-0.03em] sm:text-[2.75rem]">Useful when working solo.<br />Clear when working together.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">Numpux is intentionally small and focused, so planning never becomes more work than the project itself.</p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {principles.map((item, index) => (
            <motion.article key={item.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: index * 0.08 }} className="rounded-xl border border-border/70 bg-white p-6 sm:p-7">
              <div className="flex items-start justify-between"><span className={`grid h-10 w-10 place-items-center rounded-lg ${item.color}`}><item.icon className="h-5 w-5" weight="bold" /></span><span className="font-heading text-xs font-semibold text-muted-foreground/50">0{index + 1}</span></div>
              <h3 className="mt-8 font-heading text-xl font-medium tracking-tight">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </motion.article>
          ))}
        </div>

        <div className="relative mt-14 overflow-hidden rounded-2xl border border-[#cce7d8] bg-[#edf8f1] px-6 py-9 text-foreground sm:px-9 sm:py-10 lg:flex lg:items-center lg:justify-between">
          <div className="relative max-w-2xl"><p className="text-xs font-medium text-primary">Start with one project</p><h3 className="mt-3 font-heading text-3xl font-medium leading-tight tracking-tight">Use it alone today. Invite your team when you need them.</h3></div>
          <a href="/register" className="relative mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-[#067a4b] lg:mt-0">Create your account <ArrowUpRight className="h-4 w-4" /></a>
        </div>
      </div>
    </section>
  );
}
