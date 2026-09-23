import type { Task, Project } from "@/lib/types";
import { pool, initDb } from "@/lib/db";

// Helper mapper from DB row to Project type
function mapProjectRow(row: any): Project {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    title: row.title,
    description: row.description || "",
    category: row.category || "General",
    status: row.status as "Active" | "Planning" | "Completed",
    tasks: Number(row.tasks_count || 0),
    progress: Number(row.progress || 0),
  };
}

// Helper mapper from DB row to Task type
function mapTaskRow(row: any): Task {
  return {
    id: row.id,
    key: row.task_key || undefined,
    userId: row.user_id || undefined,
    projectId: row.project_id,
    issueType: (row.issue_type as any) || "Task",
    title: row.title,
    project: row.project_name,
    priority: row.priority,
    date: row.due_date || undefined,
    status: row.status,
    description: row.description || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    assigneeId: row.assignee_id || undefined,
    assignee: row.assignee_name
      ? {
          id: row.assignee_id,
          name: row.assignee_name,
          email: row.assignee_email,
        }
      : undefined,
  };
}

async function recalculateProjectStats(projectId?: string) {
  if (!projectId) return;
  try {
    const statsResult = await pool.query(
      `SELECT 
         COUNT(*) as total, 
         COUNT(*) FILTER (WHERE status = 'Done') as completed 
       FROM tasks WHERE project_id = $1`,
      [projectId]
    );

    const total = parseInt(statsResult.rows[0].total, 10) || 0;
    const completed = parseInt(statsResult.rows[0].completed, 10) || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await pool.query(
      `UPDATE projects SET tasks_count = $1, progress = $2, updated_at = NOW() WHERE id = $3`,
      [total, progress, projectId]
    );
  } catch (err) {
    console.error("Error recalculating project stats:", err);
  }
}

export async function listTasks(userId?: string, projectId?: string): Promise<Task[]> {
  await initDb();
  let query = `
    SELECT t.*, u.name as assignee_name, u.email as assignee_email
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (userId) {
    params.push(userId);
    // User can see tasks they created, tasks in projects they belong to, or tasks assigned to them
    query += ` AND (t.user_id = $${params.length} OR t.assignee_id = $${params.length} OR t.project_id IN (
      SELECT project_id FROM project_members WHERE user_id = $${params.length}
    ))`;
  }

  if (projectId) {
    params.push(projectId);
    query += ` AND t.project_id = $${params.length}`;
  }

  query += " ORDER BY t.created_at DESC";

  const res = await pool.query(query, params);
  return res.rows.map(mapTaskRow);
}

export async function getTask(id: string, userId?: string): Promise<Task | undefined> {
  await initDb();
  let query = `
    SELECT t.*, u.name as assignee_name, u.email as assignee_email
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.id = $1
  `;
  const params: any[] = [id];

  if (userId) {
    params.push(userId);
    query += ` AND (t.user_id = $2 OR t.assignee_id = $2 OR t.project_id IN (
      SELECT project_id FROM project_members WHERE user_id = $2
    ))`;
  }

  query += " LIMIT 1";
  const res = await pool.query(query, params);
  if (res.rows.length === 0) return undefined;
  return mapTaskRow(res.rows[0]);
}

export async function createTask(input: Omit<Task, "id">, userId?: string): Promise<Task> {
  await initDb();
  if (!input.projectId) {
    throw new Error("Project is required to create a task");
  }

  const id = crypto.randomUUID();

  // Verify project exists and get title
  let projectName = input.project;
  const pRes = await pool.query("SELECT title FROM projects WHERE id = $1 LIMIT 1", [input.projectId]);
  if (pRes.rows.length > 0) {
    projectName = pRes.rows[0].title;
  }

  // Generate Jira-style Task Key: project acronym + auto-increment count (e.g. NUM-1, PRJ-14)
  const countRes = await pool.query("SELECT COUNT(*) FROM tasks WHERE project_id = $1", [input.projectId]);
  const taskNumber = parseInt(countRes.rows[0].count, 10) + 1;
  const prefix = projectName
    .split(/\s+/)
    .map((word: string) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 4) || "NUM";
  const taskKey = `${prefix}-${taskNumber}`;

  const res = await pool.query(
    `INSERT INTO tasks (id, user_id, project_id, title, project_name, priority, due_date, status, description, assignee_id, task_key, issue_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      id,
      userId || null,
      input.projectId,
      input.title,
      projectName || "Project",
      input.priority || "Medium",
      input.date || null,
      input.status || "To Do",
      input.description || null,
      input.assigneeId || null,
      input.key || taskKey,
      input.issueType || "Task",
    ]
  );

  await recalculateProjectStats(input.projectId);

  // Audit log: Created task
  await logTaskActivity(
    id,
    "created",
    `Task created in project "${projectName || "Project"}" as ${input.status || "To Do"}`,
    userId
  );

  return (await getTask(id)) || mapTaskRow(res.rows[0]);
}

