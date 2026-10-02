import type { PoolClient } from "pg";

export function projectKeyBase(title: string) {
  const words = title.toUpperCase().match(/[A-Z0-9]+/g) || [];
  const initials = words.map((word) => word[0]).join("");
  return (initials.length >= 2 ? initials : words.join("")).slice(0, 12) || "PRJ";
}

export function availableProjectKey(title: string, existingKeys: Iterable<string>) {
  const used = new Set(Array.from(existingKeys, (key) => key.toUpperCase()));
  const base = projectKeyBase(title);
  if (!used.has(base)) return base;
  for (let suffix = 2; ; suffix += 1) {
    const value = `${base.slice(0, 16 - String(suffix).length)}${suffix}`;
    if (!used.has(value)) return value;
  }
}

export async function reserveIssueKey(client: PoolClient, projectId: string) {
  const result = await client.query(
    `UPDATE projects
     SET next_issue_number = next_issue_number + 1, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING key, title, next_issue_number - 1 AS issue_number`,
    [projectId]
  );
  if (!result.rows.length) throw new Error("Project not found");
  const project = result.rows[0];
  return {
    key: `${project.key}-${project.issue_number}`,
    number: Number(project.issue_number),
    projectTitle: project.title as string,
  };
}