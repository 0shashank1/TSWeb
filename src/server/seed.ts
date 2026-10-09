import { config } from "./config";
import { get, run } from "./db";
import { newId, nowIso } from "./ids";
import type { UserRow } from "./models";
import { hashPassword } from "./password";

export async function seedAdmin(): Promise<void> {
  if (!config.seedAdminEmail || !config.seedAdminPassword) return;

  const email = config.seedAdminEmail.trim().toLowerCase();
  const existing = get<UserRow>(
    "SELECT * FROM users WHERE role = 'admin' LIMIT 1",
  );
  if (existing) return;

  const user: UserRow = {
    id: newId(),
    email,
    password_hash: await hashPassword(config.seedAdminPassword),
    display_name: "Administrator",
    role: "admin",
    is_active: 1,
    created_at_utc: nowIso(),
    last_login_at_utc: null,
  };
  run(
    `INSERT INTO users
       (id, email, password_hash, display_name, role, is_active, created_at_utc, last_login_at_utc)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    user.id,
    user.email,
    user.password_hash,
    user.display_name,
    user.role,
    user.is_active,
    user.created_at_utc,
    user.last_login_at_utc,
  );
  console.log(`[seed] Created admin account ${email}`);
}
