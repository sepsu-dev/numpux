import { pool } from "@/db";

export async function createNotification(input: {
  userId?: string | null;
  title: string;
  message: string;
  type?: "info" | "success" | "warning";
  link?: string;
}) {
  if (!input.userId) return;
  await pool.query(
    `INSERT INTO notifications (id, user_id, title, message, type, link)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [crypto.randomUUID(), input.userId, input.title, input.message, input.type || "info", input.link || null]
  );
}
