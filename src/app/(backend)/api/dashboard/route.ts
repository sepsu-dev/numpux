import { NextResponse } from "next/server";
import { listTasks, listProjects } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") || undefined;

  const tasks = listTasks(projectId);
  const projects = listProjects();
  const currentProject = projectId ? projects.find((p) => p.id === projectId) : null;

  const completedTasks = tasks.filter((t) => t.status === "Selesai").length;
  const inProgressTasks = tasks.filter((t) => t.status === "Proses").length;
  const reviewTasks = tasks.filter((t) => t.status === "Peninjauan").length;
  const pendingTasks = tasks.filter((t) => t.status === "Belum Mulai").length;
  const totalTasks = tasks.length;

  const metrics = projectId && currentProject
    ? [
        { label: "Project Status", value: currentProject.status, change: currentProject.category, up: true },
        { label: "Completed Tasks", value: String(completedTasks), change: `${totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0}% done`, up: true },
        { label: "In Progress", value: String(inProgressTasks), change: `${reviewTasks} in review`, up: inProgressTasks > 0 },
        { label: "Backlog / Pending", value: String(pendingTasks), change: `${totalTasks} total`, up: false },
      ]
    : [
        { label: "Active Projects", value: String(projects.length), change: "+2 this mo", up: true },
        { label: "Completed Tasks", value: String(completedTasks), change: "+18%", up: true },
        { label: "In Progress", value: String(inProgressTasks), change: `${reviewTasks} reviewing`, up: true },
        { label: "Team Members", value: "8", change: "+1 active", up: true },
      ];

  const weeklyActivity = projectId
    ? [
        { day: "Mon", commits: Math.max(1, (totalTasks * 2) % 7 + 3) },
        { day: "Tue", commits: Math.max(2, (totalTasks * 3) % 9 + 4) },
        { day: "Wed", commits: Math.max(1, (totalTasks * 4) % 6 + 5) },
        { day: "Thu", commits: Math.max(3, (totalTasks * 5) % 11 + 6) },
        { day: "Fri", commits: Math.max(2, (totalTasks * 2) % 8 + 4) },
        { day: "Sat", commits: Math.max(0, (totalTasks) % 4) },
        { day: "Sun", commits: Math.max(0, (totalTasks) % 3) },
      ]
    : [
        { day: "Mon", commits: 12 },
        { day: "Tue", commits: 18 },
        { day: "Wed", commits: 15 },
        { day: "Thu", commits: 25 },
        { day: "Fri", commits: 20 },
        { day: "Sat", commits: 8 },
        { day: "Sun", commits: 5 },
      ];

  const priorityTasks = tasks
    .filter((t) => t.priority === "Mendesak" || t.priority === "Tinggi")
    .slice(0, 4)
    .map((t) => ({
      id: t.id,
      title: t.title,
      project: t.project || currentProject?.title || "General",
      urgent: t.priority === "Mendesak",
    }));

  const deadlines = [
    { title: projectId ? `Deliver ${currentProject?.title || "Milestone"} Beta` : "Deploy to Production Cluster", due: "Tomorrow, 09:00 AM", active: true },
    { title: projectId ? "Internal QA & Regression Pass" : "Security Audit & PR #402 Review", due: "May 26, 02:00 PM", active: false },
  ];

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const sprintProgress = {
    sprintName: projectId ? `${currentProject?.title || "Project"} Sprint` : "Sprint #14",
    percentage: completionPercentage,
    completedCount: completedTasks,
    totalCount: totalTasks,
  };

  return NextResponse.json({
    status: "success",
    data: {
      project: currentProject,
      metrics,
      weeklyActivity,
      priorityTasks,
      deadlines,
      sprintProgress,
    },
  });
}
