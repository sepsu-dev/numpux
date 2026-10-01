import { pool } from "@/db";

export async function findMonitoringOverview() {
  const [summaryResult, usersResult, statusResult, roleResult] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users WHERE deleted_at IS NULL) AS total_users,
        (SELECT COUNT(*)::int FROM users WHERE deleted_at IS NULL AND account_origin = 'self_registered') AS self_registered_users,
        (SELECT COUNT(*)::int FROM users WHERE deleted_at IS NULL AND account_origin = 'invited') AS invited_users,
        (SELECT COUNT(*)::int FROM users WHERE deleted_at IS NULL AND last_seen_at >= NOW() - INTERVAL '2 minutes') AS online_users,
        (SELECT COUNT(*)::int FROM users WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '7 days') AS new_users,
        (SELECT COUNT(*)::int FROM workspaces WHERE deleted_at IS NULL) AS total_workspaces,
        (SELECT COUNT(*)::int FROM invitations WHERE status = 'pending' AND expires_at > NOW()) AS pending_invitations,
        (SELECT COUNT(*)::int FROM projects WHERE deleted_at IS NULL) AS total_projects,
        (SELECT COUNT(*)::int FROM tasks WHERE deleted_at IS NULL) AS total_tasks,
        (SELECT COUNT(*)::int FROM tasks WHERE deleted_at IS NULL AND status IN (SELECT id FROM master_statuses WHERE is_completed = true)) AS completed_tasks
    `),
    pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.account_origin,
        u.created_at,
        u.last_login_at,
        u.last_seen_at,
        (u.last_seen_at >= NOW() - INTERVAL '2 minutes') AS is_online,
        (SELECT COUNT(*)::int FROM projects p WHERE p.user_id = u.id) AS project_count,
        (SELECT COUNT(*)::int FROM tasks t WHERE t.user_id = u.id OR t.assignee_id = u.id) AS task_count
      FROM users u WHERE u.deleted_at IS NULL
      ORDER BY u.last_seen_at DESC NULLS LAST, u.created_at DESC
    `),
    pool.query(`
      SELECT COALESCE(ms.name, t.status) AS name, COUNT(t.id)::int AS count, COALESCE(ms.dot_color, 'bg-slate-400') AS dot_color
      FROM tasks t
      LEFT JOIN master_statuses ms ON ms.id = t.status
      WHERE t.deleted_at IS NULL
      GROUP BY COALESCE(ms.name, t.status), COALESCE(ms.dot_color, 'bg-slate-400'), COALESCE(ms.sort_order, 999)
      ORDER BY COALESCE(ms.sort_order, 999), COALESCE(ms.name, t.status)
    `),
    pool.query(`
      SELECT COALESCE(role, 'user') AS name, COUNT(*)::int AS count
      FROM users WHERE deleted_at IS NULL
      GROUP BY COALESCE(role, 'user')
      ORDER BY count DESC, name
    `),
  ]);

  const row = summaryResult.rows[0];
  return {
    summary: {
      totalUsers: row.total_users,
      selfRegisteredUsers: row.self_registered_users,
      invitedUsers: row.invited_users,
      onlineUsers: row.online_users,
      newUsers: row.new_users,
      totalWorkspaces: row.total_workspaces,
      pendingInvitations: row.pending_invitations,
      totalProjects: row.total_projects,
      totalTasks: row.total_tasks,
      completedTasks: row.completed_tasks,
    },
    users: usersResult.rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      accountOrigin: user.account_origin || "system",
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      lastSeenAt: user.last_seen_at,
      isOnline: user.is_online,
      projectCount: user.project_count,
      taskCount: user.task_count,
    })),
    taskStatuses: statusResult.rows.map((status) => ({
      name: status.name,
      count: status.count,
      dotColor: status.dot_color,
    })),
    roles: roleResult.rows,
    generatedAt: new Date().toISOString(),
  };
}
