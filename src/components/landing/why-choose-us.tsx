"use client";

import Link from "next/link";
import { ArrowRight, Eye, SlidersHorizontal, StackSimple } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";

const principles = [
  {
    icon: Eye,
    title: "Clarity before decoration",
    text: "Important work stays easy to scan. The interface uses space, type, and hierarchy instead of visual noise.",
  },
  {
    icon: StackSimple,
    title: "One source of truth",
    text: "Project details, task status, ownership, and deadlines stay connected instead of spreading across separate notes.",
  },
  {
    icon: SlidersHorizontal,
    title: "Structure you can adjust",
    text: "Use your own categories, issue types, priorities, menus, and access rules as the team grows.",
  },
];

export function WhyChooseUs() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="principles" className="border-b border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          className="max-w-2xl"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-sm font-medium text-primary">Why Numpux</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Enough structure to stay aligned. No more than that.</h2>
        </motion.div>

        <div className="mt-10 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
          {principles.map((item, index) => (
            <motion.article
              key={item.title}
              className="bg-white p-6"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={reduceMotion ? undefined : { y: -3 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.4, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
            >
              <item.icon size={20} className="text-primary" />
              <h3 className="mt-5 text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </motion.article>
          ))}
        </div>

        <motion.div
          className="mt-12 flex flex-col justify-between gap-6 border-l-2 border-primary bg-white p-6 sm:flex-row sm:items-center sm:p-8"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <h3 className="text-lg font-semibold">Start with the work already on your desk.</h3>
            <p className="mt-1 text-sm text-muted-foreground">Create one project, add the next few tasks, and invite the people who need access.</p>
          </div>
          <Link href="/register" className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Create your workspace <ArrowRight size={16} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
