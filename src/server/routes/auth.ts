import {
  createRefreshToken,
  issueAccessToken,
  issueSession,
  requireUser,
  revokeAllUserTokens,
} from "../auth";
import { get, run } from "../db";
import { newId, nowIso, sha256Hex } from "../ids";
import type { RefreshTokenRow, UserRow } from "../models";
import {
  readJson,
  safe,
  unauthorized,
  validationProblem,
  conflict,
} from "../problem";
import { clientIp, rateLimit } from "../rate-limit";
import { hashPassword, verifyPassword } from "../password";

type RegisterRequest = {
  email?: string;
  password?: string;
  displayName?: string;
};

type LoginRequest = {
  email?: string;
  password?: string;
};

type RefreshRequest = {
  refreshToken?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const authRoutes = {
  "/api/v1/auth/register": {
    POST: safe(async (req) => {
      rateLimit(`register:${clientIp(req)}`, 10, 60_000);
      const body = await readJson<RegisterRequest>(req);

      const errors: Record<string, string[]> = {};
      const email = (body.email ?? "").trim().toLowerCase();
      if (!email) errors.email = ["Email is required."];
      else if (!EMAIL_PATTERN.test(email) || email.length > 254) {
        errors.email = ["Email is not a valid address."];
      }
      const password = body.password ?? "";
      if (password.length < 8) {
        errors.password = ["Password must be at least 8 characters."];
      }
      const displayName = (body.displayName ?? "").trim();
      if (!displayName) errors.displayName = ["Display name is required."];
      else if (displayName.length > 100) {
        errors.displayName = ["Display name must be 100 characters or fewer."];
      }
      if (Object.keys(errors).length > 0) throw validationProblem(errors);

      const existing = get<UserRow>(
        "SELECT * FROM users WHERE email = ?",
        email,
      );
      if (existing) {
        throw conflict("An account with this email already exists.");
      }

      const user: UserRow = {
        id: newId(),
        email,
        password_hash: await hashPassword(password),
        display_name: displayName,
        role: "user",
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

      const session = issueSession(user, clientIp(req));
      return Response.json(session, { status: 201 });
    }),
  },

  "/api/v1/auth/login": {
    POST: safe(async (req) => {
      rateLimit(`login:${clientIp(req)}`, 10, 60_000);
      const body = await readJson<LoginRequest>(req);
      const email = (body.email ?? "").trim().toLowerCase();
      const password = body.password ?? "";

      const invalid = unauthorized("The email or password is incorrect.");
      if (!email || !password) throw invalid;

      const user = get<UserRow>("SELECT * FROM users WHERE email = ?", email);
      const ok = user ? await verifyPassword(password, user.password_hash) : false;
      if (!user || !ok || user.is_active !== 1) throw invalid;

      run(
        "UPDATE users SET last_login_at_utc = ? WHERE id = ?",
        nowIso(),
        user.id,
      );
      user.last_login_at_utc = nowIso();

      const session = issueSession(user, clientIp(req));
      return Response.json(session, { status: 200 });
    }),
  },

  "/api/v1/auth/refresh": {
    POST: safe(async (req) => {
      rateLimit(`refresh:${clientIp(req)}`, 30, 60_000);
      const body = await readJson<RefreshRequest>(req);
      const token = body.refreshToken ?? "";
      if (!token) throw unauthorized("A refresh token is required.");

      const row = get<RefreshTokenRow>(
        "SELECT * FROM refresh_tokens WHERE token_hash = ?",
        sha256Hex(token),
      );
      if (!row) throw unauthorized("The refresh token is invalid.");

      if (row.revoked_at_utc) {
        run(
          `UPDATE refresh_tokens
             SET revoked_at_utc = ?, revocation_reason = 'reuse-detected'
           WHERE family_id = ? AND revoked_at_utc IS NULL`,
          nowIso(),
          row.family_id,
        );
        throw unauthorized(
          "This refresh token has already been used. All sessions in this family were revoked.",
        );
      }

      if (Date.parse(row.expires_at_utc) <= Date.now()) {
        throw unauthorized("The refresh token has expired.");
      }

      const user = get<UserRow>("SELECT * FROM users WHERE id = ?", row.user_id);
      if (!user || user.is_active !== 1) {
        throw unauthorized("The account is not active.");
      }

      run(
        "UPDATE refresh_tokens SET revoked_at_utc = ?, revocation_reason = 'rotated' WHERE id = ?",
        nowIso(),
        row.id,
      );

      const next = createRefreshToken(user.id, row.family_id, clientIp(req));
      run(
        "UPDATE refresh_tokens SET replaced_by_token_id = ? WHERE id = ?",
        next.id,
        row.id,
      );

      const access = issueAccessToken(user);
      return Response.json({
        accessToken: access.accessToken,
        accessTokenExpiresAtUtc: access.accessTokenExpiresAtUtc,
        refreshToken: next.token,
      });
    }),
  },

  "/api/v1/auth/logout": {
    POST: safe(async (req) => {
      const body = await readJson<RefreshRequest>(req).catch(() => ({}) as RefreshRequest);
      const token = body.refreshToken ?? "";
      if (token) {
        run(
          `UPDATE refresh_tokens
             SET revoked_at_utc = ?, revocation_reason = 'logout'
           WHERE token_hash = ? AND revoked_at_utc IS NULL`,
          nowIso(),
          sha256Hex(token),
        );
      }
      return new Response(null, { status: 204 });
    }),
  },

  "/api/v1/auth/logout-all": {
    POST: safe(async (req) => {
      const user = requireUser(req);
      revokeAllUserTokens(user.id, "logout-all");
      return new Response(null, { status: 204 });
    }),
  },
};
