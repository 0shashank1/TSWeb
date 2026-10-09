import { Database, type SQLQueryBindings } from "bun:sqlite";
import { config } from "./config";

export const db = new Database(config.databasePath, { create: true });

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at_utc TEXT NOT NULL,
    last_login_at_utc TEXT
  );

  CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    expires_at_utc TEXT,
    max_views INTEGER,
    view_count INTEGER NOT NULL DEFAULT 0,
    last_viewed_at_utc TEXT,
    created_at_utc TEXT NOT NULL,
    updated_at_utc TEXT NOT NULL,
    version TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_snippets_owner ON snippets (owner_user_id);

  CREATE TABLE IF NOT EXISTS share_links (
    id TEXT PRIMARY KEY,
    snippet_id TEXT NOT NULL REFERENCES snippets (id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    expires_at_utc TEXT,
    max_uses INTEGER,
    use_count INTEGER NOT NULL DEFAULT 0,
    revoked_at_utc TEXT,
    last_accessed_at_utc TEXT,
    created_at_utc TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_share_links_snippet ON share_links (snippet_id);

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    family_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    created_at_utc TEXT NOT NULL,
    expires_at_utc TEXT NOT NULL,
    revoked_at_utc TEXT,
    revocation_reason TEXT,
    created_by_ip TEXT,
    replaced_by_token_id TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens (family_id);

  CREATE TABLE IF NOT EXISTS share_access_logs (
    id TEXT PRIMARY KEY,
    share_link_id TEXT,
    user_id TEXT,
    accessed_at_utc TEXT NOT NULL,
    was_successful INTEGER NOT NULL,
    failure_reason TEXT,
    ip_address TEXT,
    user_agent TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_access_logs_link ON share_access_logs (share_link_id);
  CREATE INDEX IF NOT EXISTS idx_access_logs_time ON share_access_logs (accessed_at_utc);

  CREATE TABLE IF NOT EXISTS idempotency_keys (
    user_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    response_status INTEGER NOT NULL,
    response_body TEXT NOT NULL,
    created_at_utc TEXT NOT NULL,
    PRIMARY KEY (user_id, idempotency_key)
  );
`);

export function all<T>(sql: string, ...params: SQLQueryBindings[]): T[] {
  return db.query(sql).all(...params) as T[];
}

export function get<T>(sql: string, ...params: SQLQueryBindings[]): T | null {
  return (db.query(sql).get(...params) as T | undefined) ?? null;
}

export function run(sql: string, ...params: SQLQueryBindings[]): void {
  db.query(sql).run(...params);
}
