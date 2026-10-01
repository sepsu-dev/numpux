import { initDb, pool } from "@/db";
import type {
  MasterCategoryItem,
  MasterIssueTypeItem,
  MasterPriorityItem,
  MasterProjectStatusItem,
  MasterStatusItem,
} from "@/lib/master-data";

export interface MasterDataPayload {
  categories: MasterCategoryItem[];
  issueTypes: MasterIssueTypeItem[];
  priorities: MasterPriorityItem[];
  statuses: MasterStatusItem[];
  projectStatuses: MasterProjectStatusItem[];
}

export async function findAllMasterData(): Promise<MasterDataPayload> {
  await initDb();
  const [categories, issueTypes, priorities, statuses, projectStatuses] = await Promise.all([
    pool.query("SELECT id, name, is_default FROM master_categories WHERE is_active = true ORDER BY sort_order, name"),
    pool.query("SELECT id, name, description, icon_name, color_class, is_default FROM master_issue_types WHERE is_active = true ORDER BY sort_order, name"),
    pool.query("SELECT id, name, level, dot_color, badge_class, severity_class, is_default FROM master_priorities WHERE is_active = true ORDER BY sort_order, level, name"),
    pool.query("SELECT id, name, description, sort_order, dot_color, badge_class, header_border, is_completed, is_default FROM master_statuses WHERE is_active = true ORDER BY sort_order, name"),
    pool.query("SELECT id, name, description, color_class, sort_order, is_completed, is_default FROM master_project_statuses WHERE is_active = true ORDER BY sort_order, name"),
  ]);

  return {
    categories: categories.rows.map((row) => ({ id: row.id, name: row.name, isDefault: row.is_default })),
    issueTypes: issueTypes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      iconName: row.icon_name,
      colorClass: row.color_class,
      isDefault: row.is_default,
    })),
    priorities: priorities.rows.map((row) => ({
      id: row.id,
      name: row.name,
      level: row.level,
      dotColor: row.dot_color,
      badgeClass: row.badge_class,
      severityClass: row.severity_class,
      isDefault: row.is_default,
    })),
    statuses: statuses.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      order: row.sort_order,
      dotColor: row.dot_color,
      badgeClass: row.badge_class,
      headerBorder: row.header_border,
      isCompleted: row.is_completed,
      isDefault: row.is_default,
    })),
    projectStatuses: projectStatuses.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      colorClass: row.color_class,
      order: row.sort_order,
      isCompleted: row.is_completed,
      isDefault: row.is_default,
    })),
  };
}

export async function createMasterData(resource: string, item: Record<string, unknown>) {
  const id = String(item.id || crypto.randomUUID());
  if (resource === "categories") {
    const max = await pool.query("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM master_categories");
    await pool.query(
      "INSERT INTO master_categories (id, name, sort_order) VALUES ($1, $2, $3)",
      [id, item.name, max.rows[0].next]
    );
  } else if (resource === "issueTypes") {
    const max = await pool.query("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM master_issue_types");
    await pool.query(
      "INSERT INTO master_issue_types (id, name, description, icon_name, color_class, sort_order) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, item.name, item.description || null, item.iconName, item.colorClass, max.rows[0].next]
    );
  } else if (resource === "priorities") {
    const max = await pool.query("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM master_priorities");
    await pool.query(
      "INSERT INTO master_priorities (id, name, level, dot_color, badge_class, severity_class, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, item.name, item.level, item.dotColor, item.badgeClass, item.severityClass, max.rows[0].next]
    );
  } else if (resource === "statuses") {
    await pool.query(
      "INSERT INTO master_statuses (id, name, description, sort_order, dot_color, badge_class, header_border, is_completed) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [id, item.name, item.description || null, item.order, item.dotColor, item.badgeClass, item.headerBorder, item.isCompleted]
    );
  } else if (resource === "projectStatuses") {
    await pool.query(
      "INSERT INTO master_project_statuses (id, name, description, color_class, sort_order, is_completed) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, item.name, item.description || null, item.colorClass, item.order, item.isCompleted]
    );
  }
}

export async function updateMasterData(resource: string, id: string, updates: Record<string, unknown>) {
  const maps: Record<string, Record<string, string>> = {
    categories: { name: "name" },
    issueTypes: { name: "name", description: "description", iconName: "icon_name", colorClass: "color_class" },
    priorities: { name: "name", level: "level", dotColor: "dot_color", badgeClass: "badge_class", severityClass: "severity_class" },
    statuses: { name: "name", description: "description", order: "sort_order", dotColor: "dot_color", badgeClass: "badge_class", headerBorder: "header_border", isCompleted: "is_completed" },
    projectStatuses: { name: "name", description: "description", order: "sort_order", colorClass: "color_class", isCompleted: "is_completed" },
  };
  const tables: Record<string, string> = {
    categories: "master_categories",
    issueTypes: "master_issue_types",
    priorities: "master_priorities",
    statuses: "master_statuses",
    projectStatuses: "master_project_statuses",
  };
  const allowed = maps[resource];
  const entries = Object.entries(updates).filter(([key]) => allowed[key]);
  if (!entries.length) return false;

  const values: unknown[] = [id];
  const assignments = entries.map(([key, value]) => {
    values.push(value === undefined ? null : value);
    return `${allowed[key]} = $${values.length}`;
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let oldCategoryName: string | undefined;
    if (resource === "categories" && updates.name) {
      const old = await client.query("SELECT name FROM master_categories WHERE id = $1", [id]);
      oldCategoryName = old.rows[0]?.name;
    }
    const result = await client.query(
      `UPDATE ${tables[resource]} SET ${assignments.join(", ")}, updated_at = NOW() WHERE id = $1`,
      values
    );
    if (oldCategoryName && oldCategoryName !== updates.name) {
      await client.query("UPDATE projects SET category = $1 WHERE category = $2", [updates.name, oldCategoryName]);
    }
    await client.query("COMMIT");
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteMasterData(resource: string, id: string) {
  const config: Record<string, { table: string; usage?: string; valueColumn?: string }> = {
    categories: { table: "master_categories", usage: "projects", valueColumn: "category" },
    issueTypes: { table: "master_issue_types", usage: "tasks", valueColumn: "issue_type" },
    priorities: { table: "master_priorities", usage: "tasks", valueColumn: "priority" },
    statuses: { table: "master_statuses", usage: "tasks", valueColumn: "status" },
    projectStatuses: { table: "master_project_statuses", usage: "projects", valueColumn: "status" },
  };
  const target = config[resource];
  const current = await pool.query(`SELECT is_default, name FROM ${target.table} WHERE id = $1`, [id]);
  if (!current.rows.length) return { ok: false, reason: "Data not found" };
  if (target.usage && target.valueColumn) {
    const usageValue = resource === "categories" ? current.rows[0].name : id;
    const usage = await pool.query(`SELECT COUNT(*)::int AS count FROM ${target.usage} WHERE ${target.valueColumn} = $1`, [usageValue]);
    if (usage.rows[0].count > 0) return { ok: false, reason: "This item is still in use and cannot be deleted" };
  }
  const result = await pool.query(`UPDATE ${target.table} SET is_active = false, updated_at = NOW() WHERE id = $1`, [id]);
  return { ok: (result.rowCount ?? 0) > 0 };
}

