import type {
  AccessLogRow,
  RefreshTokenRow,
  ShareLinkRow,
  SnippetRow,
  UserRow,
} from "./models";

export function serializeUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    isActive: row.is_active === 1,
    createdAtUtc: row.created_at_utc,
    lastLoginAtUtc: row.last_login_at_utc,
  };
}

export function serializeSnippet(row: SnippetRow) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    expiresAtUtc: row.expires_at_utc,
    maxViews: row.max_views,
    viewCount: row.view_count,
    lastViewedAtUtc: row.last_viewed_at_utc,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
    version: row.version,
  };
}

export function serializeSnippetListItem(row: SnippetRow) {
  return {
    id: row.id,
    title: row.title,
    expiresAtUtc: row.expires_at_utc,
    viewCount: row.view_count,
    createdAtUtc: row.created_at_utc,
  };
}

export function serializeShareLink(row: ShareLinkRow) {
  return {
    id: row.id,
    snippetId: row.snippet_id,
    expiresAtUtc: row.expires_at_utc,
    maxUses: row.max_uses,
    useCount: row.use_count,
    isPasswordProtected: row.password_hash !== null,
    isRevoked: row.revoked_at_utc !== null,
    lastAccessedAtUtc: row.last_accessed_at_utc,
    createdAtUtc: row.created_at_utc,
  };
}

export function serializeCreatedShareLink(row: ShareLinkRow, url: string) {
  return {
    id: row.id,
    url,
    expiresAtUtc: row.expires_at_utc,
    maxUses: row.max_uses,
    useCount: row.use_count,
    isPasswordProtected: row.password_hash !== null,
    createdAtUtc: row.created_at_utc,
  };
}

export function serializeAccessLog(row: AccessLogRow) {
  return {
    id: row.id,
    shareLinkId: row.share_link_id,
    userId: row.user_id,
    accessedAtUtc: row.accessed_at_utc,
    wasSuccessful: row.was_successful === 1,
    ipAddress: row.ip_address,
    failureReason: row.failure_reason,
  };
}

export function serializeRefreshTokenRecord(row: RefreshTokenRow) {
  return {
    id: row.id,
    userId: row.user_id,
    familyId: row.family_id,
    createdAtUtc: row.created_at_utc,
    expiresAtUtc: row.expires_at_utc,
    revokedAtUtc: row.revoked_at_utc,
    revocationReason: row.revocation_reason,
    createdByIp: row.created_by_ip,
  };
}
