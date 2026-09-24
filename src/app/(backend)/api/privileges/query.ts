import { pool } from "@/db";
import type { MasterMenu, UserGroup, UserPrivilege } from "@/types";

export async function findMasterMenus(): Promise<MasterMenu[]> {
  const res = await pool.query(
    "SELECT id, code, name, path, icon, section, parent_id, sort_order, is_active FROM master_menus ORDER BY sort_order ASC;"
  );
  return res.rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    path: r.path,
    icon: r.icon,
    section: r.section || "Planning",
    parentId: r.parent_id || null,
    sortOrder: r.sort_order,
    isActive: r.is_active,
  }));
}

export async function findUserGroups(): Promise<UserGroup[]> {
  const res = await pool.query(
    "SELECT id, name, description, created_at FROM user_groups ORDER BY name ASC;"
  );
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    createdAt: r.created_at,
  }));
}

export async function findUserPrivileges(): Promise<
  Array<UserPrivilege & { groupName: string; menuCode: string; menuName: string }>
> {
  const res = await pool.query(`
    SELECT 
      up.id, 
      up.group_id, 
      up.menu_id, 
      up.can_view,
      ug.name as group_name,
      mm.code as menu_code,
      mm.name as menu_name
    FROM user_privileges up
    JOIN user_groups ug ON ug.id = up.group_id
    JOIN master_menus mm ON mm.id = up.menu_id
    ORDER BY mm.sort_order ASC;
  `);
  return res.rows.map((r) => ({
    id: r.id,
    groupId: r.group_id,
    menuId: r.menu_id,
    canView: r.can_view,
    groupName: r.group_name,
    menuCode: r.menu_code,
    menuName: r.menu_name,
  }));
}

export async function findAllowedMenusByRole(role = "user"): Promise<MasterMenu[]> {
  const res = await pool.query(
    `SELECT mm.id, mm.code, mm.name, mm.path, mm.icon, mm.section, mm.parent_id, mm.sort_order, mm.is_active
     FROM master_menus mm
     JOIN user_privileges up ON up.menu_id = mm.id
     JOIN user_groups ug ON ug.id = up.group_id
     WHERE LOWER(ug.name) = LOWER($1) 
       AND up.can_view = TRUE
       AND mm.is_active = TRUE
     ORDER BY mm.sort_order ASC;`,
    [role]
  );
  return res.rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    path: r.path,
    icon: r.icon,
    section: r.section || "Planning",
    parentId: r.parent_id || null,
    sortOrder: r.sort_order,
    isActive: r.is_active,
  }));
}

