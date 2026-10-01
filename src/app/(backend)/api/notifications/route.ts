import { initDb, pool } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import { badRequestResponse, errorResponse, internalServerErrorResponse, successResponse } from "@/lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  try {
    await initDb();
    await pool.query(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      SELECT gen_random_uuid(), $1::varchar,
        CASE WHEN (CASE WHEN t.due_date ~ '^\\d{4}-\\d{2}-\\d{2}' THEN t.due_date::date END) < CURRENT_DATE THEN 'Task overdue' ELSE 'Task due soon' END,
        COALESCE(t.task_key, 'Task') || ': ' || t.title,
        'warning', '/tasks/kanban?projectId=' || t.project_id
      FROM tasks t
      LEFT JOIN master_statuses ms ON ms.id = t.status
      WHERE t.assignee_id = $1::varchar AND t.deleted_at IS NULL AND COALESCE(ms.is_completed, false) = false
        AND (CASE WHEN t.due_date ~ '^\\d{4}-\\d{2}-\\d{2}' THEN t.due_date::date END) <= CURRENT_DATE + 1
        AND NOT EXISTS (
          SELECT 1 FROM notifications n WHERE n.user_id = $1::varchar
            AND n.message = COALESCE(t.task_key, 'Task') || ': ' || t.title
            AND n.created_at >= CURRENT_DATE
        )
    `, [auth.user.userId]);
    const result = await pool.query(
      `SELECT id, title, message, type, link, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [auth.user.userId]
    );
    const unread = result.rows.filter((row) => !row.is_read).length;
    return successResponse({ unread, items: result.rows.map((row) => ({ id: row.id, title: row.title, message: row.message, type: row.type, link: row.link, isRead: row.is_read, createdAt: row.created_at })) });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return internalServerErrorResponse("Failed to load notifications");
  }
}

export async function POST(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  try {
    const body = await request.json();
    if (body.action === "read_all") {
      await pool.query("UPDATE notifications SET is_read = true WHERE user_id = $1", [auth.user.userId]);
    } else if (body.action === "read" && typeof body.id === "string") {
      await pool.query("UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2", [body.id, auth.user.userId]);
    } else if (body.action === "delete" && typeof body.id === "string") {
      await pool.query("DELETE FROM notifications WHERE id = $1 AND user_id = $2", [body.id, auth.user.userId]);
    } else return badRequestResponse("Invalid notification action");
    return successResponse(null, "Notification updated");
  } catch {
    return internalServerErrorResponse("Failed to update notification");
  }
}
