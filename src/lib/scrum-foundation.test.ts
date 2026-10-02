import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const root = process.cwd();

describe("Scrum foundation invariants", () => {
  test("schema enforces one active sprint and project-scoped issue keys", async () => {
    const source = await readFile(`${root}/src/db/index.ts`, "utf8");
    assert.match(source, /uq_sprints_one_active_per_project[\s\S]*WHERE status = 'active' AND deleted_at IS NULL/);
    assert.match(source, /uq_tasks_project_key[\s\S]*ON tasks \(project_id, LOWER\(task_key\)\)/);
    assert.match(source, /ALTER TABLE tasks ALTER COLUMN backlog_order SET NOT NULL/);
  });

  test("issue creation reserves its sequence with one atomic update", async () => {
    const source = await readFile(`${root}/src/lib/issue-keys.ts`, "utf8");
    assert.match(source, /UPDATE projects[\s\S]*next_issue_number = next_issue_number \+ 1[\s\S]*RETURNING key/);
    assert.doesNotMatch(source, /COUNT\(\*\)/);
  });

  test("both legacy and current create paths use the atomic sequence", async () => {
    const [legacy, current] = await Promise.all([
      readFile(`${root}/src/lib/store.ts`, "utf8"),
      readFile(`${root}/src/app/(backend)/api/tasks/query.ts`, "utf8"),
    ]);
    assert.match(legacy, /reserveIssueKey\(client, input\.projectId\)/);
    assert.match(current, /reserveIssueKey\(client, data\.projectId\)/);
    assert.doesNotMatch(current, /SELECT COUNT\(\*\) FROM tasks/);
  });
});