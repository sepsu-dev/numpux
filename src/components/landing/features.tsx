"use client";

import { ArrowRight, CalendarCheck, ChatCircleDots, CheckCircle, Kanban, UsersThree } from "@phosphor-icons/react";
import { motion } from "framer-motion";

const steps = [
  { number: "01", icon: Kanban, title: "Write it down", copy: "Turn an idea into a clear task. Add a note, priority, or due date only when you need it.", note: "Everything in one place" },
  { number: "02", icon: UsersThree, title: "Make it clear", copy: "Working with others? Add an owner so everyone knows who is doing what without another long chat.", note: "Simple ownership" },
  { number: "03", icon: CalendarCheck, title: "Move it forward", copy: "See what is waiting, in progress, and finished. The board stays useful without constant upkeep.", note: "Progress at a glance" },
];

export function Features() {
  return (
    <section id="workflow" className="relative bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} className="lg:sticky lg:top-32 lg:self-start">
            <p className="section-kicker">Simple from day one</p>
            <h2 className="mt-4 max-w-md font-heading text-4xl font-medium leading-[1.08] tracking-[-0.03em] sm:text-[2.75rem]">Enough structure. Nothing extra.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">Start with a few tasks. Add a project or invite teammates only when it helps. Numpux grows with your work without making it feel heavier.</p>
            <a href="/register" className="group mt-7 inline-flex items-center gap-2 text-sm font-medium text-primary">Create your first project <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></a>
          </motion.div>

          <div className="border-t border-border">
            {steps.map((step, index) => (
              <motion.article key={step.number} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ delay: index * 0.08 }} className="group grid gap-5 border-b border-border py-8 sm:grid-cols-[56px_1fr_auto] sm:items-start sm:py-10">
                <span className="font-heading text-sm font-medium text-primary">{step.number}</span>
                <div>
                  <div className="mb-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#f0f3ee] text-primary"><step.icon className="h-[18px] w-[18px]" /></span><h3 className="font-heading text-2xl font-medium tracking-tight">{step.title}</h3></div>
                  <p className="max-w-xl text-sm leading-6 text-muted-foreground">{step.copy}</p>
                </div>
                <span className="w-fit rounded-full bg-[#f3f5f1] px-3 py-1.5 text-[10px] font-medium text-muted-foreground">{step.note}</span>
              </motion.article>
            ))}
          </div>
        </div>

        <div className="mt-20 overflow-hidden rounded-2xl border border-[#d7e4f5] bg-[#f5f8fc] text-foreground sm:mt-24">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
            <div className="relative flex flex-col justify-between border-b border-[#d7e4f5] p-7 sm:p-10 lg:min-h-[450px] lg:border-b-0 lg:border-r">
              <div className="relative">
                <p className="text-xs font-medium text-[#4e78aa]">Keep the details together</p>
                <h3 className="mt-5 max-w-md font-heading text-3xl font-medium leading-tight tracking-tight sm:text-4xl">One task. All the context.</h3>
                <p className="mt-5 max-w-md text-sm leading-7 text-[#3d5878]">Notes, checklists, owners, and due dates stay with the task. You spend less time looking for updates and more time doing the work.</p>
              </div>
              <div className="relative mt-12 flex items-center gap-3 text-xs font-medium text-[#58708e]"><ChatCircleDots className="h-5 w-5 text-[#6f9ed8]" weight="fill" /> Comments stay with the task</div>
            </div>

            <div className="m-3 rounded-xl bg-white p-4 text-[#111d14] sm:m-4 sm:p-6">
              <div className="flex items-center justify-between border-b border-[#dfe5da] pb-4">
                <div><p className="text-[10px] font-medium text-[#667469]">Task details</p><h4 className="mt-1.5 text-sm font-medium">Prepare the client handoff</h4></div>
                <span className="rounded-full bg-[#e8f5ee] px-2.5 py-1 text-[9px] font-medium text-[#367254]">In progress</span>
              </div>
              <div className="grid gap-5 py-5 sm:grid-cols-[1fr_150px]">
                <div>
                  <p className="text-[10px] font-medium text-[#829086]">Acceptance checklist</p>
                  <div className="mt-3 space-y-2.5">
                    {["Review final files", "Share project notes", "Schedule a check-in"].map((item, index) => (
                      <div key={item} className="flex items-center gap-2.5 rounded-lg border border-[#e2e7de] bg-white px-3 py-2.5 text-[11px] font-medium"><CheckCircle className={`h-4 w-4 ${index < 2 ? "text-[#15803d]" : "text-[#aab4ac]"}`} weight={index < 2 ? "fill" : "regular"} /><span className={index < 2 ? "text-[#79837b] line-through" : ""}>{item}</span></div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 border-l-0 border-[#dfe5da] sm:border-l sm:pl-5"><Meta label="Owner" value="Alya K." /><Meta label="Due date" value="Oct 03" /><Meta label="Priority" value="High" accent /></div>
              </div>
              <div className="rounded-xl border border-[#dfe5da] bg-white p-3.5">
                <div className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#eef4fb] text-[8px] font-medium text-[#4e78aa]">RM</span><p className="text-[11px] leading-5 text-[#5e6a61]"><strong className="font-medium text-[#111d14]">Rafi</strong> added the latest notes. Everything is ready for a final review.</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Meta({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div><p className="text-[9px] text-[#829086]">{label}</p><p className={`mt-1 text-[11px] font-medium ${accent ? "text-[#b87624]" : "text-[#29362c]"}`}>{value}</p></div>;
}