export async function updateTask(id: string, input: Partial<Omit<Task, "id">>, userId?: string): Promise<Task | undefined> {
  await initDb();
  const existing = await getTask(id, userId);
  if (!existing) return undefined;

  const oldProjectId = existing.projectId;
  const newProjectId = input.projectId !== undefined ? input.projectId : existing.projectId;

  let projectName = input.project !== undefined ? input.project : existing.project;
  if (newProjectId && newProjectId !== oldProjectId) {
    const pRes = await pool.query("SELECT title FROM projects WHERE id = $1 LIMIT 1", [newProjectId]);
    if (pRes.rows.length > 0) {
      projectName = pRes.rows[0].title;
    }
  }

  const updatedTitle = input.title !== undefined ? input.title : existing.title;
  const updatedPriority = input.priority !== undefined ? input.priority : existing.priority;
  const updatedDate = input.date !== undefined ? input.date : existing.date;
  const updatedStatus = input.status !== undefined ? input.status : existing.status;
  const updatedDesc = input.description !== undefined ? input.description : existing.description;
  const updatedAssignee = input.assigneeId !== undefined ? input.assigneeId : existing.assigneeId;
  const updatedIssueType = input.issueType !== undefined ? input.issueType : (existing.issueType || "Task");

  await pool.query(
    `UPDATE tasks 
     SET project_id = $1, title = $2, project_name = $3, priority = $4, due_date = $5, status = $6, description = $7, assignee_id = $8, issue_type = $9, updated_at = NOW()
     WHERE id = $10
     RETURNING *`,
    [
      newProjectId || null,
      updatedTitle,
      projectName,
      updatedPriority,
      updatedDate,
      updatedStatus,
      updatedDesc || null,
      updatedAssignee || null,
      updatedIssueType,
      id,
    ]
  );

  if (newProjectId) await recalculateProjectStats(newProjectId);
  if (oldProjectId && oldProjectId !== newProjectId) await recalculateProjectStats(oldProjectId);

  // Audit log: Status change
  if (input.status && input.status !== existing.status) {
    await logTaskActivity(
      id,
      "status_changed",
      `Status changed from "${existing.status}" to "${input.status}"`,
      userId
    );
  }

  // Audit log: Priority change
  if (input.priority && input.priority !== existing.priority) {
    await logTaskActivity(
      id,
      "priority_changed",
      `Priority changed from "${existing.priority}" to "${input.priority}"`,
      userId
    );
  }

  // Audit log: Assignee change
  if (input.assigneeId !== undefined && input.assigneeId !== existing.assigneeId) {
    if (!input.assigneeId) {
      await logTaskActivity(id, "unassigned", `Task was unassigned`, userId);
    } else {
      const uRes = await pool.query("SELECT name FROM users WHERE id = $1 LIMIT 1", [input.assigneeId]);
      const name = uRes.rows[0]?.name || "Team Member";
      await logTaskActivity(id, "assigned", `Assigned to ${name}`, userId);
    }
  }

  return await getTask(id);
}

export async function deleteTask(id: string, userId?: string): Promise<void> {
  await initDb();
  const existing = await getTask(id, userId);
  if (!existing) return;

  await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
  if (existing.projectId) {
    await recalculateProjectStats(existing.projectId);
  }
}

