"use client";

import { Layers, Calendar, Users, BarChart3 } from "lucide-react";

export function Features() {
    return (
        <section id="features" className="py-20 relative overflow-hidden bg-background">
            {/* Soft grid background */}
            <div className="absolute inset-0 bg-dot-grid pointer-events-none z-0" />

            <div className="container max-w-5xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-xl mx-auto mb-16">
                    <span className="inline-block text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground bg-primary/20 px-3 py-1 rounded-full mb-4">
                        Core Features
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                        Structured Project Management
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        Precision task management tools designed to keep your team focused, aligned, and shipping on schedule.
                    </p>
                </div>

                {/* Additional Features Grid - 4 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            title: "Kanban Boards",
                            desc: "Visualize workflow stages with an intuitive, drag-and-drop Kanban system built for rapid adjustments.",
                            icon: Layers,
                            color: "bg-rose-100 text-rose-700"
                        },
                        {
                            title: "Team Timelines",
                            desc: "Map milestones, sprint deadlines, and weekly deliverables across clear, synchronized schedules.",
                            icon: Calendar,
                            color: "bg-blue-100 text-blue-700"
                        },
                        {
                            title: "Instant Collaboration",
                            desc: "Invite teammates seamlessly, assign tasks in seconds, and track ownership with absolute transparency.",
                            icon: Users,
                            color: "bg-amber-100 text-amber-700"
                        },
                        {
                            title: "Progress Analytics",
                            desc: "Gain actionable visibility into sprint velocity, completion rates, and project health at a glance.",
                            icon: BarChart3,
                            color: "bg-emerald-100 text-emerald-700"
                        }
                    ].map((feature, idx) => (
                        <div key={idx} className="p-6 rounded-xl border border-border bg-white text-left crave-shadow flex flex-col justify-between hover:scale-[1.02] transition-all duration-300">
                            <div>
                                <div className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                                    <feature.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-bold text-foreground mb-2">{feature.title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}