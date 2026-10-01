import { pool } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import { errorResponse, notFoundResponse, successResponse } from "@/lib/response";

interface Props { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { id } = await params;
  const membership = await pool.query(`SELECT 1 FROM workspace_members wm JOIN workspaces w ON w.id = wm.workspace_id WHERE wm.workspace_id = $1 AND wm.user_id = $2 AND wm.status = 'active' AND wm.deleted_at IS NULL AND w.deleted_at IS NULL`, [id, auth.user.userId]);
  if (!membership.rows.length) return notFoundResponse("Workspace not found");
  await pool.query("UPDATE users SET active_workspace_id = $2, updated_at = NOW() WHERE id = $1", [auth.user.userId, id]);
  return successResponse({ id }, "Active workspace changed");
}
