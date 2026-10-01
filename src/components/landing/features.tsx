"use client";

import { CheckSquare, Columns, FolderSimple, UsersThree } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";

const steps = [
  {
    icon: FolderSimple,
    number: "01",
    title: "Set up the project",
    text: "Give the work a clear name, category, and short description. Keep scope visible from the start.",
  },
  {
    icon: CheckSquare,
    number: "02",
    title: "Turn it into tasks",
    text: "Add owners, due dates, priorities, and enough context for someone else to pick up the work.",
  },
  {
    icon: Columns,
    number: "03",
    title: "Move work forward",
    text: "Use the board to see what is waiting, in progress, under review, or finished.",
  },
];

export function Features() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="workflow" className="border-b border-border bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-sm font-medium text-primary">A straightforward workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">From idea to done, without extra ceremony.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              Numpux gives everyday project work a clear home. Start small, then add structure only when you need it.
            </p>
          </motion.div>

          <div className="border-t border-border">
            {steps.map((step, index) => (
              <motion.article
                key={step.number}
                className="grid grid-cols-[40px_1fr] gap-4 border-b border-border py-6 sm:grid-cols-[56px_180px_1fr] sm:items-start"
                initial={reduceMotion ? false : { opacity: 0, x: 14 }}
                whileInView={{ opacity: 1, x: 0 }}
                whileHover={reduceMotion ? undefined : { x: 3 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
              >
                <step.icon size={20} className="mt-0.5 text-primary" />
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="col-start-2 text-sm leading-6 text-muted-foreground sm:col-start-3">{step.text}</p>
              </motion.article>
            ))}
          </div>
        </div>

        <div className="mt-14 grid border border-border bg-background sm:grid-cols-3">
          {[
            { icon: FolderSimple, title: "Project view", text: "See scope, status, and progress together." },
            { icon: Columns, title: "Task board", text: "Drag work between clear stages." },
            { icon: UsersThree, title: "Team access", text: "Invite people and assign responsibility." },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              className={`p-5 ${index > 0 ? "border-t border-border sm:border-l sm:border-t-0" : ""}`}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
            >
              <item.icon size={18} className="mb-3 text-primary" />
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
