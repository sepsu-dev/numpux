import { initDb, pool } from "@/db";
import { validateAdminAuth } from "@/lib/api-auth";
import { badRequestResponse, errorResponse, internalServerErrorResponse, successResponse } from "@/lib/response";

export async function GET(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  try {
    await initDb();
    const result = await pool.query(
      `SELECT w.id, w.name, w.slug, w.status, wm.role, wm.joined_at,
              (u.active_workspace_id = w.id) AS is_active,
              (SELECT COUNT(*)::int FROM workspace_members x WHERE x.workspace_id = w.id AND x.status = 'active' AND x.deleted_at IS NULL) AS members_count,
              (SELECT COUNT(*)::int FROM projects p WHERE p.workspace_id = w.id AND p.deleted_at IS NULL) AS projects_count
       FROM workspace_members wm
       JOIN workspaces w ON w.id = wm.workspace_id
       JOIN users u ON u.id = wm.user_id
       WHERE wm.user_id = $1 AND wm.status = 'active' AND wm.deleted_at IS NULL AND w.deleted_at IS NULL
       ORDER BY CASE wm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 WHEN 'member' THEN 3 ELSE 4 END, w.created_at ASC`,
      [auth.user.userId]
    );
    return successResponse(result.rows.map((row) => ({
      id: row.id, name: row.name, slug: row.slug, status: row.status, role: row.role,
      joinedAt: row.joined_at, membersCount: row.members_count, projectsCount: row.projects_count, isActive: row.is_active,
    })));
  } catch (error) {
    console.error("GET /api/workspaces error:", error);
    return internalServerErrorResponse("Failed to load workspaces");
  }
}

export async function POST(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  try {
    await initDb();
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 100) return badRequestResponse("Workspace name must contain 2 to 100 characters");
    const owned = await pool.query(`SELECT COUNT(*)::int AS count FROM workspace_members WHERE user_id = $1 AND role = 'owner' AND status = 'active' AND deleted_at IS NULL`, [auth.user.userId]);
    if (Number(owned.rows[0]?.count || 0) >= 3) return badRequestResponse("The free plan allows up to three owned workspaces");
    const id = crypto.randomUUID();
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "workspace"}-${id.slice(0, 8)}`;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const workspace = await client.query(`INSERT INTO workspaces (id, name, slug, created_by) VALUES ($1, $2, $3, $4) RETURNING id, name, slug, status`, [id, name, slug, auth.user.userId]);
      await client.query(`INSERT INTO workspace_members (id, workspace_id, user_id, role, status) VALUES ($1, $2, $3, 'owner', 'active')`, [crypto.randomUUID(), id, auth.user.userId]);
      await client.query(`UPDATE users SET active_workspace_id = COALESCE(active_workspace_id, $2) WHERE id = $1`, [auth.user.userId, id]);
      await client.query("COMMIT");
      return successResponse({ ...workspace.rows[0], role: "owner", membersCount: 1, projectsCount: 0 }, "Workspace created", { status: 201 });
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  } catch (error) {
    console.error("POST /api/workspaces error:", error);
    return internalServerErrorResponse("Failed to create workspace");
  }
}
