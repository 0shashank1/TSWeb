export type UserRole = "user" | "admin";

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: UserRole;
  is_active: number;
  created_at_utc: string;
  last_login_at_utc: string | null;
};

export type SnippetRow = {
  id: string;
  owner_user_id: string;
  title: string;
  content: string;
  expires_at_utc: string | null;
  max_views: number | null;
  view_count: number;
  last_viewed_at_utc: string | null;
  created_at_utc: string;
  updated_at_utc: string;
  version: string;
};

export type ShareLinkRow = {
  id: string;
  snippet_id: string;
  code_hash: string;
  password_hash: string | null;
  expires_at_utc: string | null;
  max_uses: number | null;
  use_count: number;
  revoked_at_utc: string | null;
  last_accessed_at_utc: string | null;
  created_at_utc: string;
};

export type RefreshTokenRow = {
  id: string;
  user_id: string;
  family_id: string;
  token_hash: string;
  created_at_utc: string;
  expires_at_utc: string;
  revoked_at_utc: string | null;
  revocation_reason: string | null;
  created_by_ip: string | null;
  replaced_by_token_id: string | null;
};

export type AccessLogRow = {
  id: string;
  share_link_id: string | null;
  user_id: string | null;
  accessed_at_utc: string;
  was_successful: number;
  failure_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
};
