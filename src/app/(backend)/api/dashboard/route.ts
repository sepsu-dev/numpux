import { NextResponse } from "next/server";
import { listTasks, listProjects } from "@/lib/store";
import { validatePublicKey, getOptionalAuthUser } from "@/lib/api-auth";

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

  const authUser = await getOptionalAuthUser(request);
  const { searchParams } = new URL(request.url);
  const requestedProjectId = searchParams.get("projectId") || undefined;

  const projects = await listProjects(authUser?.userId);
  // If user has only 1 project and no explicit projectId query param, auto-select it
  const effectiveProjectId = requestedProjectId || (projects.length === 1 ? projects[0].id : undefined);

  const tasks = await listTasks(authUser?.userId, effectiveProjectId);
  const currentProject = effectiveProjectId ? projects.find((p) => p.id === effectiveProjectId) : null;

  const completedTasks = tasks.filter((t) => t.status === "Done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const reviewTasks = tasks.filter((t) => t.status === "Review").length;
  const pendingTasks = tasks.filter((t) => t.status === "To Do").length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Real Metrics based on project context or workspace context
  const metrics = currentProject
    ? [
        {
          label: "Project Status",
          value: currentProject.status,
          change: currentProject.category || "Active",
          up: currentProject.status === "Active" || currentProject.status === "Completed",
        },
        {
          label: "Completed Tasks",
          value: String(completedTasks),
          change: `${completionPercentage}% done`,
          up: completedTasks > 0,
        },
        {
          label: "In Progress",
          value: String(inProgressTasks),
          change: `${reviewTasks} in review`,
          up: inProgressTasks > 0,
        },
        {
          label: "Pending Backlog",
          value: String(pendingTasks),
          change: `${totalTasks} total tasks`,
          up: pendingTasks === 0,
        },
      ]
    : [
        {
          label: "Total Projects",
          value: String(projects.length),
          change: projects.length > 0 ? `${projects.filter((p) => p.status === "Active").length} active` : "No projects",
          up: projects.length > 0,
        },
        {
          label: "Completed Tasks",
          value: String(completedTasks),
          change: `${completionPercentage}% done`,
          up: completedTasks > 0,
        },
        {
          label: "In Progress",
          value: String(inProgressTasks),
          change: `${reviewTasks} in review`,
          up: inProgressTasks > 0,
        },
        {
          label: "Pending Tasks",
          value: String(pendingTasks),
          change: `${totalTasks} total tasks`,
          up: pendingTasks === 0,
        },
      ];

  // Calculate REAL weekly activity by day of the week based on created_at or updated tasks
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const activityMap: Record<string, number> = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };

  tasks.forEach((t) => {
    if (t.createdAt) {
      const d = new Date(t.createdAt);
      const dayName = daysOfWeek[d.getDay()];
      if (activityMap[dayName] !== undefined) {
        activityMap[dayName] += 1;
      }
    }
  });

  const weeklyActivity = [
    { day: "Mon", commits: activityMap.Mon },
    { day: "Tue", commits: activityMap.Tue },
    { day: "Wed", commits: activityMap.Wed },
    { day: "Thu", commits: activityMap.Thu },
    { day: "Fri", commits: activityMap.Fri },
    { day: "Sat", commits: activityMap.Sat },
    { day: "Sun", commits: activityMap.Sun },
  ];

  // REAL Priority tasks (sorted by urgent/high first, then remaining)
  const priorityWeight: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
  const sortedTasks = [...tasks].sort((a, b) => {
    const pDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
    if (pDiff !== 0) return pDiff;
    return 0;
  });

  const priorityTasks = sortedTasks.slice(0, 5).map((t) => ({
    id: t.id,
    title: t.title,
    project: t.project,
    urgent: t.priority === "Urgent" || t.priority === "High",
  }));

  // REAL upcoming deadlines from tasks with due date
  const deadlines = tasks
    .filter((t) => t.status !== "Done" && Boolean(t.date))
    .slice(0, 5)
    .map((t) => ({
      title: t.title,
      due: t.date as string,
      active: t.status === "In Progress",
    }));

  const sprintProgress = {
    sprintName: currentProject ? currentProject.title : (projects.length > 0 ? "All Projects Sprint" : "No Project"),
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