export async function setGroupMenuPrivilege(
  groupName: string,
  menuId: string,
  canView: boolean
): Promise<boolean> {
  const gRes = await pool.query("SELECT id FROM user_groups WHERE LOWER(name) = LOWER($1) LIMIT 1", [groupName]);
  if (gRes.rows.length === 0) return false;
  const groupId = gRes.rows[0].id;

  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO user_privileges (id, group_id, menu_id, can_view)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (group_id, menu_id)
     DO UPDATE SET can_view = EXCLUDED.can_view;`,
    [id, groupId, menuId, canView]
  );
  return true;
}

export async function updateMasterMenu(
  id: string,
  data: { name?: string; path?: string; icon?: string; section?: string; parentId?: string | null; isActive?: boolean; sortOrder?: number }
): Promise<boolean> {
  const fields: string[] = [];
  const params: any[] = [id];

  if (data.name !== undefined) {
    fields.push(`name = $${params.length + 1}`);
    params.push(data.name);
  }
  if (data.path !== undefined) {
    fields.push(`path = $${params.length + 1}`);
    params.push(data.path);
  }
  if (data.icon !== undefined) {
    fields.push(`icon = $${params.length + 1}`);
    params.push(data.icon);
  }
  if (data.section !== undefined) {
    fields.push(`section = $${params.length + 1}`);
    params.push(data.section);
  }
  if (data.parentId !== undefined) {
    fields.push(`parent_id = $${params.length + 1}`);
    params.push(data.parentId || null);
  }
  if (data.isActive !== undefined) {
    fields.push(`is_active = $${params.length + 1}`);
    params.push(data.isActive);
  }
  if (data.sortOrder !== undefined) {
    fields.push(`sort_order = $${params.length + 1}`);
    params.push(data.sortOrder);
  }

  if (fields.length === 0) return true;

  const res = await pool.query(
    `UPDATE master_menus SET ${fields.join(", ")} WHERE id = $1`,
    params
  );
  return (res.rowCount ?? 0) > 0;
}

export async function createMasterMenu(data: {
  name: string;
  path: string;
  icon?: string;
  section?: string;
  parentId?: string | null;
}): Promise<MasterMenu | null> {
  const code = data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const id = crypto.randomUUID();

  // Find max sort order
  const maxRes = await pool.query("SELECT COALESCE(MAX(sort_order), 0) as max_order FROM master_menus;");
  const nextOrder = (maxRes.rows[0]?.max_order || 0) + 1;

  const res = await pool.query(
    `INSERT INTO master_menus (id, code, name, path, icon, section, parent_id, sort_order, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
     ON CONFLICT (code) DO NOTHING
     RETURNING id, code, name, path, icon, section, parent_id, sort_order, is_active;`,
    [
      id,
      code,
      data.name.trim(),
      data.path.trim(),
      data.icon?.trim() || "FolderSimple",
      data.section?.trim() || "Workspace",
      data.parentId || null,
      nextOrder,
    ]
  );

  if (res.rows.length === 0) return null;
  const created = res.rows[0];

  // Grant privileges to Admin user group and Owner/Admin project groups
  await pool.query(
    `INSERT INTO user_privileges (id, group_id, menu_id, can_view)
     SELECT gen_random_uuid(), id, $1, true
     FROM user_groups WHERE name = 'admin';`,
    [id]
  );
  await pool.query(
    `INSERT INTO user_privileges (id, group_id, menu_id, can_view)
     SELECT gen_random_uuid(), id, $1, false
     FROM user_groups WHERE name = 'user';`,
    [id]
  );
  await pool.query(
    `INSERT INTO project_privileges (id, group_id, menu_id, can_view)
     SELECT gen_random_uuid(), id, $1, true
     FROM project_groups WHERE name IN ('owner', 'admin');`,
    [id]
  );
  await pool.query(
    `INSERT INTO project_privileges (id, group_id, menu_id, can_view)
     SELECT gen_random_uuid(), id, $1, false
     FROM project_groups WHERE name NOT IN ('owner', 'admin');`,
    [id]
  );

  return {
    id: created.id,
    code: created.code,
    name: created.name,
    path: created.path,
    icon: created.icon,
    section: created.section,
    parentId: created.parent_id || null,
    sortOrder: created.sort_order,
    isActive: created.is_active,
  };
}

export async function deleteMasterMenu(id: string): Promise<boolean> {
  const res = await pool.query("DELETE FROM master_menus WHERE id = $1", [id]);
  return (res.rowCount ?? 0) > 0;
}

// ----------------------------------------------------
// PROJECT GROUPS & PROJECT PRIVILEGES
// ----------------------------------------------------

export async function findProjectGroups() {
  const res = await pool.query(
    "SELECT id, name, display_name, description, created_at FROM project_groups ORDER BY created_at ASC;"
  );
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    displayName: r.display_name,
    description: r.description,
    createdAt: r.created_at,
  }));
}

export async function findProjectPrivileges() {
  const res = await pool.query(`
    SELECT 
      pp.id, 
      pp.group_id, 
      pp.menu_id, 
      pp.can_view,
      pg.name as group_name,
      pg.display_name as group_display_name,
      mm.code as menu_code,
      mm.name as menu_name
    FROM project_privileges pp
    JOIN project_groups pg ON pg.id = pp.group_id
    JOIN master_menus mm ON mm.id = pp.menu_id
    ORDER BY mm.sort_order ASC;
  `);
  return res.rows.map((r) => ({
    id: r.id,
    groupId: r.group_id,
    menuId: r.menu_id,
    canView: r.can_view,
    groupName: r.group_name,
    groupDisplayName: r.group_display_name,
    menuCode: r.menu_code,
    menuName: r.menu_name,
  }));
}

export async function createProjectGroup(data: {
  name: string;
  displayName: string;
  description?: string;
}): Promise<{ id: string; name: string; displayName: string } | null> {
  const normalizedName = data.name.trim().toLowerCase().replace(/\s+/g, "_");
  const id = crypto.randomUUID();

  const res = await pool.query(
    `INSERT INTO project_groups (id, name, display_name, description)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (name) DO NOTHING
     RETURNING id, name, display_name;`,
    [id, normalizedName, data.displayName.trim(), data.description?.trim() || null]
  );

  if (res.rows.length === 0) return null;

  // Initialize privileges for all existing menus (default can_view = false for custom new roles)
  const menus = await findMasterMenus();
  for (const m of menus) {
    const privId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO project_privileges (id, group_id, menu_id, can_view)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (group_id, menu_id) DO NOTHING;`,
      [privId, id, m.id, false]
    );
  }

  return {
    id: res.rows[0].id,
    name: res.rows[0].name,
    displayName: res.rows[0].display_name,
  };
}

