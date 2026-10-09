import { requireAdmin, revokeAllUserTokens } from "../auth";
import { all, get, run } from "../db";
import type {
  AccessLogRow,
  RefreshTokenRow,
  UserRow,
  UserRole,
} from "../models";
import { notFound, readJson, safe, validationProblem } from "../problem";
import { decodeCursor, encodeCursor, pageSize } from "../pagination";
import {
  serializeAccessLog,
  serializeRefreshTokenRecord,
} from "../serialize";

function serializeAdminUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    isActive: row.is_active === 1,
    createdAtUtc: row.created_at_utc,
  };
}

export const adminRoutes = {
  "/api/v1/admin/users": {
    GET: safe(async (req) => {
      requireAdmin(req);
      const params = new URL(req.url).searchParams;
      const size = pageSize(params.get("pageSize"));
      const search = (params.get("search") ?? "").trim();
      const status = params.get("status");
      const role = params.get("role");
      const cursor = decodeCursor(params.get("cursor"));

      const filters: string[] = [];
      const args: (string | number)[] = [];
      if (search) {
        filters.push("(email LIKE ? OR display_name LIKE ?)");
        args.push(`%${search}%`, `%${search}%`);
      }
      if (status === "active") filters.push("is_active = 1");
      else if (status === "inactive") filters.push("is_active = 0");
      if (role === "user" || role === "admin") {
        filters.push("role = ?");
        args.push(role);
      }
      if (cursor && cursor["k"] && cursor["id"]) {
        filters.push("(created_at_utc, id) < (?, ?)");
        args.push(cursor["k"]!, cursor["id"]!);
      }

      const where = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
      const rows = all<UserRow>(
        `SELECT * FROM users ${where} ORDER BY created_at_utc DESC, id DESC LIMIT ?`,
        ...args,
        size + 1,
      );
      const hasMore = rows.length > size;
      const items = rows.slice(0, size);
      const last = items[items.length - 1];
      const nextCursor =
        hasMore && last
          ? encodeCursor({ k: last.created_at_utc, id: last.id })
          : null;

      return Response.json({
        items: items.map(serializeAdminUser),
        nextCursor,
      });
    }),
  },

  "/api/v1/admin/users/:userId": {
    GET: safe(async (req) => {
      requireAdmin(req);
      const userId = (req as unknown as { params: { userId: string } }).params.userId;
      const user = get<UserRow>("SELECT * FROM users WHERE id = ?", userId);
      if (!user) throw notFound("The user does not exist.");

      const snippetCount =
        get<{ count: number }>(
          "SELECT COUNT(*) AS count FROM snippets WHERE owner_user_id = ?",
          user.id,
        )?.count ?? 0;
      const activeRefreshTokenCount =
        get<{ count: number }>(
          "SELECT COUNT(*) AS count FROM refresh_tokens WHERE user_id = ? AND revoked_at_utc IS NULL",
          user.id,
        )?.count ?? 0;

      return Response.json({
        ...serializeAdminUser(user),
        lastLoginAtUtc: user.last_login_at_utc,
        snippetCount,
        activeRefreshTokenCount,
      });
    }),
  },

  "/api/v1/admin/users/:userId/status": {
    PATCH: safe(async (req) => {
      requireAdmin(req);
      const userId = (req as unknown as { params: { userId: string } }).params.userId;
      const user = get<UserRow>("SELECT * FROM users WHERE id = ?", userId);
      if (!user) throw notFound("The user does not exist.");

      const body = await readJson<{ isActive?: boolean }>(req);
      if (typeof body.isActive !== "boolean") {
        throw validationProblem({ isActive: ["isActive must be a boolean."] });
      }

      run(
        "UPDATE users SET is_active = ? WHERE id = ?",
        body.isActive ? 1 : 0,
        user.id,
      );
      if (!body.isActive) revokeAllUserTokens(user.id, "admin-deactivated");
      return new Response(null, { status: 204 });
    }),
  },

  "/api/v1/admin/users/:userId/role": {
    PATCH: safe(async (req) => {
      requireAdmin(req);
      const userId = (req as unknown as { params: { userId: string } }).params.userId;
      const user = get<UserRow>("SELECT * FROM users WHERE id = ?", userId);
      if (!user) throw notFound("The user does not exist.");

      const body = await readJson<{ role?: UserRole }>(req);
      if (body.role !== "user" && body.role !== "admin") {
        throw validationProblem({
          role: ["Role must be either 'user' or 'admin'."],
        });
      }

      run("UPDATE users SET role = ? WHERE id = ?", body.role, user.id);
      return new Response(null, { status: 204 });
    }),
  },

  "/api/v1/admin/access-logs": {
    GET: safe(async (req) => {
      requireAdmin(req);
      const params = new URL(req.url).searchParams;
      const size = pageSize(params.get("pageSize"));
      const cursor = decodeCursor(params.get("cursor"));

      const filters: string[] = [];
      const args: (string | number)[] = [];

      const success = params.get("success");
      if (success === "true") filters.push("was_successful = 1");
      else if (success === "false") filters.push("was_successful = 0");

      const reason = params.get("reason");
      if (reason) {
        filters.push("failure_reason = ?");
        args.push(reason);
      }

      const from = params.get("from");
      if (from) {
        const parsed = new Date(from);
        if (!Number.isNaN(parsed.getTime())) {
          filters.push("accessed_at_utc >= ?");
          args.push(parsed.toISOString());
        }
      }
      const to = params.get("to");
      if (to) {
        const parsed = new Date(to);
        if (!Number.isNaN(parsed.getTime())) {
          filters.push("accessed_at_utc <= ?");
          args.push(parsed.toISOString());
        }
      }

      if (cursor && cursor["k"] && cursor["id"]) {
        filters.push("(accessed_at_utc, id) < (?, ?)");
        args.push(cursor["k"]!, cursor["id"]!);
      }

      const where = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
      const rows = all<AccessLogRow>(
        `SELECT * FROM share_access_logs ${where}
         ORDER BY accessed_at_utc DESC, id DESC LIMIT ?`,
        ...args,
        size + 1,
      );
      const hasMore = rows.length > size;
      const items = rows.slice(0, size);
      const last = items[items.length - 1];
      const nextCursor =
        hasMore && last
          ? encodeCursor({ k: last.accessed_at_utc, id: last.id })
          : null;

      return Response.json({
        items: items.map(serializeAccessLog),
        nextCursor,
      });
    }),
  },

  "/api/v1/admin/refresh-tokens": {
    GET: safe(async (req) => {
      requireAdmin(req);
      const params = new URL(req.url).searchParams;
      const size = pageSize(params.get("pageSize"));
      const cursor = decodeCursor(params.get("cursor"));
      const userId = params.get("userId");

      const filters: string[] = [];
      const args: (string | number)[] = [];
      if (userId) {
        filters.push("user_id = ?");
        args.push(userId);
      }
      if (cursor && cursor["k"] && cursor["id"]) {
        filters.push("(created_at_utc, id) < (?, ?)");
        args.push(cursor["k"]!, cursor["id"]!);
      }

      const where = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
      const rows = all<RefreshTokenRow>(
        `SELECT * FROM refresh_tokens ${where}
         ORDER BY created_at_utc DESC, id DESC LIMIT ?`,
        ...args,
        size + 1,
      );
      const hasMore = rows.length > size;
      const items = rows.slice(0, size);
      const last = items[items.length - 1];
      const nextCursor =
        hasMore && last
          ? encodeCursor({ k: last.created_at_utc, id: last.id })
          : null;

      return Response.json({
        items: items.map(serializeRefreshTokenRecord),
        nextCursor,
      });
    }),
  },
};
