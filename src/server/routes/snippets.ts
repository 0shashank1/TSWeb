import { requireUser } from "../auth";
import { config } from "../config";
import { all, get, run } from "../db";
import { newId, newVersion, nowIso } from "../ids";
import type { SnippetRow, UserRow } from "../models";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  readJson,
  safe,
  validationProblem,
} from "../problem";
import { decodeCursor, encodeCursor, pageSize } from "../pagination";
import { serializeSnippet, serializeSnippetListItem } from "../serialize";
import { withIdempotency } from "../idempotency";

type CreateSnippetRequest = {
  title?: string;
  content?: string;
  expiresAtUtc?: string | null;
  maxViews?: number | null;
};

const SORT_COLUMNS: Record<string, string> = {
  createdAt: "created_at_utc",
  updatedAt: "updated_at_utc",
  title: "title",
  viewCount: "view_count",
};

export function loadSnippetForUser(
  snippetId: string,
  user: UserRow,
): SnippetRow {
  const snippet = get<SnippetRow>(
    "SELECT * FROM snippets WHERE id = ?",
    snippetId,
  );
  if (!snippet) throw notFound("The snippet does not exist.");
  if (snippet.owner_user_id !== user.id && user.role !== "admin") {
    throw forbidden("You do not have access to this snippet.");
  }
  return snippet;
}

function validateCreate(body: CreateSnippetRequest): {
  title: string;
  content: string;
  expiresAtUtc: string | null;
  maxViews: number | null;
} {
  const errors: Record<string, string[]> = {};
  const title = (body.title ?? "").trim();
  const content = body.content ?? "";

  if (!title) errors.title = ["Title is required."];
  else if (title.length > 200) {
    errors.title = ["Title must be 200 characters or fewer."];
  }

  if (!content) errors.content = ["Content is required."];
  else if (Buffer.byteLength(content, "utf8") > config.maxContentBytes) {
    errors.content = ["Content must be less than 1 MB."];
  }

  let expiresAtUtc: string | null = null;
  if (body.expiresAtUtc) {
    const parsed = new Date(body.expiresAtUtc);
    if (Number.isNaN(parsed.getTime())) {
      errors.expiresAtUtc = ["Expiration must be a valid date."];
    } else if (parsed.getTime() <= Date.now()) {
      errors.expiresAtUtc = ["Expiration must be in the future."];
    } else {
      expiresAtUtc = parsed.toISOString();
    }
  }

  let maxViews: number | null = null;
  if (body.maxViews !== undefined && body.maxViews !== null) {
    if (!Number.isInteger(body.maxViews) || body.maxViews < 1) {
      errors.maxViews = ["Max views must be a positive integer."];
    } else {
      maxViews = body.maxViews;
    }
  }

  if (Object.keys(errors).length > 0) throw validationProblem(errors);

  return { title, content, expiresAtUtc, maxViews };
}

