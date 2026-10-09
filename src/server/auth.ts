import { config } from "./config";
import { get, run } from "./db";
import { addSecondsIso, newId, nowIso, randomToken, sha256Hex } from "./ids";
import { signToken, verifyToken } from "./jwt";
import type { AccessTokenClaims, ShareAccessTokenClaims } from "./jwt";
import type { UserRow } from "./models";
import { forbidden, unauthorized } from "./problem";
import { serializeUser } from "./serialize";

export function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

export function accessClaims(req: Request): AccessTokenClaims | null {
  const token = bearerToken(req);
  if (!token) return null;
  const claims = verifyToken<AccessTokenClaims>(token);
  if (!claims || claims.typ !== "access") return null;
  return claims;
}

export function shareAccessClaims(req: Request): ShareAccessTokenClaims | null {
  const token = bearerToken(req);
  if (!token) return null;
  const claims = verifyToken<ShareAccessTokenClaims>(token);
  if (!claims || claims.typ !== "share-access") return null;
  return claims;
}

export function requireUser(req: Request): UserRow {
  const claims = accessClaims(req);
  if (!claims) throw unauthorized("A valid access token is required.");
  const user = get<UserRow>("SELECT * FROM users WHERE id = ?", claims.sub);
  if (!user) throw unauthorized("The access token is no longer valid.");
  if (user.is_active !== 1) throw unauthorized("This account is not active.");
  return user;
}

export function requireAdmin(req: Request): UserRow {
  const user = requireUser(req);
  if (user.role !== "admin") {
    throw forbidden("Administrator access is required.");
  }
  return user;
}

export function issueAccessToken(user: UserRow): {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
} {
  const { token, expiresAtUtc } = signToken({
    sub: user.id,
    role: user.role,
    typ: "access",
    ttlSeconds: config.accessTokenTtlSeconds,
  });
  return { accessToken: token, accessTokenExpiresAtUtc: expiresAtUtc };
}

export function issueShareAccessToken(shareLinkId: string): {
  accessToken: string;
  expiresAtUtc: string;
} {
  const { token, expiresAtUtc } = signToken({
    sl: shareLinkId,
    typ: "share-access",
    ttlSeconds: config.shareAccessTokenTtlSeconds,
  });
  return { accessToken: token, expiresAtUtc };
}

export function createRefreshToken(
  userId: string,
  familyId: string | null,
  ip: string | null,
): { id: string; token: string; familyId: string } {
  const id = newId();
  const token = randomToken(48);
  const family = familyId ?? newId();
  run(
    `INSERT INTO refresh_tokens
       (id, user_id, family_id, token_hash, created_at_utc, expires_at_utc, created_by_ip)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    userId,
    family,
    sha256Hex(token),
    nowIso(),
    addSecondsIso(config.refreshTokenTtlSeconds),
    ip,
  );
  return { id, token, familyId: family };
}

export function issueSession(
  user: UserRow,
  ip: string | null,
): {
  user: ReturnType<typeof serializeUser>;
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
} {
  const access = issueAccessToken(user);
  const refresh = createRefreshToken(user.id, null, ip);
  return {
    user: serializeUser(user),
    accessToken: access.accessToken,
    accessTokenExpiresAtUtc: access.accessTokenExpiresAtUtc,
    refreshToken: refresh.token,
  };
}

export function revokeAllUserTokens(userId: string, reason: string): void {
  run(
    `UPDATE refresh_tokens
       SET revoked_at_utc = ?, revocation_reason = ?
     WHERE user_id = ? AND revoked_at_utc IS NULL`,
    nowIso(),
    reason,
    userId,
  );
}
