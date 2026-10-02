import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const root = process.cwd();

describe("workspace project invariants", () => {
  test("migration backfills deterministically and requires workspace_id", async () => {
    const source = await readFile(`${root}/src/db/index.ts`, "utf8");
    assert.match(source, /DISTINCT ON \(created_by\)[\s\S]*ORDER BY created_by, created_at, id/);
    assert.match(source, /IF EXISTS \(SELECT 1 FROM projects WHERE workspace_id IS NULL\)/);
    assert.match(source, /ALTER TABLE projects ALTER COLUMN workspace_id SET NOT NULL/);
  });

  test("project list and detail stay inside active workspace", async () => {
    const source = await readFile(`${root}/src/app/(backend)/api/projects/query.ts`, "utf8");
    assert.match(source, /p\.workspace_id = \$2/);
    assert.match(source, /p\.workspace_id = \$3/);
    assert.match(source, /INSERT INTO projects \(id, user_id, workspace_id/);
  });

  test("project access requires active workspace membership", async () => {
    const source = await readFile(`${root}/src/lib/workspace.ts`, "utf8");
    assert.match(source, /active_workspace_id = p\.workspace_id/);
    assert.match(source, /wm\.user_id IS NOT NULL/);
  });

  test("accepting a project invitation grants workspace then project membership", async () => {
    const source = await readFile(`${root}/src/lib/invitations.ts`, "utf8");
    assert.match(source, /INSERT INTO workspace_members[\s\S]*INSERT INTO project_members/);
    assert.match(source, /invitation\.workspace_role \|\| "member"/);
    assert.match(source, /invitation\.project_role \|\| "contributor"/);
  });

  test("project store exposes the current user's effective role", async () => {
    const source = await readFile(`${root}/src/lib/store.ts`, "utf8");
    assert.match(source, /current_user_role/);
    assert.match(source, /current_workspace_role/);
    assert.match(source, /userRole:/);
  });

  test("workspace-only invitations grant the selected workspace role", async () => {
    const [service, route] = await Promise.all([
      readFile(`${root}/src/lib/invitations.ts`, "utf8"),
      readFile(`${root}/src/app/(backend)/api/workspaces/[id]/invitations/route.ts`, "utf8"),
    ]);
    assert.match(service, /project_id IS NULL/);
    assert.match(service, /invitation\.workspace_role \|\| "member"/);
    assert.match(route, /actor\.role === "admin" && role === "admin"/);
  });

  test("workspace deletion rejects every project including trash and keeps a restrictive FK", async () => {
    const [route, database] = await Promise.all([
      readFile(`${root}/src/app/(backend)/api/workspaces/[id]/route.ts`, "utf8"),
      readFile(`${root}/src/db/index.ts`, "utf8"),
    ]);
    assert.match(route, /SELECT COUNT\(\*\)::int AS count FROM projects WHERE workspace_id = \$1/);
    assert.doesNotMatch(route, /projects WHERE workspace_id = \$1 AND deleted_at IS NULL/);
    assert.match(route, /BEGIN[\s\S]*INSERT INTO workspaces[\s\S]*DELETE FROM workspaces[\s\S]*COMMIT/);
    assert.match(database, /FOREIGN KEY \(workspace_id\) REFERENCES workspaces\(id\) ON DELETE RESTRICT/);
  });

  test("destructive confirmations do not use the native browser dialog", async () => {
    const files = [
      "src/app/(dashboard)/master/menus/page.tsx",
      "src/app/(dashboard)/master/project-privileges/page.tsx",
      "src/app/(dashboard)/master/sections/page.tsx",
      "src/app/(dashboard)/master/trash/page.tsx",
      "src/app/(dashboard)/master/users/page.tsx",
      "src/app/(dashboard)/workspace/page.tsx",
      "src/components/projects/project-members-modal.tsx",
    ];
    const sources = await Promise.all(files.map((file) => readFile(`${root}/${file}`, "utf8")));
    assert.equal(sources.some((source) => /\bconfirm\s*\(/.test(source)), false);
  });

  test("seed always assigns workspace and membership", async () => {
    const source = await readFile(`${root}/seed-sepsu.ts`, "utf8");
    assert.match(source, /ensureActiveWorkspaceForUser\(sepsuUserId\)/);
    assert.match(source, /INSERT INTO workspace_members/);
    assert.match(source, /INSERT INTO projects \(id, user_id, workspace_id/);
  });

  test("task form reads project members from API envelope", async () => {
    const source = await readFile(`${root}/src/components/tasks/task-form-modal.tsx`, "utf8");
    assert.match(source, /Array\.isArray\(body\.data\?\.members\)/);
    assert.doesNotMatch(source, /setProjectMembers\(res\.data\)/);
  });

  test("backlog uses explicit route and preserves legacy project context", async () => {
    const [legacyRoute, backlogRoute, database] = await Promise.all([
      readFile(`${root}/src/app/(dashboard)/tasks/page.tsx`, "utf8"),
      readFile(`${root}/src/app/(dashboard)/tasks/backlog/page.tsx`, "utf8"),
      readFile(`${root}/src/db/index.ts`, "utf8"),
    ]);
    assert.match(legacyRoute, /\/tasks\/backlog\?projectId=\$\{encodeURIComponent\(projectId\)\}/);
    assert.match(backlogRoute, /export default async function BacklogPage/);
    assert.match(backlogRoute, /key=\{projectId \|\| "all-projects"\}/);
    assert.match(database, /'backlog', 'Backlog', '\/tasks\/backlog'/);
  });

  test("workspace and project switches keep the current menu page", async () => {
    const source = await readFile(`${root}/src/components/dashboard/sidebar-nav.tsx`, "utf8");
    assert.match(source, /window\.location\.assign\(currentPageWithProject\(nextProject\?\.id\)\)/);
    assert.match(source, /router\.push\(currentPageWithProject\(projectId\)\)/);
    assert.doesNotMatch(source, /nextProject \? `\/dashboard\?projectId=/);
    assert.doesNotMatch(source, /router\.push\(`\/tasks\/kanban\?projectId=/);
  });

  test("workspace switches invalidate API-backed stores before loading the new tenant", async () => {
    const [sidebar, workspacePage, resetStores] = await Promise.all([
      readFile(`${root}/src/components/dashboard/sidebar-nav.tsx`, "utf8"),
      readFile(`${root}/src/app/(dashboard)/workspace/page.tsx`, "utf8"),
      readFile(`${root}/src/stores/reset-api-stores.ts`, "utf8"),
    ]);
    assert.match(sidebar, /resetApiStores\(\);[\s\S]*setProjects\(\[\]\);[\s\S]*fetchProjects\(\)/);
    assert.match(workspacePage, /resetApiStores\(\);[\s\S]*numpux_master_data_updated/);
    assert.match(resetStores, /useMasterDataStore\.getState\(\)\.reset\(\)/);
    assert.match(resetStores, /useNavigationStore\.getState\(\)\.reset\(\)/);
    assert.match(resetStores, /usePrivilegesStore\.getState\(\)\.reset\(\)/);
  });
});