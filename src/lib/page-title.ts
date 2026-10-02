const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/projects": "Projects",
  "/workspace": "Workspaces",
  "/monitoring": "Monitoring",
  "/reports": "Reports",
  "/notifications": "Notifications",
  "/tasks/backlog": "Backlog",
  "/tasks/kanban": "Board",
  "/profile": "Profile",
  "/master": "Settings",
  "/master/menus": "Navigation",
  "/master/user-privileges": "User Access",
  "/master/project-privileges": "Project Roles",
  "/master/categories": "Project Categories",
  "/master/issue-types": "Issue Types",
  "/master/priorities": "Priorities",
  "/master/statuses": "Statuses",
  "/master/sections": "Navigation Sections",
  "/master/users": "Users",
  "/master/audit-log": "Audit Log",
  "/master/trash": "Trash",
};

export function getPageTitle(pathname: string) {
  if (pathname.startsWith("/projects/new")) return "New project";
  if (pathname.startsWith("/projects/edit")) return "Edit project";
  if (pathname.startsWith("/tasks/new")) return "New task";
  if (pathname.startsWith("/tasks/edit")) return "Edit task";
  return PAGE_TITLES[pathname] || "Numpux";
}