export const snippetRoutes = {
  "/api/v1/snippets": {
    POST: safe(async (req) => {
      const user = requireUser(req);
      return withIdempotency(req, user.id, "create-snippet", async () => {
        const body = await readJson<CreateSnippetRequest>(req);
        const data = validateCreate(body);
        const now = nowIso();
        const snippet: SnippetRow = {
          id: newId(),
          owner_user_id: user.id,
          title: data.title,
          content: data.content,
          expires_at_utc: data.expiresAtUtc,
          max_views: data.maxViews,
          view_count: 0,
          last_viewed_at_utc: null,
          created_at_utc: now,
          updated_at_utc: now,
          version: newVersion(),
        };
        run(
          `INSERT INTO snippets
             (id, owner_user_id, title, content, expires_at_utc, max_views, view_count,
              last_viewed_at_utc, created_at_utc, updated_at_utc, version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          snippet.id,
          snippet.owner_user_id,
          snippet.title,
          snippet.content,
          snippet.expires_at_utc,
          snippet.max_views,
          snippet.view_count,
          snippet.last_viewed_at_utc,
          snippet.created_at_utc,
          snippet.updated_at_utc,
          snippet.version,
        );
        return Response.json(serializeSnippet(snippet), {
          status: 201,
          headers: { Location: `/api/v1/snippets/${snippet.id}` },
        });
      });
    }),

    GET: safe(async (req) => {
      const user = requireUser(req);
      const url = new URL(req.url);
      const params = url.searchParams;

      const size = pageSize(params.get("pageSize"));
      const search = (params.get("search") ?? "").trim();
      const status = params.get("status") ?? "all";
      const sortBy = SORT_COLUMNS[params.get("sortBy") ?? "createdAt"] ?? SORT_COLUMNS.createdAt!;
      const direction = params.get("sortDirection") === "asc" ? "ASC" : "DESC";
      const cursor = decodeCursor(params.get("cursor"));

      const filters: string[] = [];
      const args: (string | number)[] = [];

      if (user.role !== "admin") {
        filters.push("owner_user_id = ?");
        args.push(user.id);
      }
      if (search) {
        filters.push("title LIKE ?");
        args.push(`%${search}%`);
      }
      const now = nowIso();
      if (status === "active") {
        filters.push("(expires_at_utc IS NULL OR expires_at_utc > ?)");
        args.push(now);
        filters.push("(max_views IS NULL OR view_count < max_views)");
      } else if (status === "expired") {
        filters.push(
          "((expires_at_utc IS NOT NULL AND expires_at_utc <= ?) OR (max_views IS NOT NULL AND view_count >= max_views))",
        );
        args.push(now);
      }

      if (cursor && cursor["k"] !== undefined && cursor["id"]) {
        const comparator = direction === "ASC" ? ">" : "<";
        filters.push(`(${sortBy}, id) ${comparator} (?, ?)`);
        args.push(cursor["k"]!, cursor["id"]!);
      }

      const where = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
      const rows = all<SnippetRow>(
        `SELECT * FROM snippets ${where} ORDER BY ${sortBy} ${direction}, id ${direction} LIMIT ?`,
        ...args,
        size + 1,
      );

      const hasMore = rows.length > size;
      const items = rows.slice(0, size);
      const last = items[items.length - 1];
      const nextCursor =
        hasMore && last
          ? encodeCursor({ k: String(last[sortKey(sortBy)] ?? ""), id: last.id })
          : null;

      return Response.json({
        items: items.map(serializeSnippetListItem),
        nextCursor,
      });
    }),
  },

  "/api/v1/snippets/:snippetId": {
    GET: safe(async (req) => {
      const user = requireUser(req);
      const snippetId = (req as unknown as { params: { snippetId: string } }).params.snippetId;
      const snippet = loadSnippetForUser(snippetId, user);
      return Response.json(serializeSnippet(snippet));
    }),

    PATCH: safe(async (req) => {
      const user = requireUser(req);
      const snippetId = (req as unknown as { params: { snippetId: string } }).params.snippetId;
      const snippet = loadSnippetForUser(snippetId, user);

      const ifMatch = req.headers.get("if-match")?.replace(/^"|"$/g, "").trim();
      if (ifMatch && ifMatch !== snippet.version) {
        throw conflict("The snippet was changed by another request.");
      }

      const body = await readJson<CreateSnippetRequest>(req);
      const errors: Record<string, string[]> = {};

      let title = snippet.title;
      if (body.title !== undefined) {
        title = body.title.trim();
        if (!title) errors.title = ["Title is required."];
        else if (title.length > 200) {
          errors.title = ["Title must be 200 characters or fewer."];
        }
      }

      let content = snippet.content;
      if (body.content !== undefined) {
        content = body.content;
        if (!content) errors.content = ["Content is required."];
        else if (Buffer.byteLength(content, "utf8") > config.maxContentBytes) {
          errors.content = ["Content must be less than 1 MB."];
        }
      }

      let expiresAtUtc = snippet.expires_at_utc;
      if ("expiresAtUtc" in body) {
        if (body.expiresAtUtc) {
          const parsed = new Date(body.expiresAtUtc);
          if (Number.isNaN(parsed.getTime())) {
            errors.expiresAtUtc = ["Expiration must be a valid date."];
          } else if (parsed.getTime() <= Date.now()) {
            errors.expiresAtUtc = ["Expiration must be in the future."];
          } else {
            expiresAtUtc = parsed.toISOString();
          }
        } else {
          expiresAtUtc = null;
        }
      }

      let maxViews = snippet.max_views;
      if ("maxViews" in body) {
        if (body.maxViews === null || body.maxViews === undefined) {
          maxViews = null;
        } else if (!Number.isInteger(body.maxViews) || body.maxViews < 1) {
          errors.maxViews = ["Max views must be a positive integer."];
        } else {
          maxViews = body.maxViews;
        }
      }

      if (Object.keys(errors).length > 0) throw validationProblem(errors);

      const updatedAt = nowIso();
      const version = newVersion();
      run(
        `UPDATE snippets
           SET title = ?, content = ?, expires_at_utc = ?, max_views = ?,
               updated_at_utc = ?, version = ?
         WHERE id = ?`,
        title,
        content,
        expiresAtUtc,
        maxViews,
        updatedAt,
        version,
        snippet.id,
      );

      return Response.json(
        serializeSnippet({
          ...snippet,
          title,
          content,
          expires_at_utc: expiresAtUtc,
          max_views: maxViews,
          updated_at_utc: updatedAt,
          version,
        }),
      );
    }),

    DELETE: safe(async (req) => {
      const user = requireUser(req);
      const snippetId = (req as unknown as { params: { snippetId: string } }).params.snippetId;
      const snippet = loadSnippetForUser(snippetId, user);
      run("DELETE FROM snippets WHERE id = ?", snippet.id);
      return new Response(null, { status: 204 });
    }),
  },
};

function sortKey(column: string): keyof SnippetRow {
  switch (column) {
    case "updated_at_utc":
      return "updated_at_utc";
    case "title":
      return "title";
    case "view_count":
      return "view_count";
    default:
      return "created_at_utc";
  }
}

export function requireSnippetId(value: string | undefined): string {
  if (!value) throw badRequest("A snippet id is required.");
  return value;
}
