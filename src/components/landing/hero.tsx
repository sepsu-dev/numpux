"use client";

import Link from "next/link";
import { ArrowRight, Check, Flag } from "@phosphor-icons/react";
import { motion } from "framer-motion";

const tasks = [
  { title: "Finish homepage copy", label: "Content", owner: "AK", accent: "bg-[#ffb000]" },
  { title: "Connect contact form", label: "Website", owner: "RM", accent: "bg-[#1677ff]" },
  { title: "Review mobile layout", label: "Design", owner: "SN", accent: "bg-[#00a86b]" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[#f7f8f3]">
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-10 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <div className="mb-6 inline-flex items-center gap-2.5 text-xs font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span>For personal work and small teams</span>
          </div>

          <h1 className="max-w-[680px] font-heading text-5xl font-medium leading-[1.04] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-[4rem]">
            Keep work simple.
            <span className="relative ml-3 inline-block whitespace-nowrap text-primary">
              Stay on track.
              <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-[#ffcf66]" />
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground">
            Organize projects, tasks, and priorities in one calm place. Use Numpux on your own or invite a small team when you are ready.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-[#067a4b]">
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" weight="bold" />
            </Link>
            <Link href="#workflow" className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-white px-6 text-sm font-medium text-foreground transition-colors hover:border-foreground/30">
              Take a quick look
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" weight="bold" /> Easy for solo work</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" weight="bold" /> Clear for small teams</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" weight="bold" /> No complex setup</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28, rotate: 1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto w-full max-w-[680px]"
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_18px_50px_rgba(17,29,20,0.07)]">
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3.5 sm:px-5">
              <span className="text-[11px] font-medium text-muted-foreground">Studio workspace</span>
              <span className="rounded-full bg-[#e8f5ee] px-2.5 py-1 text-[9px] font-medium text-[#367254]">On track</span>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <div className="mb-2 flex items-center gap-2"><span className="text-[10px] font-medium text-primary">Current project</span><span className="text-[11px] text-muted-foreground">Sep 22 - Oct 3</span></div>
                  <h2 className="font-heading text-xl font-medium tracking-tight sm:text-2xl">Refresh the studio website</h2>
                </div>
                <div className="min-w-32">
                  <div className="mb-1.5 flex justify-between text-[10px] font-semibold text-muted-foreground"><span>Progress</span><span className="text-foreground">68%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[68%] rounded-full bg-primary" /></div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <BoardColumn title="To do" count="2" tone="bg-[#7aabe8]"><MiniTask title="Choose project photos" label="Content" owner="JL" /><MiniTask title="Update service list" label="Planning" owner="AK" /></BoardColumn>
                <BoardColumn title="Doing" count="2" tone="bg-[#e7ad3d]" highlight>{tasks.slice(0, 2).map((task) => <MiniTask key={task.title} {...task} />)}</BoardColumn>
                <BoardColumn title="Done" count="2" tone="bg-primary"><MiniTask {...tasks[2]} /><div className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-[10px] font-medium text-muted-foreground">Move a task here</div></BoardColumn>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex -space-x-2">
                  {[["AK", "bg-[#d9f7e9] text-[#0b6845]"], ["RM", "bg-[#e4efff] text-[#1556a7]"], ["SN", "bg-[#fff0c7] text-[#745600]"], ["JL", "bg-[#f0e8ff] text-[#6338a5]"]].map(([name, color]) => <span key={name} className={`grid h-7 w-7 place-items-center rounded-full border-2 border-card text-[8px] font-medium ${color}`}>{name}</span>)}
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground"><Flag className="h-3.5 w-3.5 text-[#ff6b5f]" weight="fill" /> 2 tasks to check today</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BoardColumn({ title, count, tone, highlight = false, children }: { title: string; count: string; tone: string; highlight?: boolean; children: React.ReactNode }) {
  return <div className={`rounded-xl p-2.5 ${highlight ? "bg-[#f3f8f5]" : "bg-[#f6f7f4]"}`}><div className="mb-2.5 flex items-center justify-between px-1"><span className="flex items-center gap-1.5 text-[10px] font-medium text-foreground/70"><span className={`h-1.5 w-1.5 rounded-full ${tone}`} />{title}</span><span className="text-[10px] text-muted-foreground">{count}</span></div><div className="space-y-2">{children}</div></div>;
}

function MiniTask({ title, label, owner, accent }: { title: string; label: string; owner: string; accent?: string }) {
  return <div className="rounded-lg border border-border/70 bg-white p-3"><div className={`mb-2 h-1 w-7 rounded-full opacity-60 ${accent ?? "bg-muted-foreground/30"}`} /><p className="min-h-8 text-[11px] font-medium leading-4 text-foreground">{title}</p><div className="mt-3 flex items-center justify-between gap-2"><span className="text-[9px] text-muted-foreground">{label}</span><span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[7px] font-medium text-foreground/70">{owner}</span></div></div>;
}
