import { initDb, pool } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import { errorResponse, internalServerErrorResponse, successResponse } from "@/lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  try {
    await initDb();
    const hasGlobalAccess = auth.user.role === "superadmin";
    const { findPrimaryWorkspace } = await import("@/lib/workspace");
    const workspace = hasGlobalAccess ? null : await findPrimaryWorkspace(auth.user.userId);
    if (!hasGlobalAccess && (!workspace || !["owner", "admin"].includes(String(workspace.role).toLowerCase()))) {
      return errorResponse("Only workspace owners and administrators can view workspace reports", 403);
    }
    const access = hasGlobalAccess ? "TRUE" : "p.workspace_id = $1";
    const params = hasGlobalAccess ? [] : [workspace.id];
    const [summary, projects, priorities, workload] = await Promise.all([
      pool.query(`SELECT COUNT(DISTINCT p.id)::int AS projects, COUNT(t.id)::int AS tasks, COUNT(t.id) FILTER (WHERE ms.is_completed = true)::int AS completed, COUNT(t.id) FILTER (WHERE t.due_date IS NOT NULL AND t.due_date ~ '^\\d{4}-\\d{2}-\\d{2}' AND t.due_date::date < CURRENT_DATE AND COALESCE(ms.is_completed, false) = false)::int AS overdue FROM projects p LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL LEFT JOIN master_statuses ms ON ms.id = t.status WHERE p.deleted_at IS NULL AND ${access}`, params),
      pool.query(`SELECT p.id, p.title, COUNT(t.id)::int AS tasks, COUNT(t.id) FILTER (WHERE ms.is_completed = true)::int AS completed FROM projects p LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL LEFT JOIN master_statuses ms ON ms.id = t.status WHERE p.deleted_at IS NULL AND ${access} GROUP BY p.id ORDER BY tasks DESC, p.title`, params),
      pool.query(`SELECT t.priority AS name, COUNT(*)::int AS count FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND ${access} GROUP BY t.priority ORDER BY count DESC`, params),
      pool.query(`SELECT u.name, u.email, COUNT(t.id)::int AS tasks, COUNT(t.id) FILTER (WHERE ms.is_completed = true)::int AS completed FROM users u JOIN tasks t ON t.assignee_id = u.id AND t.deleted_at IS NULL JOIN projects p ON p.id = t.project_id AND p.deleted_at IS NULL LEFT JOIN master_statuses ms ON ms.id = t.status WHERE u.deleted_at IS NULL AND ${access} GROUP BY u.id ORDER BY tasks DESC, u.name`, params),
    ]);
    return successResponse({ summary: summary.rows[0], projects: projects.rows, priorities: priorities.rows, workload: workload.rows, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return internalServerErrorResponse("Failed to generate report");
  }
}
