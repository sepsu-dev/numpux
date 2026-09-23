"use client";

import { Kanban, CalendarBlank, Users, ChartBar } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export function Features() {
    const featuresList = [
        {
            title: "Kanban Boards",
            desc: "Visualize workflow stages with an intuitive, drag-and-drop Kanban system built for rapid adjustments.",
            icon: Kanban,
        },
        {
            title: "Team Timelines",
            desc: "Map milestones, sprint deadlines, and weekly deliverables across clear, synchronized schedules.",
            icon: CalendarBlank,
        },
        {
            title: "Instant Collaboration",
            desc: "Invite teammates seamlessly, assign tasks in seconds, and track ownership with absolute transparency.",
            icon: Users,
        },
        {
            title: "Progress Analytics",
            desc: "Gain actionable visibility into sprint velocity, completion rates, and project health at a glance.",
            icon: ChartBar,
        }
    ];

    return (
        <section id="features" className="py-20 relative overflow-hidden bg-background">
            <div className="container max-w-5xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4 }}
                    className="text-center max-w-xl mx-auto mb-14"
                >
                    <span className="inline-block text-xs font-medium uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                        Features
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
                        Everything you need to deliver
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Thoughtful tools designed to keep engineering and product workflows focused, aligned, and shipping.
                    </p>
                </motion.div>

                {/* Additional Features Grid - 4 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {featuresList.map((feature, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.35, delay: idx * 0.08 }}
                            className="p-5 rounded-xl border border-border/80 bg-card text-left flex flex-col justify-between hover:border-border transition-all cursor-default shadow-2xs"
                        >
                            <div>
                                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-4 text-foreground/80">
                                    <feature.icon className="w-4 h-4 text-primary" />
                                </div>
                                <h3 className="text-sm font-semibold text-foreground mb-1.5">{feature.title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}