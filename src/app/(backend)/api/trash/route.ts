import { initDb, pool } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";
import { badRequestResponse, errorResponse, internalServerErrorResponse, successResponse } from "@/lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  if (auth.user.role !== "superadmin") return errorResponse("Forbidden", 403);
  try {
    await initDb();
    const [users, projects, tasks, menus, sections, categories, issueTypes, priorities, statuses, projectStatuses] = await Promise.all([
      pool.query("SELECT id, name, email, deleted_at FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"),
      pool.query("SELECT id, title AS name, deleted_at FROM projects WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"),
      pool.query("SELECT id, COALESCE(task_key, id) AS item_key, title AS name, deleted_at FROM tasks WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"),
      pool.query("SELECT id, name, deleted_at FROM master_menus WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"),
      pool.query("SELECT id, name, deleted_at FROM master_sections WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"),
      pool.query("SELECT id, name, updated_at AS deleted_at FROM master_categories WHERE is_active = false"),
      pool.query("SELECT id, name, updated_at AS deleted_at FROM master_issue_types WHERE is_active = false"),
      pool.query("SELECT id, name, updated_at AS deleted_at FROM master_priorities WHERE is_active = false"),
      pool.query("SELECT id, name, updated_at AS deleted_at FROM master_statuses WHERE is_active = false"),
      pool.query("SELECT id, name, updated_at AS deleted_at FROM master_project_statuses WHERE is_active = false"),
    ]);
    return successResponse([
      ...users.rows.map((row) => ({ id: row.id, type: "user", name: row.name, detail: row.email, deletedAt: row.deleted_at })),
      ...projects.rows.map((row) => ({ id: row.id, type: "project", name: row.name, detail: "Project", deletedAt: row.deleted_at })),
      ...tasks.rows.map((row) => ({ id: row.id, type: "task", name: row.name, detail: row.item_key, deletedAt: row.deleted_at })),
      ...menus.rows.map((row) => ({ id: row.id, type: "menu", name: row.name, detail: "Navigation menu", deletedAt: row.deleted_at })),
      ...sections.rows.map((row) => ({ id: row.id, type: "section", name: row.name, detail: "Navigation section", deletedAt: row.deleted_at })),
      ...categories.rows.map((row) => ({ id: row.id, type: "category", name: row.name, detail: "Project category", deletedAt: row.deleted_at })),
      ...issueTypes.rows.map((row) => ({ id: row.id, type: "issueType", name: row.name, detail: "Issue type", deletedAt: row.deleted_at })),
      ...priorities.rows.map((row) => ({ id: row.id, type: "priority", name: row.name, detail: "Priority", deletedAt: row.deleted_at })),
      ...statuses.rows.map((row) => ({ id: row.id, type: "status", name: row.name, detail: "Task status", deletedAt: row.deleted_at })),
      ...projectStatuses.rows.map((row) => ({ id: row.id, type: "projectStatus", name: row.name, detail: "Project status", deletedAt: row.deleted_at })),
    ].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()));
  } catch (error) {
    console.error("GET /api/trash error:", error);
    return internalServerErrorResponse("Failed to load trash");
  }
}

export async function POST(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  if (auth.user.role !== "superadmin") return errorResponse("Forbidden", 403);
  try {
    const body = await request.json();
    const configs: Record<string, { table: string; softColumn: "deleted_at" | "is_active" }> = {
      user: { table: "users", softColumn: "deleted_at" }, project: { table: "projects", softColumn: "deleted_at" }, task: { table: "tasks", softColumn: "deleted_at" },
      menu: { table: "master_menus", softColumn: "deleted_at" }, section: { table: "master_sections", softColumn: "deleted_at" },
      category: { table: "master_categories", softColumn: "is_active" }, issueType: { table: "master_issue_types", softColumn: "is_active" }, priority: { table: "master_priorities", softColumn: "is_active" }, status: { table: "master_statuses", softColumn: "is_active" }, projectStatus: { table: "master_project_statuses", softColumn: "is_active" },
    };
    if (!configs[body.type] || typeof body.id !== "string" || !["restore", "delete"].includes(body.action)) return badRequestResponse("Invalid trash action");
    const { table, softColumn } = configs[body.type];
    if (body.action === "restore") {
      if (softColumn === "is_active") await pool.query(`UPDATE ${table} SET is_active = true, updated_at = NOW() WHERE id = $1`, [body.id]);
      else await pool.query(`UPDATE ${table} SET deleted_at = NULL${body.type === "user" ? ", account_status = 'active'" : ""}${body.type === "menu" ? ", is_active = true" : ""}${["user", "project", "task"].includes(body.type) ? ", updated_at = NOW()" : ""} WHERE id = $1`, [body.id]);
    } else {
      await pool.query(`DELETE FROM ${table} WHERE id = $1 AND ${softColumn === "is_active" ? "is_active = false" : "deleted_at IS NOT NULL"}`, [body.id]);
    }
    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: body.action === "restore" ? "restored" : "permanently_deleted", entityType: body.type, entityId: body.id, summary: `${body.action === "restore" ? "Restored" : "Permanently deleted"} ${body.type}` });
    return successResponse(null, body.action === "restore" ? "Item restored" : "Item permanently deleted");
  } catch {
    return internalServerErrorResponse("Failed to update trash item");
  }
}
