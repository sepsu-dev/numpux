import { pool } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import { badRequestResponse, errorResponse, successResponse } from "@/lib/response";
import { createNotification } from "@/lib/notifications";
import { recordAudit } from "@/lib/audit";

interface Props { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { id: workspaceId } = await params;
  const body = await request.json();
  const memberId = typeof body.memberId === "string" ? body.memberId : "";
  if (!memberId) return badRequestResponse("Target member is required");
  const client = await pool.connect();
  let targetUserId = "";
  try {
    await client.query("BEGIN");
    const owner = await client.query(`SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND role = 'owner' AND status = 'active' AND deleted_at IS NULL FOR UPDATE`, [workspaceId, auth.user.userId]);
    if (!owner.rows.length) { await client.query("ROLLBACK"); return errorResponse("Only the workspace owner can transfer ownership", 403); }
    const target = await client.query(`SELECT user_id FROM workspace_members WHERE workspace_id = $1 AND id = $2 AND status = 'active' AND deleted_at IS NULL FOR UPDATE`, [workspaceId, memberId]);
    if (!target.rows.length || target.rows[0].user_id === auth.user.userId) { await client.query("ROLLBACK"); return badRequestResponse("Select another active workspace member"); }
    targetUserId = target.rows[0].user_id;
    await client.query(`UPDATE workspace_members SET role = 'admin', updated_at = NOW() WHERE id = $1`, [owner.rows[0].id]);
    await client.query(`UPDATE workspace_members SET role = 'owner', updated_at = NOW() WHERE id = $1`, [memberId]);
    await client.query(`UPDATE workspaces SET created_by = $2, updated_at = NOW() WHERE id = $1`, [workspaceId, targetUserId]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  await createNotification({ userId: targetUserId, title: "Workspace ownership transferred", message: `${auth.user.name} transferred workspace ownership to you.`, link: "/workspace" });
  await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "workspace_ownership_transferred", entityType: "workspace", entityId: workspaceId, summary: "Transferred workspace ownership", metadata: { memberId, targetUserId } });
  return successResponse({ memberId, userId: targetUserId }, "Workspace ownership transferred");
}
