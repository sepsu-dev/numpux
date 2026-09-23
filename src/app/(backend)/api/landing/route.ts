import { NextResponse } from "next/server";

export interface LandingData {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    cta: string;
    mockup: {
      url: string;
      boardTitle: string;
      workspace: string;
      progress: number;
    };
  };
  features: Array<{
    title: string;
    desc: string;
    category: string;
  }>;
  benefits: Array<{
    title: string;
    desc: string;
  }>;
  testimonials: Array<{
    text: string;
    author: string;
    role: string;
    avatar: string;
  }>;
  faqs: Array<{
    q: string;
    a: string;
  }>;
}

const landingData: LandingData = {
  hero: {
    badge: "100% FREE FOREVER",
    title: "Organize Tasks Effortlessly",
    subtitle: "Deliver Projects Faster",
    description: "Modern task and project workspace built for developers, designers, and fast-moving teams. Unlimited boards, zero bloat, and completely free.",
    cta: "Start for Free",
    mockup: {
      url: "numpux.app/dashboard",
      boardTitle: "Landing Redesign",
      workspace: "Main Workspace",
      progress: 78,
    },
  },
  features: [
    {
      title: "Kanban Boards",
      desc: "Visualize workflow stages with an intuitive, drag-and-drop Kanban system built for rapid adjustments.",
      category: "Workflow",
    },
    {
      title: "Team Timelines",
      desc: "Map milestones, sprint deadlines, and weekly deliverables across clear, synchronized schedules.",
      category: "Schedule",
    },
    {
      title: "Instant Collaboration",
      desc: "Invite teammates seamlessly, assign tasks in seconds, and track ownership with absolute transparency.",
      category: "Team",
    },
    {
      title: "Progress Analytics",
      desc: "Gain actionable visibility into sprint velocity, completion rates, and project health at a glance.",
      category: "Analytics",
    },
  ],
  benefits: [
    {
      title: "Distraction-Free Focus",
      desc: "A clean, minimalist layout with zero ad noise. Focus 100% on high-value execution without cognitive clutter.",
    },
    {
      title: "100% Free Forever",
      desc: "All core capabilities—from responsive Kanban boards to collaborative timelines—are yours with no hidden fees.",
    },
    {
      title: "Enterprise-Grade Privacy",
      desc: "Your data is safeguarded with robust HTTPS standards and isolated environments so your workspaces stay confidential.",
    },
  ],
  testimonials: [
    {
      text: "The Kanban board is exceptionally smooth. It gives me clarity on design deliverables without getting bogged down by useless settings.",
      author: "Kristin Watson",
      role: "Lead Product Designer",
      avatar: "🎨",
    },
    {
      text: "As a software engineer, speed is paramount. Numpux is lightweight, snappy, and lets me track sprint tasks with zero friction.",
      author: "Alex Chen",
      role: "Senior Fullstack Engineer",
      avatar: "💻",
    },
    {
      text: "Managing multiple campaign launches used to be chaotic. With Numpux, the timelines keep our entire cross-functional team aligned.",
      author: "Sarah Jenkins",
      role: "Growth & Product Marketing",
      avatar: "📈",
    },
  ],
  faqs: [
    {
      q: "Is Numpux truly free to use?",
      a: "Yes, Numpux is 100% free with no hidden paywalls. You can create unlimited tasks, manage projects, and collaborate with your team without spending a dime.",
    },
    {
      q: "Can I collaborate with team members?",
      a: "Absolutely. You can organize workspaces, assign owners to tasks, and monitor live progress across Kanban boards with real-time updates.",
    },
    {
      q: "How does Numpux protect my data?",
      a: "All project and task records are encrypted using industry-standard HTTPS protocols, hosted on high-reliability cloud infrastructure with strict access controls.",
    },
    {
      q: "Does Numpux work on mobile and tablet devices?",
      a: "Yes, Numpux is responsive by design. Whether you are on your smartphone, tablet, or desktop workstation, you get a seamless experience.",
    },
  ],
};

import { validatePublicKey } from "@/lib/api-auth";

export async function GET(request: Request) {
  const { isValid } = validatePublicKey(request);
  if (!isValid) {
    return NextResponse.json(
      {
        status: "error",
        message: "Unauthorized. Missing or invalid public key. Provide 'X-Public-Key' header or '?public_key=' query parameter.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: "success",
    data: landingData,
  });
}
