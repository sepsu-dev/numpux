import { createHash, randomBytes } from "crypto";
import { pool } from "@/db";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createProjectInvitation(input: {
  projectId: string;
  workspaceId: string;
  email: string;
  projectRole: string;
  invitedBy: string;
}) {
  const email = input.email.trim().toLowerCase();
  const token = randomBytes(32).toString("base64url");
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE invitations SET status = 'revoked', updated_at = NOW()
       WHERE project_id = $1 AND LOWER(email) = $2 AND status = 'pending'`,
      [input.projectId, email]
    );
    const result = await client.query(
      `INSERT INTO invitations (
         id, workspace_id, project_id, email, workspace_role, project_role,
         invited_by, token_hash, status, expires_at
       ) VALUES ($1, $2, $3, $4, 'member', $5, $6, $7, 'pending', $8)
       RETURNING id, workspace_id, project_id, email, project_role, status, expires_at, created_at`,
      [id, input.workspaceId, input.projectId, email, input.projectRole, input.invitedBy, hashToken(token), expiresAt]
    );
    await client.query("COMMIT");
    return { ...result.rows[0], token };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findPendingProjectInvitations(projectId: string) {
  const result = await pool.query(
    `SELECT i.id, i.email, i.project_role, i.status, i.expires_at, i.created_at,
            inviter.name AS invited_by_name
     FROM invitations i
     JOIN users inviter ON inviter.id = i.invited_by
     WHERE i.project_id = $1 AND i.status = 'pending' AND i.expires_at > NOW()
     ORDER BY i.created_at DESC`,
    [projectId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    projectRole: row.project_role,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    invitedByName: row.invited_by_name,
  }));
}

export async function findInvitationByToken(token: string) {
  const result = await pool.query(
    `SELECT i.id, i.workspace_id, i.project_id, i.email, i.workspace_role,
            i.project_role, i.invited_by, i.status, i.expires_at, w.name AS workspace_name,
            p.title AS project_name, inviter.name AS inviter_name
     FROM invitations i
     JOIN workspaces w ON w.id = i.workspace_id
     LEFT JOIN projects p ON p.id = i.project_id
     JOIN users inviter ON inviter.id = i.invited_by
     WHERE i.token_hash = $1 LIMIT 1`,
    [hashToken(token)]
  );
  if (!result.rows.length) return null;
  const row = result.rows[0];
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    projectId: row.project_id as string | null,
    email: row.email as string,
    workspaceRole: row.workspace_role as string,
    projectRole: row.project_role as string | null,
    invitedBy: row.invited_by as string,
    status: row.status as string,
    expiresAt: row.expires_at as Date,
    workspaceName: row.workspace_name as string,
    projectName: row.project_name as string | null,
    inviterName: row.inviter_name as string,
  };
}

export async function acceptInvitation(token: string, user: { id: string; email: string }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT * FROM invitations WHERE token_hash = $1 FOR UPDATE`,
      [hashToken(token)]
    );
    if (!result.rows.length) throw new Error("Invitation not found");
    const invitation = result.rows[0];
    if (invitation.status !== "pending") throw new Error("Invitation is no longer active");
    if (new Date(invitation.expires_at).getTime() <= Date.now()) {
      await client.query("UPDATE invitations SET status = 'expired', updated_at = NOW() WHERE id = $1", [invitation.id]);
      await client.query("COMMIT");
      throw new Error("Invitation has expired");
    }
    if (String(invitation.email).toLowerCase() !== user.email.trim().toLowerCase()) {
      throw new Error("This invitation was sent to a different email address");
    }
    if (String(invitation.project_role || "").toLowerCase() === "owner") {
      throw new Error("Project ownership cannot be granted through an invitation");
    }

    await client.query(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (workspace_id, user_id) DO UPDATE SET
         role = CASE WHEN workspace_members.role IN ('owner', 'admin') THEN workspace_members.role ELSE EXCLUDED.role END,
         status = 'active', deleted_at = NULL, updated_at = NOW()`,
      [crypto.randomUUID(), invitation.workspace_id, user.id, invitation.workspace_role || "member"]
    );

    if (invitation.project_id) {
      await client.query(
        `INSERT INTO project_members (id, project_id, user_id, role, invited_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (project_id, user_id) DO UPDATE SET
           role = CASE WHEN LOWER(project_members.role) IN ('owner', 'admin') THEN project_members.role ELSE EXCLUDED.role END,
           invited_by = EXCLUDED.invited_by, deleted_at = NULL, updated_at = NOW()`,
        [crypto.randomUUID(), invitation.project_id, user.id, invitation.project_role || "contributor", invitation.invited_by]
      );
    }

    await client.query(
      "UPDATE users SET active_workspace_id = COALESCE(active_workspace_id, $2), email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE id = $1",
      [user.id, invitation.workspace_id]
    );

    await client.query(
      `UPDATE invitations SET status = 'accepted', accepted_by = $2,
       accepted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [invitation.id, user.id]
    );
    await client.query("COMMIT");
    return { projectId: invitation.project_id as string | null, workspaceId: invitation.workspace_id as string };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function revokeInvitation(invitationId: string, projectId: string) {
  const result = await pool.query(
    `UPDATE invitations SET status = 'revoked', updated_at = NOW()
     WHERE id = $1 AND project_id = $2 AND status = 'pending'`,
    [invitationId, projectId]
  );
  return (result.rowCount || 0) > 0;
}
