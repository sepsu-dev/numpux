import { Pool } from "pg";
import { randomUUID } from "crypto";
import { getBootstrapAdminConfig, getDatabaseConfig } from "@/lib/env";
import { hashPassword } from "@/lib/password";

const databaseConfig = getDatabaseConfig();

// Ensure search_path=numpux,public is configured
const connectionUrl = new URL(databaseConfig.DATABASE_URL);
if (!connectionUrl.searchParams.has("search_path")) {
  connectionUrl.searchParams.set("search_path", "numpux,public");
}
const connectionString = connectionUrl.toString();

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ||
  new Pool({
    connectionString,
    options: "-c search_path=numpux,public",
    max: databaseConfig.DB_POOL_MAX,
    idleTimeoutMillis: databaseConfig.DB_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: databaseConfig.DB_CONNECTION_TIMEOUT_MS,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

let isInitialized = false;

/**
 * Initializes database schema and seeds initial data if tables are empty
 */
export async function initDb() {
  if (isInitialized) return;

  const client = await pool.connect();
  try {
    // 0. Ensure schema 'numpux' exists and set search_path
    await client.query(`CREATE SCHEMA IF NOT EXISTS numpux;`);
    await client.query(`SET search_path TO numpux, public;`);

    // 1. Create users table in numpux schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Ensure role column exists in users
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'role'
        ) THEN
          ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
        END IF;
      END $$;
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(30) NOT NULL DEFAULT 'active';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INT NOT NULL DEFAULT 1;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS account_origin VARCHAR(30) NOT NULL DEFAULT 'system';
      ALTER TABLE users ALTER COLUMN account_origin SET DEFAULT 'invited';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
      CREATE INDEX IF NOT EXISTS idx_users_last_seen_at ON users(last_seen_at DESC);
      CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);
    `);

    // Workspace is the tenant boundary. System roles never replace membership checks.
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(120) UNIQUE NOT NULL,
        created_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS workspace_members (
        id VARCHAR(64) PRIMARY KEY,
        workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(30) NOT NULL DEFAULT 'member',
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        UNIQUE(workspace_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id, status);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS active_workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE SET NULL;
    `);

    // 2. Create projects table in numpux schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'General',
        tasks_count INT DEFAULT 0,
        progress INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Add user_id column to projects if migrating from previous schema
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'projects' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE projects ADD COLUMN user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END $$;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE RESTRICT;
    `);

    // 3. Create tasks table in numpux schema (project_id is NOT NULL, due_date is optional/nullable)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        assignee_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        project_name VARCHAR(255) NOT NULL DEFAULT 'Main Project',
        priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
        due_date VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'To Do',
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Ensure due_date is nullable if table already existed
    await client.query(`
      ALTER TABLE tasks ALTER COLUMN due_date DROP NOT NULL;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
      CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id, deleted_at);
    `).catch(() => {});

    // Add user_id column to tasks if migrating from previous schema
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'tasks' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE tasks ADD COLUMN user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'tasks' AND column_name = 'assignee_id'
        ) THEN
          ALTER TABLE tasks ADD COLUMN assignee_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'tasks' AND column_name = 'task_key'
        ) THEN
          ALTER TABLE tasks ADD COLUMN task_key VARCHAR(64);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'tasks' AND column_name = 'issue_type'
        ) THEN
          ALTER TABLE tasks ADD COLUMN issue_type VARCHAR(50) DEFAULT 'Task';
        END IF;
      END $$;
    `);

    // 4. Create project_members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id VARCHAR(64) PRIMARY KEY,
        project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'contributor',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(project_id, user_id)
      );
      ALTER TABLE project_members ADD COLUMN IF NOT EXISTS invited_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE project_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE project_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE project_members ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
      ALTER TABLE project_members ALTER COLUMN role SET DEFAULT 'contributor';
      CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id, deleted_at);
    `);

    // 5. Create task_activities (History / Audit Log) table
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_activities (
        id VARCHAR(64) PRIMARY KEY,
        task_id VARCHAR(64) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(255) DEFAULT 'System',
        action VARCHAR(100) NOT NULL, -- 'created', 'status_changed', 'assigned', 'priority_changed', 'updated'
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(255) NOT NULL DEFAULT 'System',
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(80) NOT NULL,
        entity_id VARCHAR(64),
        summary TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        link VARCHAR(255),
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(100) PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );

      INSERT INTO schema_migrations (version, description)
      VALUES ('2026-10-admin-suite', 'Security, user management, audit logs, notifications, trash, and reporting foundation')
      ON CONFLICT (version) DO NOTHING;

      CREATE TABLE IF NOT EXISTS invitations (
        id VARCHAR(64) PRIMARY KEY,
        workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        project_id VARCHAR(64) REFERENCES projects(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        workspace_role VARCHAR(30) NOT NULL DEFAULT 'member',
        project_role VARCHAR(50),
        invited_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) UNIQUE NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        expires_at TIMESTAMPTZ NOT NULL,
        accepted_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        accepted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_invitations_email_status ON invitations(LOWER(email), status);
      CREATE INDEX IF NOT EXISTS idx_invitations_workspace_status ON invitations(workspace_id, status);
      CREATE INDEX IF NOT EXISTS idx_invitations_project_status ON invitations(project_id, status);
    `);

    // 6. Master Menus Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS master_menus (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        path VARCHAR(255) NOT NULL,
        icon VARCHAR(50) DEFAULT 'SquaresFour',
        section VARCHAR(50) DEFAULT 'Planning',
        sort_order INT DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
      ALTER TABLE master_menus ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    `);

    // Ensure section and parent_id column exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'master_menus' AND column_name = 'section'
        ) THEN
          ALTER TABLE master_menus ADD COLUMN section VARCHAR(50) DEFAULT 'Planning';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'master_menus' AND column_name = 'parent_id'
        ) THEN
          ALTER TABLE master_menus ADD COLUMN parent_id VARCHAR(64) REFERENCES master_menus(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // 6.5. Master Sections Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS master_sections (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        sort_order INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE master_sections ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    `);

    // 6.6. Database-backed configurable master data
    await client.query(`
      CREATE TABLE IF NOT EXISTS master_categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        sort_order INT DEFAULT 1,
        is_default BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS master_issue_types (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        icon_name VARCHAR(50) NOT NULL DEFAULT 'CheckSquare',
        color_class TEXT NOT NULL,
        sort_order INT DEFAULT 1,
        is_default BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS master_priorities (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        level INT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
        dot_color VARCHAR(100) NOT NULL,
        badge_class TEXT NOT NULL,
        severity_class TEXT NOT NULL,
        sort_order INT DEFAULT 1,
        is_default BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS master_statuses (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        sort_order INT DEFAULT 1,
        dot_color VARCHAR(100) NOT NULL,
        badge_class TEXT NOT NULL,
        header_border VARCHAR(100) NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        is_default BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

    `);

    await client.query(`
      ALTER TABLE master_priorities ADD COLUMN IF NOT EXISTS severity_class TEXT;
      UPDATE master_priorities SET severity_class = badge_class WHERE severity_class IS NULL;
      ALTER TABLE master_priorities ALTER COLUMN severity_class SET NOT NULL;
    `);

    await client.query(`
      INSERT INTO master_categories (id, name, sort_order, is_default)
      VALUES
        ('General', 'General', 1, true),
        ('Product & Tech', 'Product & Tech', 2, false),
        ('Client Work', 'Client Work', 3, false),
        ('Operations', 'Operations', 4, false),
        ('Marketing & Growth', 'Marketing & Growth', 5, false),
        ('Personal / Self', 'Personal / Self', 6, false)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO master_issue_types (id, name, description, icon_name, color_class, sort_order, is_default)
      VALUES
        ('Task', 'Task', 'General work or actionable task', 'CheckSquare', 'text-blue-500 bg-blue-500/10 border-blue-200/50 dark:border-blue-900/50', 1, true),
        ('Bug', 'Bug', 'Defect, error, or unexpected behavior', 'Bug', 'text-rose-500 bg-rose-500/10 border-rose-200/50 dark:border-rose-900/50', 2, true),
        ('Story', 'Story', 'User story or deliverable feature', 'BookmarkSimple', 'text-emerald-500 bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-900/50', 3, true),
        ('Improvement', 'Improvement', 'Refactoring, optimization, or UI polish', 'Lightning', 'text-purple-500 bg-purple-500/10 border-purple-200/50 dark:border-purple-900/50', 4, false)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO master_priorities (id, name, level, dot_color, badge_class, severity_class, sort_order, is_default)
      VALUES
        ('Low', 'Low', 1, 'bg-primary', 'bg-primary/10 text-primary border-primary/20', 'bg-slate-100 text-slate-700 border-slate-200/80', 1, true),
        ('Medium', 'Medium', 2, 'bg-[#2984f7]', 'bg-[#eef6ff] text-[#1768c5] border-[#c8e0ff]', 'bg-[#eef6ff] text-[#1768c5] border-[#c8e0ff]', 2, true),
        ('High', 'High', 3, 'bg-[#f5a300]', 'bg-[#fff7e6] text-[#946000] border-[#ffe0a3]', 'bg-[#fff7e6] text-[#946000] border-[#ffe0a3]', 3, true),
        ('Urgent', 'Urgent', 4, 'bg-rose-500', 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50', 'bg-rose-50 text-rose-700 border-rose-200/80', 4, true)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO master_statuses (id, name, description, sort_order, dot_color, badge_class, header_border, is_completed, is_default)
      VALUES
        ('To Do', 'To Do', 'Work that has not started', 1, 'bg-slate-400', 'bg-slate-100 text-slate-700', 'border-slate-200/80', false, true),
        ('In Progress', 'In Progress', 'Work currently in progress', 2, 'bg-[#2984f7]', 'bg-[#eef6ff] text-[#1768c5]', 'border-[#c8e0ff]', false, true),
        ('Review', 'In Review', 'Work awaiting review or approval', 3, 'bg-[#f5a300]', 'bg-[#fff7e6] text-[#946000]', 'border-[#ffe0a3]', false, true),
        ('Done', 'Done', 'Completed and verified work', 4, 'bg-primary', 'bg-primary/10 text-primary', 'border-primary/25', true, true)
      ON CONFLICT (id) DO NOTHING;

    `);

    // Seed Default Sections
    await client.query(`
      INSERT INTO master_sections (id, name, sort_order)
      VALUES
        ('40000000-0000-0000-0000-000000000001', 'Planning', 1),
        ('40000000-0000-0000-0000-000000000002', 'Workspace', 2),
        ('40000000-0000-0000-0000-000000000003', 'Settings', 3)
      ON CONFLICT (name) DO NOTHING;
    `);

    // 7. User Groups Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_groups (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 8. User Privileges Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_privileges (
        id VARCHAR(64) PRIMARY KEY,
        group_id VARCHAR(64) NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
        menu_id VARCHAR(64) NOT NULL REFERENCES master_menus(id) ON DELETE CASCADE,
        can_view BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(group_id, menu_id)
      );
    `);

    // Seed Default Master Menus
    await client.query(`
      INSERT INTO master_menus (id, code, name, path, icon, section, sort_order, is_active)
      VALUES 
        ('10000000-0000-0000-0000-000000000003', 'summary', 'Overview', '/dashboard', 'ChartLineUp', 'Planning', 1, true),
        ('10000000-0000-0000-0000-000000000001', 'board', 'Board', '/tasks/kanban', 'SquaresFour', 'Planning', 2, true),
        ('10000000-0000-0000-0000-000000000002', 'backlog', 'Backlog', '/tasks/backlog', 'ListDashes', 'Planning', 3, true),
        ('10000000-0000-0000-0000-000000000004', 'projects', 'Projects', '/projects', 'FolderSimple', 'Workspace', 4, true),
        ('10000000-0000-0000-0000-000000000020', 'workspace_settings', 'Workspaces', '/workspace', 'Stack', 'Workspace', 5, true),
        ('10000000-0000-0000-0000-000000000014', 'monitoring', 'Monitoring', '/monitoring', 'ChartBar', 'Workspace', 6, true),
        ('10000000-0000-0000-0000-000000000015', 'reports', 'Reports', '/reports', 'ChartBar', 'Workspace', 6, true),
        ('10000000-0000-0000-0000-000000000016', 'notifications', 'Notifications', '/notifications', 'Bell', 'Workspace', 7, true),
        ('10000000-0000-0000-0000-000000000005', 'master_menus', 'Navigation', '/master/menus', 'ListNumbers', 'Settings', 6, true),
        ('10000000-0000-0000-0000-000000000006', 'user_privileges', 'User Access', '/master/user-privileges', 'ShieldCheck', 'Settings', 7, true),
        ('10000000-0000-0000-0000-000000000007', 'project_privileges', 'Project Roles', '/master/project-privileges', 'UsersThree', 'Settings', 8, false),
        ('10000000-0000-0000-0000-000000000008', 'categories', 'Project Categories', '/master/categories', 'Tag', 'Settings', 9, true),
        ('10000000-0000-0000-0000-000000000009', 'issue_types', 'Issue Types', '/master/issue-types', 'CheckSquare', 'Settings', 10, true),
        ('10000000-0000-0000-0000-000000000010', 'priorities', 'Priorities', '/master/priorities', 'Flag', 'Settings', 11, true),
        ('10000000-0000-0000-0000-000000000012', 'statuses', 'Statuses', '/master/statuses', 'Columns', 'Settings', 12, true),
        ('10000000-0000-0000-0000-000000000011', 'master_sections', 'Navigation Sections', '/master/sections', 'Rows', 'Settings', 14, true),
        ('10000000-0000-0000-0000-000000000017', 'users', 'Users', '/master/users', 'UsersThree', 'Settings', 15, true),
        ('10000000-0000-0000-0000-000000000018', 'audit_log', 'Audit Log', '/master/audit-log', 'ListDashes', 'Settings', 16, true),
        ('10000000-0000-0000-0000-000000000019', 'trash', 'Trash', '/master/trash', 'Trash', 'Settings', 17, true)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        section = EXCLUDED.section,
        path = EXCLUDED.path,
        icon = EXCLUDED.icon,
        sort_order = EXCLUDED.sort_order;

      -- If old 'settings' menu exists, remove it in favor of individual menus
      DELETE FROM master_menus WHERE code = 'settings';
      DELETE FROM master_menus WHERE code = 'project_statuses';

      -- Project permissions remain role-based until the configurable matrix is enforced by APIs.
      UPDATE master_menus SET is_active = false WHERE code = 'project_privileges';
    `);

    // Seed Default User Groups
    await client.query(`
      INSERT INTO user_groups (id, name, description)
      VALUES 
        ('20000000-0000-0000-0000-000000000001', 'admin', 'Self-registered workspace administrator with operational management access'),
        ('20000000-0000-0000-0000-000000000002', 'user', 'Invited workspace user with transactional access'),
        ('20000000-0000-0000-0000-000000000003', 'superadmin', 'Application owner with unrestricted system access')
      ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;
    `);

    // Seed new role/menu pairs with safe defaults. Existing choices remain editable.
    await client.query(`
      INSERT INTO user_privileges (id, group_id, menu_id, can_view)
      SELECT 
        gen_random_uuid(),
        ug.id,
        mm.id,
        CASE
          WHEN ug.name = 'superadmin' THEN true
          WHEN ug.name = 'admin' THEN mm.code IN ('summary', 'board', 'backlog', 'projects', 'workspace_settings', 'reports', 'notifications')
          WHEN ug.name = 'user' THEN mm.code IN ('summary', 'board', 'backlog', 'projects', 'workspace_settings', 'notifications')
          ELSE false
        END
      FROM user_groups ug
      CROSS JOIN master_menus mm
      WHERE ug.name IN ('superadmin', 'admin', 'user')
      ON CONFLICT DO NOTHING;
    `);

    // One-time role model migration:
    // superadmin = application owner, admin = registered workspace owner,
    // user = invited transactional user.
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '2026-10-role-model-v2') THEN
          UPDATE user_privileges up
          SET can_view = CASE
            WHEN ug.name = 'superadmin' THEN true
            WHEN ug.name = 'admin' THEN mm.code IN ('summary', 'board', 'backlog', 'projects', 'reports', 'notifications', 'users')
            WHEN ug.name = 'user' THEN mm.code IN ('summary', 'board', 'backlog', 'projects', 'notifications')
            ELSE false
          END
          FROM user_groups ug, master_menus mm
          WHERE up.group_id = ug.id AND up.menu_id = mm.id;

          INSERT INTO schema_migrations (version, description)
          VALUES ('2026-10-role-model-v2', 'Align superadmin, registered admin, and invited user privileges');
        END IF;
      END $$;
    `);

    // Move customer administration from global accounts to workspace membership.
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '2026-10-workspace-acl-v1') THEN
          UPDATE user_privileges up
          SET can_view = CASE
            WHEN mm.code = 'workspace_settings' THEN true
            WHEN mm.code = 'users' THEN false
            ELSE up.can_view
          END
          FROM user_groups ug, master_menus mm
          WHERE up.group_id = ug.id AND up.menu_id = mm.id AND ug.name IN ('admin', 'user');

          INSERT INTO schema_migrations (version, description)
          VALUES ('2026-10-workspace-acl-v1', 'Move customer member management to workspace scope');
        END IF;
      END $$;
    `);

    // The application owner must always retain access. Admin/user choices are not
    // overwritten here because the privilege matrix is managed dynamically.
    await client.query(`
      UPDATE user_privileges up
      SET can_view = true
      FROM user_groups ug
      WHERE up.group_id = ug.id
        AND ug.name = 'superadmin';
    `);

    // 9. Project Groups Table (Project-level roles: Owner, Admin, Contributor, Viewer)
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_groups (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 10. Project Privileges Table (Sidebar menu visibility per Project Group)
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_privileges (
        id VARCHAR(64) PRIMARY KEY,
        group_id VARCHAR(64) NOT NULL REFERENCES project_groups(id) ON DELETE CASCADE,
        menu_id VARCHAR(64) NOT NULL REFERENCES master_menus(id) ON DELETE CASCADE,
        can_view BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(group_id, menu_id)
      );
    `);

    // Seed default project roles.
    await client.query(`
      UPDATE project_groups
      SET name = 'contributor', display_name = 'Contributor', description = 'Project contributor who can work on tasks'
      WHERE name = 'member'
        AND NOT EXISTS (SELECT 1 FROM project_groups WHERE name = 'contributor');

      INSERT INTO project_groups (id, name, display_name, description)
      VALUES 
        ('50000000-0000-0000-0000-000000000001', 'owner', 'Owner', 'Project creator with full project control'),
        ('50000000-0000-0000-0000-000000000002', 'admin', 'Project Admin', 'Project administrator who can manage tasks and members'),
        ('50000000-0000-0000-0000-000000000003', 'contributor', 'Contributor', 'Project contributor who can create and update tasks'),
        ('50000000-0000-0000-0000-000000000004', 'viewer', 'Viewer', 'Read-only project stakeholder')
      ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description;
    `);

    // Seed Default Project Privileges:
    // - Owner sees all menus
    await client.query(`
      INSERT INTO project_privileges (id, group_id, menu_id, can_view)
      SELECT 
        gen_random_uuid(),
        pg.id,
        mm.id,
        true
      FROM project_groups pg
      CROSS JOIN master_menus mm
      WHERE pg.name = 'owner'
      ON CONFLICT DO NOTHING;
    `);

    // - Admin sees all menus
    await client.query(`
      INSERT INTO project_privileges (id, group_id, menu_id, can_view)
      SELECT 
        gen_random_uuid(),
        pg.id,
        mm.id,
        true
      FROM project_groups pg
      CROSS JOIN master_menus mm
      WHERE pg.name = 'admin'
      ON CONFLICT DO NOTHING;
    `);

    // - Contributors and viewers see project planning menus, while mutations remain API-protected
    await client.query(`
      INSERT INTO project_privileges (id, group_id, menu_id, can_view)
      SELECT 
        gen_random_uuid(),
        pg.id,
        mm.id,
        CASE WHEN mm.section = 'Settings' THEN false ELSE true END
      FROM project_groups pg
      CROSS JOIN master_menus mm
      WHERE pg.name IN ('contributor', 'viewer')
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`
      UPDATE project_members SET role = 'contributor' WHERE LOWER(role) = 'member';
    `);

    const bootstrapAdmin = getBootstrapAdminConfig();
    let adminUserId: string | null = null;
    if (bootstrapAdmin) {
      const adminResult = await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, account_origin)
         VALUES ($1, $2, $3, $4, 'superadmin', 'system')
         ON CONFLICT (email) DO UPDATE SET role = 'superadmin', account_origin = 'system'
         RETURNING id`,
        [randomUUID(), bootstrapAdmin.name, bootstrapAdmin.email, hashPassword(bootstrapAdmin.password)]
      );
      adminUserId = adminResult.rows[0].id;
    } else {
      const existingAdmin = await client.query(
        "SELECT id FROM users WHERE role = 'superadmin' AND deleted_at IS NULL ORDER BY created_at LIMIT 1"
      );
      adminUserId = existingAdmin.rows[0]?.id ?? null;
    }

    // Classify accounts created before account-origin tracking was introduced.
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '2026-10-account-origin-v1') THEN
          UPDATE users
          SET account_origin = CASE
            WHEN role = 'superadmin' THEN 'system'
            WHEN role = 'admin' THEN 'self_registered'
            ELSE 'invited'
          END
          WHERE account_origin = 'system';

          INSERT INTO schema_migrations (version, description)
          VALUES ('2026-10-account-origin-v1', 'Classify legacy accounts by role origin');
        END IF;
      END $$;
    `);

    // Preserve legacy records only when an explicit or existing owner is available.
    if (adminUserId) {
      await client.query("UPDATE projects SET user_id = $1 WHERE user_id IS NULL", [adminUserId]);
      await client.query("UPDATE tasks SET user_id = $1 WHERE user_id IS NULL", [adminUserId]);
    }

    // Ensure every project owner has a workspace before inserting or repairing projects.
    await client.query(`
      INSERT INTO workspaces (id, name, slug, created_by)
      SELECT gen_random_uuid()::text,
             CASE WHEN u.name IS NULL OR BTRIM(u.name) = '' THEN 'My Workspace' ELSE u.name || '''s Workspace' END,
             'workspace-' || SUBSTRING(MD5(u.id) FROM 1 FOR 16),
             u.id
      FROM users u
      WHERE u.deleted_at IS NULL
        AND (u.role IN ('superadmin', 'admin') OR EXISTS (SELECT 1 FROM projects p WHERE p.user_id = u.id))
        AND NOT EXISTS (SELECT 1 FROM workspaces w WHERE w.created_by = u.id AND w.deleted_at IS NULL)
      ON CONFLICT (slug) DO NOTHING;

      INSERT INTO workspace_members (id, workspace_id, user_id, role, status)
      SELECT gen_random_uuid()::text, w.id, w.created_by, 'owner', 'active'
      FROM workspaces w
      WHERE w.deleted_at IS NULL
      ON CONFLICT (workspace_id, user_id) DO UPDATE
      SET role = 'owner', status = 'active', deleted_at = NULL, updated_at = NOW();
    `);

    await client.query(`
      ALTER TABLE projects DROP COLUMN IF EXISTS status;
      DROP TABLE IF EXISTS master_project_statuses;
    `);

    // Backfill tenant boundaries for legacy users and projects. This is idempotent
    // and keeps the current project owner as the workspace owner.
    await client.query(`
      INSERT INTO workspaces (id, name, slug, created_by)
      SELECT
        gen_random_uuid()::text,
        CASE WHEN u.name IS NULL OR BTRIM(u.name) = '' THEN 'My Workspace' ELSE u.name || '''s Workspace' END,
        'workspace-' || SUBSTRING(MD5(u.id) FROM 1 FOR 16),
        u.id
      FROM users u
      WHERE u.deleted_at IS NULL
        AND (u.role IN ('superadmin', 'admin') OR EXISTS (SELECT 1 FROM projects p WHERE p.user_id = u.id))
        AND NOT EXISTS (SELECT 1 FROM workspaces w WHERE w.created_by = u.id AND w.deleted_at IS NULL)
      ON CONFLICT (slug) DO NOTHING;

      INSERT INTO workspace_members (id, workspace_id, user_id, role, status)
      SELECT gen_random_uuid()::text, w.id, w.created_by, 'owner', 'active'
      FROM workspaces w
      WHERE w.deleted_at IS NULL
      ON CONFLICT (workspace_id, user_id) DO UPDATE
      SET role = 'owner', status = 'active', deleted_at = NULL, updated_at = NOW();

      UPDATE users u
      SET active_workspace_id = selected.workspace_id
      FROM (
        SELECT DISTINCT ON (wm.user_id) wm.user_id, wm.workspace_id
        FROM workspace_members wm
        WHERE wm.status = 'active' AND wm.deleted_at IS NULL
        ORDER BY wm.user_id, CASE wm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END, wm.joined_at
      ) selected
      WHERE u.id = selected.user_id AND u.active_workspace_id IS NULL;

      UPDATE projects p
      SET workspace_id = selected.workspace_id
      FROM (
        SELECT DISTINCT ON (created_by) created_by, id AS workspace_id
        FROM workspaces
        WHERE deleted_at IS NULL
        ORDER BY created_by, created_at, id
      ) selected
      WHERE p.workspace_id IS NULL AND selected.created_by = p.user_id;

      INSERT INTO workspace_members (id, workspace_id, user_id, role, status)
      SELECT gen_random_uuid()::text, membership.workspace_id, membership.user_id, 'member', 'active'
      FROM (
        SELECT DISTINCT p.workspace_id, pm.user_id
        FROM project_members pm
        JOIN projects p ON p.id = pm.project_id
        WHERE p.workspace_id IS NOT NULL AND pm.deleted_at IS NULL
      ) membership
      ON CONFLICT (workspace_id, user_id) DO UPDATE
      SET status = 'active', deleted_at = NULL, updated_at = NOW();

      UPDATE users u
      SET active_workspace_id = selected.workspace_id
      FROM (
        SELECT DISTINCT ON (wm.user_id) wm.user_id, wm.workspace_id
        FROM workspace_members wm
        WHERE wm.status = 'active' AND wm.deleted_at IS NULL
        ORDER BY wm.user_id, CASE wm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END, wm.joined_at
      ) selected
      WHERE u.id = selected.user_id AND u.active_workspace_id IS NULL;

      INSERT INTO schema_migrations (version, description)
      VALUES ('2026-10-workspace-foundation-v1', 'Workspace tenancy, project roles, and invitation foundation')
      ON CONFLICT (version) DO NOTHING;

      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM projects WHERE workspace_id IS NULL) THEN
          RAISE EXCEPTION 'Cannot enforce project workspace ownership: orphan projects remain';
        END IF;
      END $$;

      ALTER TABLE projects ALTER COLUMN workspace_id SET NOT NULL;

      DO $$
      DECLARE constraint_name TEXT;
      BEGIN
        SELECT con.conname INTO constraint_name
        FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'projects'::regclass AND con.contype = 'f' AND att.attname = 'workspace_id'
        LIMIT 1;
        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE projects DROP CONSTRAINT %I', constraint_name);
        END IF;
        ALTER TABLE projects ADD CONSTRAINT projects_workspace_id_fkey
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE RESTRICT;
      END $$;

      INSERT INTO schema_migrations (version, description)
      VALUES ('2026-10-project-workspace-required-v1', 'Require exactly one workspace for every project')
      ON CONFLICT (version) DO NOTHING;
    `);

    // Jira-lite foundation. Additive and idempotent; legacy task columns remain.
    await client.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS key VARCHAR(16);
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS next_issue_number INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

      WITH candidates AS (
        SELECT id, workspace_id,
          CASE
            WHEN raw_key ~ '^[A-Z]' THEN LEFT(raw_key, 12)
            ELSE 'P' || LEFT(raw_key, 11)
          END AS base_key
        FROM (
          SELECT id, workspace_id,
            COALESCE(NULLIF(UPPER(REGEXP_REPLACE(title, '[^A-Za-z0-9]', '', 'g')), ''), 'PRJ') AS raw_key
          FROM projects WHERE key IS NULL
        ) source
      ), numbered AS (
        SELECT id, base_key,
          ROW_NUMBER() OVER (PARTITION BY workspace_id, base_key ORDER BY id) AS duplicate_number
        FROM candidates
      )
      UPDATE projects p
      SET key = CASE WHEN n.duplicate_number = 1 THEN n.base_key
                     ELSE LEFT(n.base_key, 12) || n.duplicate_number::text END
      FROM numbered n WHERE p.id = n.id;

      CREATE TABLE IF NOT EXISTS sprints (
        id VARCHAR(64) PRIMARY KEY,
        project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        goal TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'future',
        start_date DATE,
        end_date DATE,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        CONSTRAINT sprints_status_check CHECK (status IN ('future', 'active', 'completed'))
      );

      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id VARCHAR(64) REFERENCES sprints(id) ON DELETE SET NULL;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reporter_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS backlog_order BIGINT;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

      UPDATE tasks SET reporter_id = user_id WHERE reporter_id IS NULL AND user_id IS NOT NULL;
      WITH ordered AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at, id) AS position
        FROM tasks WHERE backlog_order IS NULL
      )
      UPDATE tasks t SET backlog_order = ordered.position FROM ordered WHERE t.id = ordered.id;

      UPDATE projects p SET next_issue_number = greatest_issue.next_number
      FROM (
        SELECT project_id, COALESCE(MAX(backlog_order), 0)::integer + 1 AS next_number
        FROM tasks GROUP BY project_id
      ) greatest_issue
      WHERE p.id = greatest_issue.project_id AND p.next_issue_number < greatest_issue.next_number;

      ALTER TABLE projects ALTER COLUMN key SET NOT NULL;
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'projects_next_issue_number_check'
            AND conrelid = 'projects'::regclass
        ) THEN
          ALTER TABLE projects ADD CONSTRAINT projects_next_issue_number_check
            CHECK (next_issue_number >= 1) NOT VALID;
        END IF;
      END $$;
      ALTER TABLE projects VALIDATE CONSTRAINT projects_next_issue_number_check;
      ALTER TABLE tasks ALTER COLUMN backlog_order SET NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS uq_projects_workspace_key_active
        ON projects (workspace_id, LOWER(key)) WHERE deleted_at IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS uq_tasks_project_key
        ON tasks (project_id, LOWER(task_key)) WHERE task_key IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS uq_sprints_one_active_per_project
        ON sprints (project_id) WHERE status = 'active' AND deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_sprints_project_status
        ON sprints (project_id, status, created_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_backlog_board
        ON tasks (project_id, sprint_id, status, backlog_order);
      CREATE INDEX IF NOT EXISTS idx_tasks_assignee_active
        ON tasks (assignee_id, deleted_at);

      INSERT INTO schema_migrations (version, description)
      VALUES ('2026-10-scrum-foundation-v1', 'Project keys, atomic issue sequence, sprint and backlog fields')
      ON CONFLICT (version) DO NOTHING;
    `);

    isInitialized = true;
  } finally {
    client.release();
  }
}

