import { Pool } from "pg";

export const db = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/orders_db",
  max: 5,
});

export async function query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const result = await db.query(sql, params);
  return result.rows as T[];
}