export async function deleteProjectGroup(id: string): Promise<boolean> {
  // Prevent deleting system baseline groups (owner, admin, member)
  const check = await pool.query("SELECT name FROM project_groups WHERE id = $1", [id]);
  if (check.rows.length === 0) return false;
  const name = check.rows[0].name.toLowerCase();
  if (["owner", "admin", "member"].includes(name)) {
    return false;
  }

  const res = await pool.query("DELETE FROM project_groups WHERE id = $1", [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function setProjectGroupMenuPrivilege(
  groupName: string,
  menuId: string,
  canView: boolean
): Promise<boolean> {
  const gRes = await pool.query(
    "SELECT id FROM project_groups WHERE LOWER(name) = LOWER($1) LIMIT 1",
    [groupName]
  );
  if (gRes.rows.length === 0) return false;
  const groupId = gRes.rows[0].id;

  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO project_privileges (id, group_id, menu_id, can_view)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (group_id, menu_id)
     DO UPDATE SET can_view = EXCLUDED.can_view;`,
    [id, groupId, menuId, canView]
  );
  return true;
}

export async function findAllowedMenusByProjectRole(role = "member"): Promise<MasterMenu[]> {
  const res = await pool.query(
    `SELECT mm.id, mm.code, mm.name, mm.path, mm.icon, mm.section, mm.parent_id, mm.sort_order, mm.is_active
     FROM master_menus mm
     JOIN project_privileges pp ON pp.menu_id = mm.id
     JOIN project_groups pg ON pg.id = pp.group_id
     WHERE LOWER(pg.name) = LOWER($1) 
       AND pp.can_view = TRUE
       AND mm.is_active = TRUE
     ORDER BY mm.sort_order ASC;`,
    [role]
  );
  return res.rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    path: r.path,
    icon: r.icon,
    section: r.section || "Planning",
    parentId: r.parent_id || null,
    sortOrder: r.sort_order,
    isActive: r.is_active,
  }));
}

// ----------------------------------------------------
// MASTER SECTIONS CRUD
// ----------------------------------------------------

export async function findMasterSections(): Promise<Array<{ id: string; name: string; sortOrder: number; createdAt?: string }>> {
  const res = await pool.query(
    "SELECT id, name, sort_order, created_at FROM master_sections ORDER BY sort_order ASC;"
  );
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  }));
}

export async function createMasterSection(data: { name: string }): Promise<{ id: string; name: string; sortOrder: number } | null> {
  const name = data.name.trim();
  const id = crypto.randomUUID();

  const maxRes = await pool.query("SELECT COALESCE(MAX(sort_order), 0) as max_order FROM master_sections;");
  const nextOrder = (maxRes.rows[0]?.max_order || 0) + 1;

  const res = await pool.query(
    `INSERT INTO master_sections (id, name, sort_order)
     VALUES ($1, $2, $3)
     ON CONFLICT (name) DO NOTHING
     RETURNING id, name, sort_order;`,
    [id, name, nextOrder]
  );

  if (res.rows.length === 0) return null;
  return {
    id: res.rows[0].id,
    name: res.rows[0].name,
    sortOrder: res.rows[0].sort_order,
  };
}

export async function updateMasterSection(
  id: string,
  data: { name?: string; sortOrder?: number }
): Promise<boolean> {
  const fields: string[] = [];
  const params: any[] = [id];

  if (data.name !== undefined) {
    // If name is changing, also update associated master_menus.section
    const oldRes = await pool.query("SELECT name FROM master_sections WHERE id = $1", [id]);
    const oldName = oldRes.rows[0]?.name;

    fields.push(`name = $${params.length + 1}`);
    params.push(data.name.trim());

    if (oldName && oldName !== data.name.trim()) {
      await pool.query("UPDATE master_menus SET section = $1 WHERE section = $2", [data.name.trim(), oldName]);
    }
  }

  if (data.sortOrder !== undefined) {
    fields.push(`sort_order = $${params.length + 1}`);
    params.push(data.sortOrder);
  }

  if (fields.length === 0) return true;

  const res = await pool.query(
    `UPDATE master_sections SET ${fields.join(", ")} WHERE id = $1`,
    params
  );
  return (res.rowCount ?? 0) > 0;
}

export async function deleteMasterSection(id: string): Promise<boolean> {
  const secRes = await pool.query("SELECT name FROM master_sections WHERE id = $1", [id]);
  if (secRes.rows.length === 0) return false;
  const name = secRes.rows[0].name;

  // Move existing menus under this section to 'General'
  await pool.query("UPDATE master_menus SET section = 'General' WHERE section = $1", [name]);

  const res = await pool.query("DELETE FROM master_sections WHERE id = $1", [id]);
  return (res.rowCount ?? 0) > 0;
}
