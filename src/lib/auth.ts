import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ensureSchema, query, queryOne } from "@/lib/db";

const JWT_SECRET = process.env.SESSION_SECRET || "pawffee-dev-secret-change-me";
export const SESSION_COOKIE = "pawffee_admin_session";

export type AdminUser = { id: number; email: string; password_hash: string };

export async function getAdminByEmail(email: string): Promise<AdminUser | undefined> {
  await ensureSchema();
  return queryOne<AdminUser>(`SELECT * FROM admin_users WHERE email = $1`, [email]);
}

export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  const user = await getAdminByEmail(email.trim().toLowerCase());
  if (!user) return false;
  return bcrypt.compareSync(password, user.password_hash);
}

export function createSessionToken(email: string): string {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySessionToken(token: string | undefined): { email: string } | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { email: string };
    return payload;
  } catch {
    return null;
  }
}

export async function ensureAdminUser(email: string, password: string): Promise<AdminUser> {
  await ensureSchema();
  const existing = await getAdminByEmail(email.toLowerCase());
  if (existing) return existing;
  const hash = bcrypt.hashSync(password, 10);
  await query(`INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)`, [
    email.toLowerCase(),
    hash,
  ]);
  return (await getAdminByEmail(email.toLowerCase()))!;
}
