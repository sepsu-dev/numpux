import { findProjects } from "@/app/(backend)/api/projects/query";
import { findTasks } from "@/app/(backend)/api/tasks/query";
import { findAllMasterData } from "@/app/(backend)/api/master-data/query";

export async function getDashboardAggregateData(userId?: string, requestedProjectId?: string) {
  const projects = await findProjects(userId);
  const effectiveProjectId = requestedProjectId || (projects.length === 1 ? projects[0].id : undefined);

  const [tasks, masterData] = await Promise.all([
    findTasks(userId, effectiveProjectId),
    findAllMasterData(),
  ]);
  const currentProject = effectiveProjectId ? projects.find((p) => p.id === effectiveProjectId) || null : null;

  const completedStatusIds = new Set(masterData.statuses.filter((status) => status.isCompleted).map((status) => status.id));
  const openStatuses = masterData.statuses.filter((status) => !status.isCompleted);
  const activeStatus = openStatuses[1] || openStatuses[0];
  const reviewStatus = openStatuses[2];
  const pendingStatus = openStatuses[0];
  const completedTasks = tasks.filter((task) => completedStatusIds.has(task.status)).length;
  const inProgressTasks = tasks.filter((task) => task.status === activeStatus?.id).length;
  const reviewTasks = tasks.filter((task) => task.status === reviewStatus?.id).length;
  const pendingTasks = tasks.filter((task) => task.status === pendingStatus?.id).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
          label: activeStatus?.name || "Active work",
          value: String(inProgressTasks),
          change: `${reviewTasks} in review`,
          up: inProgressTasks > 0,
        },
        {
          label: pendingStatus?.name || "Pending work",
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
          label: activeStatus?.name || "Active work",
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

  const priorityWeight = Object.fromEntries(masterData.priorities.map((priority) => [priority.id, priority.level]));
  const highPriorityThreshold = Math.max(1, ...masterData.priorities.map((priority) => priority.level - 1));
  const sortedTasks = [...tasks].sort((a, b) => {
    const pDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
    if (pDiff !== 0) return pDiff;
    return 0;
  });

  const priorityTasks = sortedTasks.slice(0, 5).map((t) => ({
    id: t.id,
    title: t.title,
    project: t.project,
    priority: masterData.priorities.find((priority) => priority.id === t.priority)?.name || t.priority,
    urgent: (priorityWeight[t.priority] || 0) >= highPriorityThreshold,
  }));

  const deadlines = tasks
    .filter((t) => !completedStatusIds.has(t.status) && Boolean(t.date))
    .slice(0, 5)
    .map((t) => ({
      title: t.title,
      due: t.date as string,
      active: t.status === activeStatus?.id,
    }));

  const sprintProgress = {
    sprintName: currentProject ? currentProject.title : (projects.length > 0 ? "All projects" : "Overall progress"),
    percentage: completionPercentage,
    completedCount: completedTasks,
    totalCount: totalTasks,
  };

  return {
    project: currentProject,
    metrics,
    weeklyActivity,
    priorityTasks,
    deadlines,
    sprintProgress,
  };
}
