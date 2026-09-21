import { NextResponse } from "next/server";
import { listTasks, listProjects } from "@/lib/store";

export async function GET() {
  const tasks = listTasks();
  const projects = listProjects();

  const completedTasks = tasks.filter((t) => t.status === "Selesai").length;
  const inProgressTasks = tasks.filter((t) => t.status === "Proses").length;
  const totalTasks = tasks.length;

  const metrics = [
    { label: "Total Proyek", value: String(projects.length), change: "+2", up: true },
    { label: "Tugas Selesai", value: String(completedTasks || 128), change: "+18%", up: true },
    { label: "Dalam Progress", value: String(inProgressTasks || 24), change: "-3", up: false },
    { label: "Anggota Tim", value: "8", change: "+1", up: true },
  ];

  const weeklyActivity = [
    { day: "Sen", commits: 12 },
    { day: "Sel", commits: 18 },
    { day: "Rab", commits: 15 },
    { day: "Kam", commits: 25 },
    { day: "Jum", commits: 20 },
    { day: "Sab", commits: 8 },
    { day: "Min", commits: 5 },
  ];

  const priorityTasks = tasks
    .filter((t) => t.priority === "Mendesak" || t.priority === "Tinggi")
    .slice(0, 3)
    .map((t) => ({
      id: t.id,
      title: t.title,
      project: t.project,
      urgent: t.priority === "Mendesak",
    }));

  const deadlines = [
    { title: "Deploy ke Production", due: "Besok, 09:00", active: true },
    { title: "Code Review PR #402", due: "26 Mei, 14:00", active: false },
  ];

  const sprintProgress = {
    sprintName: "Sprint #14",
    percentage: 72,
    completedCount: completedTasks,
    totalCount: totalTasks || 11,
  };

  return NextResponse.json({
    status: "success",
    data: {
      metrics,
      weeklyActivity,
      priorityTasks,
      deadlines,
      sprintProgress,
    },
  });
}
