import { Pool } from "pg";

const rawConnectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || "postgres"}:${encodeURIComponent(process.env.DB_PASSWORD || "password123")}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_NAME || "db_numpux"}`;

// Ensure search_path=numpux,public is configured
const connectionUrl = new URL(rawConnectionString);
if (!connectionUrl.searchParams.has("search_path")) {
  connectionUrl.searchParams.set("search_path", "numpux,public");
}
const connectionString = connectionUrl.toString();

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ||
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

// Guarantee that every pooled connection uses schema numpux as primary
pool.on("connect", (client) => {
  client.query("SET search_path TO numpux, public;").catch(() => {});
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

    // 2. Create projects table in numpux schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'General',
        status VARCHAR(50) DEFAULT 'Active',
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
        role VARCHAR(50) NOT NULL DEFAULT 'Member',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(project_id, user_id)
      );
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
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
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
        ('10000000-0000-0000-0000-000000000001', 'board', 'Board', '/tasks/kanban', 'SquaresFour', 'Planning', 1, true),
        ('10000000-0000-0000-0000-000000000002', 'backlog', 'Backlog', '/tasks', 'ListDashes', 'Planning', 2, true),
        ('10000000-0000-0000-0000-000000000003', 'summary', 'Summary', '/dashboard', 'ChartLineUp', 'Planning', 3, true),
        ('10000000-0000-0000-0000-000000000004', 'projects', 'Projects', '/projects', 'FolderSimple', 'Workspace', 4, true),
        ('10000000-0000-0000-0000-000000000005', 'master_menus', 'Master Menus', '/master/menus', 'ListNumbers', 'Settings', 5, true),
        ('10000000-0000-0000-0000-000000000006', 'user_privileges', 'User Privileges', '/master/user-privileges', 'ShieldCheck', 'Settings', 6, true),
        ('10000000-0000-0000-0000-000000000007', 'project_privileges', 'Project Privileges', '/master/project-privileges', 'UsersThree', 'Settings', 7, true),
        ('10000000-0000-0000-0000-000000000008', 'categories', 'Category Project', '/master/categories', 'Tag', 'Settings', 8, true),
        ('10000000-0000-0000-0000-000000000009', 'issue_types', 'Issue Type', '/master/issue-types', 'CheckSquare', 'Settings', 9, true),
        ('10000000-0000-0000-0000-000000000010', 'priorities', 'Priorities', '/master/priorities', 'Flag', 'Settings', 10, true),
        ('10000000-0000-0000-0000-000000000011', 'master_sections', 'Master Sections', '/master/sections', 'Rows', 'Settings', 11, true)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        section = EXCLUDED.section,
        path = EXCLUDED.path,
        icon = EXCLUDED.icon,
        sort_order = EXCLUDED.sort_order;

      -- If old 'settings' menu exists, remove it in favor of individual menus
      DELETE FROM master_menus WHERE code = 'settings';
    `);

    // Seed Default User Groups ('admin' and 'user')
    await client.query(`
      INSERT INTO user_groups (id, name, description)
      VALUES 
        ('20000000-0000-0000-0000-000000000001', 'admin', 'Administrator group with full menu visibility'),
        ('20000000-0000-0000-0000-000000000002', 'user', 'Regular user group with restricted menu access')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Seed Default Privileges
    // Admin group sees all menus
    await client.query(`
      INSERT INTO user_privileges (id, group_id, menu_id, can_view)
      SELECT 
        '30000000-0000-0000-0000-00000000000' || row_number() over (),
        ug.id,
        mm.id,
        true
      FROM user_groups ug
      CROSS JOIN master_menus mm
      WHERE ug.name = 'admin'
      ON CONFLICT (group_id, menu_id) DO NOTHING;
    `);

    // User group: Settings section is hidden by default for regular user
    await client.query(`
      INSERT INTO user_privileges (id, group_id, menu_id, can_view)
      SELECT 
        '40000000-0000-0000-0000-00000000000' || row_number() over (),
        ug.id,
        mm.id,
        CASE WHEN mm.section = 'Settings' THEN false ELSE true END
      FROM user_groups ug
      CROSS JOIN master_menus mm
      WHERE ug.name = 'user'
      ON CONFLICT (group_id, menu_id) DO NOTHING;
    `);

    // 9. Project Groups Table (Project-level roles: Owner, Admin, Member)
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

    // Seed Default Project Groups (Owner, Admin, Member)
    await client.query(`
      INSERT INTO project_groups (id, name, display_name, description)
      VALUES 
        ('50000000-0000-0000-0000-000000000001', 'owner', 'Owner', 'Project creator with full project control'),
        ('50000000-0000-0000-0000-000000000002', 'admin', 'Project Admin', 'Project administrator who can manage tasks and members'),
        ('50000000-0000-0000-0000-000000000003', 'member', 'Member', 'Team member with standard contribution access')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Seed Default Project Privileges:
    // - Owner sees all menus
    await client.query(`
      INSERT INTO project_privileges (id, group_id, menu_id, can_view)
      SELECT 
        '60000000-0000-0000-0000-00000000000' || row_number() over (),
        pg.id,
        mm.id,
        true
      FROM project_groups pg
      CROSS JOIN master_menus mm
      WHERE pg.name = 'owner'
      ON CONFLICT (group_id, menu_id) DO NOTHING;
    `);

    // - Admin sees all menus
    await client.query(`
      INSERT INTO project_privileges (id, group_id, menu_id, can_view)
      SELECT 
        '70000000-0000-0000-0000-00000000000' || row_number() over (),
        pg.id,
        mm.id,
        true
      FROM project_groups pg
      CROSS JOIN master_menus mm
      WHERE pg.name = 'admin'
      ON CONFLICT (group_id, menu_id) DO NOTHING;
    `);

    // - Member sees board, backlog, summary, projects, but NOT settings section
    await client.query(`
      INSERT INTO project_privileges (id, group_id, menu_id, can_view)
      SELECT 
        '80000000-0000-0000-0000-00000000000' || row_number() over (),
        pg.id,
        mm.id,
        CASE WHEN mm.section = 'Settings' THEN false ELSE true END
      FROM project_groups pg
      CROSS JOIN master_menus mm
      WHERE pg.name = 'member'
      ON CONFLICT (group_id, menu_id) DO NOTHING;
    `);

    // Seed default Admin User (admin@numpux.com / admin123)
    const ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001";
    // SHA-256 for 'admin123'
    const ADMIN_PASS_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa82280f1a30e1ea6";

    await client.query(`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES ('${ADMIN_USER_ID}', 'Admin Numpux', 'admin@numpux.com', '${ADMIN_PASS_HASH}', 'admin')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin';
    `);

    // Backfill any existing projects/tasks without user_id to Admin
    await client.query(`
      UPDATE projects SET user_id = '${ADMIN_USER_ID}' WHERE user_id IS NULL;
    `);
    await client.query(`
      UPDATE tasks SET user_id = '${ADMIN_USER_ID}' WHERE user_id IS NULL;
    `);

    // Check if initial projects exist, if not seed default data for Admin
    const projectCheck = await client.query("SELECT COUNT(*) FROM projects WHERE user_id = $1;", [ADMIN_USER_ID]);
    const count = parseInt(projectCheck.rows[0].count, 10);

    if (count === 0) {
      const PROJECT_ENGINE = "b3f8a42c-5d96-419b-a012-78d91c130001";
      const PROJECT_MARKETING = "e1a924cd-870b-4221-a3f1-432d56a20002";
      const PROJECT_APP = "74c10c12-302a-4df5-91db-fcbe9d150003";

      await client.query(`
        INSERT INTO projects (id, user_id, title, description, category, status, tasks_count, progress)
        VALUES
          ('${PROJECT_ENGINE}', '${ADMIN_USER_ID}', 'Numpux Engine', 'Core real-time task orchestration engine and event streaming service.', 'System', 'Active', 3, 33),
          ('${PROJECT_MARKETING}', '${ADMIN_USER_ID}', 'Marketing Site', 'High-performance public landing page, interactive docs, and changelog.', 'Web', 'Planning', 1, 0),
          ('${PROJECT_APP}', '${ADMIN_USER_ID}', 'Desktop & Mobile Client', 'Cross-platform client applications built for high-output engineering teams.', 'Product', 'Active', 1, 0)
        ON CONFLICT (id) DO NOTHING;
      `);

      await client.query(`
        INSERT INTO tasks (id, user_id, project_id, title, project_name, priority, due_date, status, description)
        VALUES
          ('a1100001-1111-4000-8000-000000000001', '${ADMIN_USER_ID}', '${PROJECT_ENGINE}', 'Refactor session token validation in auth service', 'Numpux Engine', 'High', 'Today', 'In Progress', 'Tighten token decoding, validation algorithms, and expiration check.'),
          ('a1100001-1111-4000-8000-000000000002', '${ADMIN_USER_ID}', '${PROJECT_ENGINE}', 'Fix multi-stage Docker build cache invalidation', 'Numpux Engine', 'Medium', 'Tomorrow', 'To Do', 'Improve layer caching for fast CI runner cycles.'),
          ('a1100001-1111-4000-8000-000000000003', '${ADMIN_USER_ID}', '${PROJECT_ENGINE}', 'Optimize Postgres indexes for high-throughput queries', 'Numpux Engine', 'Urgent', 'May 24', 'Done', 'Add composite indexes for foreign keys and status queries.'),
          ('a1100001-1111-4000-8000-000000000004', '${ADMIN_USER_ID}', '${PROJECT_MARKETING}', 'Write OpenAPI documentation with interactive sandbox', 'Marketing Site', 'Low', 'May 25', 'Review', 'Ensure all endpoints include request/response schemas.'),
          ('a1100001-1111-4000-8000-000000000005', '${ADMIN_USER_ID}', '${PROJECT_APP}', 'Implement offline state synchronization with optimistic UI', 'Desktop & Mobile Client', 'Medium', 'Tomorrow', 'To Do', 'Support offline caching and optimistic updates.')
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    isInitialized = true;
  } finally {
    client.release();
  }
}

