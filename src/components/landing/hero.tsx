"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";

const sampleTasks = [
  { title: "Confirm release scope", meta: "Today", done: true },
  { title: "Review checkout flow", meta: "Maya", done: false },
  { title: "Prepare launch notes", meta: "Friday", done: false },
];

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:py-24">
        <motion.div
          className="max-w-2xl"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mb-5 text-sm font-medium text-primary">Project tracking without the busywork</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-[3.5rem]">
            Know what needs to happen next.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Numpux keeps projects, tasks, owners, and priorities in one place so your team can spend less time sorting work and more time finishing it.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="group inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
              Start with a project <ArrowRight size={16} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <a href="#workflow" className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-muted">
              See the workflow
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Create an account and set up your first board in a few minutes.</p>
        </motion.div>

        <motion.div
          className="border border-border bg-white p-5 sm:p-6"
          aria-label="Example project overview"
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-sm font-semibold">Website launch</p>
              <p className="mt-1 text-xs text-muted-foreground">6 of 9 tasks complete</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={14} /> 4 days left
            </span>
          </div>

          <div className="divide-y divide-border">
            {sampleTasks.map((task, index) => (
              <motion.div
                key={task.title}
                className="flex items-center justify-between gap-4 py-4"
                initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.32 + index * 0.08 }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`grid h-5 w-5 shrink-0 place-items-center border ${task.done ? "border-primary bg-primary text-white" : "border-input bg-white"}`}>
                    {task.done && <Check size={12} weight="bold" />}
                  </span>
                  <span className={`truncate text-sm ${task.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{task.title}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{task.meta}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-2 h-1.5 overflow-hidden bg-muted" aria-label="67% complete">
            <motion.div
              className="h-full bg-primary"
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: "66.6667%" }}
              transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
