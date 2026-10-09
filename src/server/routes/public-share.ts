import { issueShareAccessToken, shareAccessClaims } from "../auth";
import { db, get, run } from "../db";
import { hmacSha256Hex, nowIso } from "../ids";
import type { ShareLinkRow, SnippetRow } from "../models";
import { verifyPassword } from "../password";
import {
  ApiProblem,
  badRequest,
  notFound,
  problemBase,
  readJson,
  safe,
  unauthorized,
} from "../problem";
import { clientIp, rateLimit } from "../rate-limit";
import { logAccess } from "../audit";

type Params = { params: { code: string } };

function findLinkByCode(code: string): ShareLinkRow | null {
  return get<ShareLinkRow>(
    "SELECT * FROM share_links WHERE code_hash = ?",
    hmacSha256Hex(code),
  );
}

function fail(
  req: Request,
  link: ShareLinkRow | null,
  reason: string,
): void {
  logAccess({
    shareLinkId: link?.id ?? null,
    wasSuccessful: false,
    failureReason: reason,
    ipAddress: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });
}

export const handlePublicShareGet = safe(async (req) => {
  const { code } = (req as unknown as Params).params;
  rateLimit(`share:${clientIp(req)}`, 120, 60_000);

  const link = findLinkByCode(code);
  if (!link) {
    fail(req, null, "NotFound");
    throw notFound("This link is unavailable.");
  }

  const snippet = get<SnippetRow>(
    "SELECT * FROM snippets WHERE id = ?",
    link.snippet_id,
  );
  if (!snippet) {
    fail(req, link, "SnippetNotFound");
    throw notFound("This link is unavailable.");
  }

  if (link.revoked_at_utc) {
    fail(req, link, "RevokedLink");
    throw notFound("This link is unavailable.");
  }
  if (link.expires_at_utc && Date.parse(link.expires_at_utc) <= Date.now()) {
    fail(req, link, "ExpiredLink");
    throw notFound("This link is unavailable.");
  }
  if (snippet.expires_at_utc && Date.parse(snippet.expires_at_utc) <= Date.now()) {
    fail(req, link, "ExpiredSnippet");
    throw notFound("This link is unavailable.");
  }
  if (link.max_uses !== null && link.use_count >= link.max_uses) {
    fail(req, link, "MaxUsesExceeded");
    throw notFound("This link is unavailable.");
  }
  if (snippet.max_views !== null && snippet.view_count >= snippet.max_views) {
    fail(req, link, "MaxViewsExceeded");
    throw notFound("This link is unavailable.");
  }

  if (link.password_hash) {
    const claims = shareAccessClaims(req);
    if (!claims || claims.sl !== link.id) {
      fail(req, link, "PasswordRequired");
      throw new ApiProblem(401, "Password required", {
        type: `${problemBase}/password-required`,
        detail: "This link is password protected.",
      });
    }
  }

  const now = nowIso();
  const useUpdate = db
    .query(
      `UPDATE share_links
         SET use_count = use_count + 1, last_accessed_at_utc = ?
       WHERE id = ? AND (max_uses IS NULL OR use_count < max_uses)`,
    )
    .run(now, link.id);
  const viewUpdate = db
    .query(
      `UPDATE snippets
         SET view_count = view_count + 1, last_viewed_at_utc = ?
       WHERE id = ? AND (max_views IS NULL OR view_count < max_views)`,
    )
    .run(now, snippet.id);

  if (useUpdate.changes === 0 || viewUpdate.changes === 0) {
    fail(req, link, "MaxUsesExceeded");
    throw notFound("This link is unavailable.");
  }

  logAccess({
    shareLinkId: link.id,
    wasSuccessful: true,
    ipAddress: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return Response.json({
    id: snippet.id,
    title: snippet.title,
    content: snippet.content,
    expiresAtUtc: snippet.expires_at_utc ?? link.expires_at_utc,
  });
});

export const handleUnlock = safe(async (req) => {
  const { code } = (req as unknown as Params).params;
  const ip = clientIp(req);
  rateLimit(`unlock:${ip}:${code}`, 5, 60_000);

  const body = await readJson<{ password?: string }>(req);
  const password = body.password ?? "";
  if (!password) throw badRequest("A password is required.");

  const link = findLinkByCode(code);
  if (!link) throw notFound("This link is unavailable.");
  if (link.revoked_at_utc) throw notFound("This link is unavailable.");
  if (link.expires_at_utc && Date.parse(link.expires_at_utc) <= Date.now()) {
    throw notFound("This link is unavailable.");
  }
  if (!link.password_hash) {
    throw badRequest("This link is not password protected.");
  }

  const ok = await verifyPassword(password, link.password_hash);
  if (!ok) {
    fail(req, link, "InvalidPassword");
    throw unauthorized("The password is incorrect.");
  }

  const token = issueShareAccessToken(link.id);
  return Response.json(token);
});
