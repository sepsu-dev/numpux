import { pool } from "@/db";
import type { Task, Priority, TaskStatus, IssueType, TaskActivity } from "@/types";
import type { CreateTaskInput, UpdateTaskInput } from "./schema";

export async function findTasks(userId?: string, projectId?: string): Promise<Task[]> {
  let query = `
    SELECT 
      t.id, 
      t.task_key, 
      t.issue_type, 
      t.user_id, 
      t.project_id, 
      t.title, 
      t.project_name, 
      t.priority, 
      t.due_date, 
      t.status, 
      t.description, 
      t.created_at,
      u.id as assignee_id, 
      u.name as assignee_name, 
      u.email as assignee_email
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
  `;
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (userId) {
    whereClauses.push(`(
      t.user_id = $${params.length + 1} 
      OR t.project_id IN (SELECT project_id FROM project_members WHERE user_id = $${params.length + 1})
    )`);
    params.push(userId);
  }

  if (projectId) {
    whereClauses.push(`t.project_id = $${params.length + 1}`);
    params.push(projectId);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  query += ` ORDER BY t.created_at DESC;`;

  const res = await pool.query(query, params);
  return res.rows.map((row) => ({
    id: row.id,
    key: row.task_key || undefined,
    issueType: (row.issue_type as IssueType) || "Task",
    userId: row.user_id,
    projectId: row.project_id,
    title: row.title,
    project: row.project_name,
    priority: row.priority as Priority,
    date: row.due_date || undefined,
    status: row.status as TaskStatus,
    description: row.description || undefined,
    createdAt: row.created_at,
    assigneeId: row.assignee_id || undefined,
    assignee: row.assignee_id
      ? {
          id: row.assignee_id,
          name: row.assignee_name,
          email: row.assignee_email,
        }
      : undefined,
  }));
}

export async function findTaskById(id: string, userId?: string): Promise<Task | null> {
  let query = `
    SELECT 
      t.id, 
      t.task_key, 
      t.issue_type, 
      t.user_id, 
      t.project_id, 
      t.title, 
      t.project_name, 
      t.priority, 
      t.due_date, 
      t.status, 
      t.description, 
      t.created_at,
      u.id as assignee_id, 
      u.name as assignee_name, 
      u.email as assignee_email
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    WHERE t.id = $1
  `;
  const params: any[] = [id];

  if (userId) {
    query += ` AND (
      t.user_id = $2 
      OR t.project_id IN (SELECT project_id FROM project_members WHERE user_id = $2)
    )`;
    params.push(userId);
  }

  const res = await pool.query(query, params);
  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  return {
    id: row.id,
    key: row.task_key || undefined,
    issueType: (row.issue_type as IssueType) || "Task",
    userId: row.user_id,
    projectId: row.project_id,
    title: row.title,
    project: row.project_name,
    priority: row.priority as Priority,
    date: row.due_date || undefined,
    status: row.status as TaskStatus,
    description: row.description || undefined,
    createdAt: row.created_at,
    assigneeId: row.assignee_id || undefined,
    assignee: row.assignee_id
      ? {
          id: row.assignee_id,
          name: row.assignee_name,
          email: row.assignee_email,
        }
      : undefined,
  };
}

export async function insertTask(data: CreateTaskInput, userId?: string): Promise<Task> {
  const id = crypto.randomUUID();

  // Generate task key
  const countRes = await pool.query("SELECT COUNT(*) FROM tasks WHERE project_id = $1", [data.projectId]);
  const taskNumber = parseInt(countRes.rows[0].count, 10) + 1;
  const taskKey = `NUM-${taskNumber}`;

  // Get project title
  let projTitle = data.project || "Project";
  const projRes = await pool.query("SELECT title FROM projects WHERE id = $1", [data.projectId]);
  if (projRes.rows.length > 0) {
    projTitle = projRes.rows[0].title;
  }

  await pool.query(
    `INSERT INTO tasks (
      id, user_id, project_id, title, project_name, priority, due_date, status, description, assignee_id, task_key, issue_type
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      id,
      userId || null,
      data.projectId,
      data.title,
      projTitle,
      data.priority || "Medium",
      data.date || null,
      data.status || "To Do",
      data.description || null,
      data.assigneeId || null,
      taskKey,
      data.issueType || "Task",
    ]
  );

  await recordTaskActivity(id, userId, "created", `Created issue ${taskKey}: "${data.title}"`);
  return (await findTaskById(id, userId))!;
}

export async function updateTaskById(
  id: string,
  data: UpdateTaskInput,
  userId?: string
): Promise<Task | null> {
  const existing = await findTaskById(id, userId);
  if (!existing) return null;

  const fields: string[] = [];
  const params: any[] = [id];

  if (data.title !== undefined) {
    fields.push(`title = $${params.length + 1}`);
    params.push(data.title);
  }
  if (data.projectId !== undefined) {
    fields.push(`project_id = $${params.length + 1}`);
    params.push(data.projectId);
  }
  if (data.project !== undefined) {
    fields.push(`project_name = $${params.length + 1}`);
    params.push(data.project);
  }
  if (data.priority !== undefined) {
    fields.push(`priority = $${params.length + 1}`);
    params.push(data.priority);
  }
  if (data.date !== undefined) {
    fields.push(`due_date = $${params.length + 1}`);
    params.push(data.date);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${params.length + 1}`);
    params.push(data.status);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${params.length + 1}`);
    params.push(data.description);
  }
  if (data.assigneeId !== undefined) {
    fields.push(`assignee_id = $${params.length + 1}`);
    params.push(data.assigneeId);
  }
  if (data.issueType !== undefined) {
    fields.push(`issue_type = $${params.length + 1}`);
    params.push(data.issueType);
  }

  fields.push(`updated_at = NOW()`);

  await pool.query(`UPDATE tasks SET ${fields.join(", ")} WHERE id = $1`, params);

  if (data.status && data.status !== existing.status) {
    await recordTaskActivity(id, userId, "status_changed", `Changed status from "${existing.status}" to "${data.status}"`);
  }

  return findTaskById(id, userId);
}

export async function deleteTaskById(id: string, userId?: string): Promise<boolean> {
  let query = "DELETE FROM tasks WHERE id = $1";
  const params: any[] = [id];
  if (userId) {
    query += " AND user_id = $2";
    params.push(userId);
  }
  const res = await pool.query(query, params);
  return (res.rowCount ?? 0) > 0;
}

export async function recordTaskActivity(
  taskId: string,
  userId?: string,
  action = "updated",
  details?: string
) {
  const actId = crypto.randomUUID();
  let userName = "System";
  if (userId) {
    const userRes = await pool.query("SELECT name FROM users WHERE id = $1", [userId]);
    if (userRes.rows.length > 0) {
      userName = userRes.rows[0].name;
    }
  }

  await pool.query(
    `INSERT INTO task_activities (id, task_id, user_id, user_name, action, details)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [actId, taskId, userId || null, userName, action, details || null]
  );
}

export async function findTaskActivities(taskId: string): Promise<TaskActivity[]> {
  const res = await pool.query(
    `SELECT id, task_id, user_id, user_name, action, details, created_at
     FROM task_activities
     WHERE task_id = $1
     ORDER BY created_at DESC;`,
    [taskId]
  );
  return res.rows.map((row) => ({
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id || undefined,
    userName: row.user_name,
    action: row.action,
    details: row.details || undefined,
    createdAt: row.created_at,
  }));
}
