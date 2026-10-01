"use client";

import { motion, useReducedMotion } from "framer-motion";

const faqs = [
  {
    question: "What can I manage in Numpux?",
    answer: "You can create projects, break them into tasks, assign owners, set priorities and due dates, and move work across a Kanban board.",
  },
  {
    question: "Can I invite other people?",
    answer: "Yes. Project members can be added by email, and access can be controlled with user and project privileges.",
  },
  {
    question: "Can I adapt the workspace to our process?",
    answer: "Yes. Administrators can manage categories, issue types, priorities, navigation sections, and menu visibility.",
  },
  {
    question: "Does it work on smaller screens?",
    answer: "The interface adapts to desktop, tablet, and mobile layouts. For larger boards, a desktop screen is still the most comfortable option.",
  },
];

export function FAQ() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="faq" className="bg-white py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-sm font-medium text-primary">Questions</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">A few things worth knowing.</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Clear answers about what the product does today.</p>
        </motion.div>
        <div className="border-t border-border">
          {faqs.map((item, index) => (
            <motion.details
              key={item.question}
              className="group border-b border-border"
              open={index === 0}
              initial={reduceMotion ? false : { opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="text-lg font-normal text-muted-foreground transition-transform duration-200 group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-2xl pb-5 pr-10 text-sm leading-6 text-muted-foreground">{item.answer}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
