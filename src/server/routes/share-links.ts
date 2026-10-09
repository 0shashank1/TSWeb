import { requireUser } from "../auth";
import { config } from "../config";
import { all, get, run } from "../db";
import { hmacSha256Hex, newId, nowIso, randomShareCode } from "../ids";
import type { ShareLinkRow, UserRow } from "../models";
import { hashPassword } from "../password";
import { conflict, forbidden, notFound, readJson, safe, validationProblem } from "../problem";
import { decodeCursor, encodeCursor, pageSize } from "../pagination";
import {
  serializeCreatedShareLink,
  serializeShareLink,
} from "../serialize";
import { loadSnippetForUser } from "./snippets";
import { withIdempotency } from "../idempotency";

type CreateShareLinkRequest = {
  expiresAtUtc?: string | null;
  maxUses?: number | null;
  password?: string | null;
};

type UpdateShareLinkRequest = {
  expiresAtUtc?: string | null;
  maxUses?: number | null;
};

function loadLinkForUser(linkId: string, user: UserRow): ShareLinkRow {
  const link = get<ShareLinkRow>("SELECT * FROM share_links WHERE id = ?", linkId);
  if (!link) throw notFound("The share link does not exist.");
  const snippet = get<{ owner_user_id: string }>(
    "SELECT owner_user_id FROM snippets WHERE id = ?",
    link.snippet_id,
  );
  if (!snippet) throw notFound("The share link does not exist.");
  if (snippet.owner_user_id !== user.id && user.role !== "admin") {
    throw forbidden("You do not have access to this share link.");
  }
  return link;
}

function normalizeFutureDate(
  value: string,
  errors: Record<string, string[]>,
  field: string,
): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    errors[field] = ["Expiration must be a valid date."];
    return value;
  }
  if (parsed.getTime() <= Date.now()) {
    errors[field] = ["Expiration must be in the future."];
  }
  return parsed.toISOString();
}

export const shareLinkRoutes = {
  "/api/v1/snippets/:snippetId/links": {
    POST: safe(async (req) => {
      const user = requireUser(req);
      const snippetId = (req as unknown as { params: { snippetId: string } }).params.snippetId;

      return withIdempotency(req, user.id, "create-share-link", async () => {
        const snippet = loadSnippetForUser(snippetId, user);
        const body = await readJson<CreateShareLinkRequest>(req);

        const errors: Record<string, string[]> = {};
        let expiresAtUtc: string | null = null;
        if (body.expiresAtUtc) {
          expiresAtUtc = normalizeFutureDate(body.expiresAtUtc, errors, "expiresAtUtc");
        }

        let maxUses: number | null = null;
        if (body.maxUses !== undefined && body.maxUses !== null) {
          if (!Number.isInteger(body.maxUses) || body.maxUses < 1) {
            errors.maxUses = ["Max uses must be a positive integer."];
          } else {
            maxUses = body.maxUses;
          }
        }

        let passwordHash: string | null = null;
        if (body.password) {
          if (body.password.length < 4) {
            errors.password = ["Password must be at least 4 characters."];
          } else {
            passwordHash = await hashPassword(body.password);
          }
        }

        if (Object.keys(errors).length > 0) throw validationProblem(errors);

        const code = randomShareCode();
        const link: ShareLinkRow = {
          id: newId(),
          snippet_id: snippet.id,
          code_hash: hmacSha256Hex(code),
          password_hash: passwordHash,
          expires_at_utc: expiresAtUtc,
          max_uses: maxUses,
          use_count: 0,
          revoked_at_utc: null,
          last_accessed_at_utc: null,
          created_at_utc: nowIso(),
        };
        run(
          `INSERT INTO share_links
             (id, snippet_id, code_hash, password_hash, expires_at_utc, max_uses, use_count,
              revoked_at_utc, last_accessed_at_utc, created_at_utc)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          link.id,
          link.snippet_id,
          link.code_hash,
          link.password_hash,
          link.expires_at_utc,
          link.max_uses,
          link.use_count,
          link.revoked_at_utc,
          link.last_accessed_at_utc,
          link.created_at_utc,
        );

        const base = config.shareUrlBase || new URL(req.url).origin;
        const url = `${base}/s/${code}`;
        return Response.json(serializeCreatedShareLink(link, url), {
          status: 201,
        });
      });
    }),

    GET: safe(async (req) => {
      const user = requireUser(req);
      const snippetId = (req as unknown as { params: { snippetId: string } }).params.snippetId;
      const snippet = loadSnippetForUser(snippetId, user);
      const url = new URL(req.url);
      const size = pageSize(url.searchParams.get("pageSize"));
      const cursor = decodeCursor(url.searchParams.get("cursor"));

      const filters = ["snippet_id = ?"];
      const args: (string | number)[] = [snippet.id];
      if (cursor && cursor["id"] && cursor["k"]) {
        filters.push("(created_at_utc, id) < (?, ?)");
        args.push(cursor["k"]!, cursor["id"]!);
      }

      const rows = all<ShareLinkRow>(
        `SELECT * FROM share_links WHERE ${filters.join(" AND ")}
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
        items: items.map(serializeShareLink),
        nextCursor,
      });
    }),
  },

  "/api/v1/share-links/:linkId": {
    GET: safe(async (req) => {
      const user = requireUser(req);
      const linkId = (req as unknown as { params: { linkId: string } }).params.linkId;
      return Response.json(serializeShareLink(loadLinkForUser(linkId, user)));
    }),

    PATCH: safe(async (req) => {
      const user = requireUser(req);
      const linkId = (req as unknown as { params: { linkId: string } }).params.linkId;
      const link = loadLinkForUser(linkId, user);
      const body = await readJson<UpdateShareLinkRequest>(req);

      const errors: Record<string, string[]> = {};
      let expiresAtUtc = link.expires_at_utc;
      if ("expiresAtUtc" in body) {
        expiresAtUtc = body.expiresAtUtc
          ? normalizeFutureDate(body.expiresAtUtc, errors, "expiresAtUtc")
          : null;
      }

      let maxUses = link.max_uses;
      if ("maxUses" in body) {
        if (body.maxUses === null || body.maxUses === undefined) {
          maxUses = null;
        } else if (!Number.isInteger(body.maxUses) || body.maxUses < 1) {
          errors.maxUses = ["Max uses must be a positive integer."];
        } else {
          maxUses = body.maxUses;
        }
      }

      if (Object.keys(errors).length > 0) throw validationProblem(errors);
      if (link.revoked_at_utc) {
        throw conflict("A revoked link cannot be modified.");
      }

      run(
        "UPDATE share_links SET expires_at_utc = ?, max_uses = ? WHERE id = ?",
        expiresAtUtc,
        maxUses,
        link.id,
      );

      return Response.json(
        serializeShareLink({
          ...link,
          expires_at_utc: expiresAtUtc,
          max_uses: maxUses,
        }),
      );
    }),

    DELETE: safe(async (req) => {
      const user = requireUser(req);
      const linkId = (req as unknown as { params: { linkId: string } }).params.linkId;
      const link = loadLinkForUser(linkId, user);
      if (!link.revoked_at_utc) {
        run(
          "UPDATE share_links SET revoked_at_utc = ? WHERE id = ?",
          nowIso(),
          link.id,
        );
      }
      return new Response(null, { status: 204 });
    }),
  },
};