export async function listProjects(userId?: string): Promise<Project[]> {
  await initDb();
  let query = `
    SELECT p.*, COUNT(DISTINCT pm.id) as members_count
    FROM projects p
    LEFT JOIN project_members pm ON p.id = pm.project_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (userId) {
    params.push(userId);
    // User sees projects where they are owner OR member
    query += ` AND (p.user_id = $${params.length} OR p.id IN (
      SELECT project_id FROM project_members WHERE user_id = $${params.length}
    ))`;
  }

  query += " GROUP BY p.id ORDER BY p.created_at DESC";
  const res = await pool.query(query, params);
  return res.rows.map((row) => ({
    ...mapProjectRow(row),
    membersCount: parseInt(row.members_count || "0", 10),
  }));
}

export async function getProject(id: string, userId?: string): Promise<Project | undefined> {
  await initDb();
  let query = `
    SELECT p.*, COUNT(DISTINCT pm.id) as members_count
    FROM projects p
    LEFT JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = $1
  `;
  const params: any[] = [id];

  if (userId) {
    params.push(userId);
    query += ` AND (p.user_id = $2 OR p.id IN (
      SELECT project_id FROM project_members WHERE user_id = $2
    ))`;
  }

  query += " GROUP BY p.id LIMIT 1";
  const res = await pool.query(query, params);
  if (res.rows.length === 0) return undefined;
  return {
    ...mapProjectRow(res.rows[0]),
    membersCount: parseInt(res.rows[0].members_count || "0", 10),
  };
}

export async function createProject(input: Omit<Project, "id">, userId?: string): Promise<Project> {
  await initDb();
  const id = crypto.randomUUID();

  const res = await pool.query(
    `INSERT INTO projects (id, user_id, title, description, category, status, tasks_count, progress)
     VALUES ($1, $2, $3, $4, $5, $6, 0, 0)
     RETURNING *`,
    [
      id,
      userId || null,
      input.title,
      input.description || "",
      input.category || "General",
      input.status || "Active",
    ]
  );

  // If created by a user, automatically add them as Owner in project_members
  if (userId) {
    const memberId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO project_members (id, project_id, user_id, role)
       VALUES ($1, $2, $3, 'Owner')
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [memberId, id, userId]
    ).catch(() => {});
  }

  return mapProjectRow(res.rows[0]);
}

export async function updateProject(id: string, input: Partial<Omit<Project, "id">>, userId?: string): Promise<Project | undefined> {
  await initDb();
  const existing = await getProject(id, userId);
  if (!existing) return undefined;

  const res = await pool.query(
    `UPDATE projects
     SET title = $1, description = $2, category = $3, status = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [
      input.title !== undefined ? input.title : existing.title,
      input.description !== undefined ? input.description : existing.description,
      input.category !== undefined ? input.category : existing.category,
      input.status !== undefined ? input.status : existing.status,
      id,
    ]
  );

  // If project title changed, sync task project_name
  if (input.title && input.title !== existing.title) {
    await pool.query("UPDATE tasks SET project_name = $1 WHERE project_id = $2", [input.title, id]);
  }

  return mapProjectRow(res.rows[0]);
}

export async function deleteProject(id: string, userId?: string): Promise<void> {
  await initDb();
  const existing = await getProject(id, userId);
  if (!existing) return;

  await pool.query("DELETE FROM projects WHERE id = $1", [id]);
}

// ==================== PROJECT MEMBERS MANAGEMENT ====================

import type { ProjectMember, ProjectMemberRole } from "@/lib/types";

export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  await initDb();

  // Auto-backfill project owner if not already in project_members
  const projRes = await pool.query(`SELECT user_id FROM projects WHERE id = $1`, [projectId]);
  if (projRes.rows.length > 0 && projRes.rows[0].user_id) {
    const ownerId = projRes.rows[0].user_id;
    await pool.query(
      `INSERT INTO project_members (id, project_id, user_id, role)
       VALUES ($1, $2, $3, 'Owner')
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [crypto.randomUUID(), projectId, ownerId]
    ).catch(() => {});
  }

  const res = await pool.query(
    `SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.created_at, u.name, u.email
     FROM project_members pm
     JOIN users u ON pm.user_id = u.id
     WHERE pm.project_id = $1
     ORDER BY 
       CASE pm.role 
         WHEN 'Owner' THEN 1 
         WHEN 'Admin' THEN 2 
         WHEN 'Member' THEN 3 
         ELSE 4 
       END, pm.created_at ASC`,
    [projectId]
  );

  return res.rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role as ProjectMemberRole,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  }));
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: ProjectMemberRole = "Member"
): Promise<ProjectMember> {
  await initDb();
  const id = crypto.randomUUID();

  await pool.query(
    `INSERT INTO project_members (id, project_id, user_id, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (project_id, user_id) 
     DO UPDATE SET role = EXCLUDED.role`,
    [id, projectId, userId, role]
  );

  const members = await listProjectMembers(projectId);
  const found = members.find((m) => m.userId === userId);
  if (!found) throw new Error("Failed to add project member");
  return found;
}

export async function removeProjectMember(projectId: string, memberId: string): Promise<boolean> {
  await initDb();
  const res = await pool.query(
    `DELETE FROM project_members 
     WHERE id = $1 AND project_id = $2 AND role != 'Owner'`,
    [memberId, projectId]
  );
  return (res.rowCount ?? 0) > 0;
}

// ==================== TASK AUDIT ACTIVITIES (HISTORY) ====================

import type { TaskActivity } from "@/lib/types";

export async function logTaskActivity(
  taskId: string,
  action: string,
  details?: string,
  userId?: string,
  userName: string = "System"
): Promise<void> {
  await initDb();
  const id = crypto.randomUUID();
  try {
    await pool.query(
      `INSERT INTO task_activities (id, task_id, user_id, user_name, action, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, taskId, userId || null, userName, action, details || null]
    );
  } catch (err) {
    console.error("Failed to log task activity:", err);
  }
}

export async function listTaskActivities(taskId: string): Promise<TaskActivity[]> {
  await initDb();
  const res = await pool.query(
    `SELECT * FROM task_activities 
     WHERE task_id = $1 
     ORDER BY created_at DESC`,
    [taskId]
  );
  return res.rows.map((row) => ({
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id || undefined,
    userName: row.user_name || "System",
    action: row.action,
    details: row.details || undefined,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}