import { initDb, pool } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import { errorResponse, internalServerErrorResponse, successResponse } from "@/lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  if (auth.user.role !== "superadmin") return errorResponse("Forbidden", 403);
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const entity = searchParams.get("entity") || "all";
    const params: unknown[] = [];
    const where: string[] = [];
    if (search) { params.push(`%${search}%`); where.push(`(LOWER(user_name) LIKE $${params.length} OR LOWER(summary) LIKE $${params.length})`); }
    if (entity !== "all") { params.push(entity); where.push(`entity_type = $${params.length}`); }
    params.push(200);
    const result = await pool.query(
      `SELECT id, user_id, user_name, action, entity_type, entity_id, summary, metadata, created_at
       FROM audit_logs ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY created_at DESC LIMIT $${params.length}`,
      params
    );
    return successResponse(result.rows.map((row) => ({ id: row.id, userId: row.user_id, userName: row.user_name, action: row.action, entityType: row.entity_type, entityId: row.entity_id, summary: row.summary, metadata: row.metadata, createdAt: row.created_at })));
  } catch (error) {
    console.error("GET /api/audit-log error:", error);
    return internalServerErrorResponse("Failed to load audit log");
  }
}
