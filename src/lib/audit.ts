import { pool } from "@/db";

export async function recordAudit(input: {
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  await pool.query(
    `INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, summary, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [crypto.randomUUID(), input.userId || null, input.userName || "System", input.action, input.entityType, input.entityId || null, input.summary, input.metadata ? JSON.stringify(input.metadata) : null]
  );
}
