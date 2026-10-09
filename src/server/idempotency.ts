import { get, run } from "./db";
import { nowIso } from "./ids";

type StoredResponse = {
  response_status: number;
  response_body: string;
};

export async function withIdempotency(
  req: Request,
  userId: string,
  endpoint: string,
  execute: () => Response | Promise<Response>,
): Promise<Response> {
  const key = req.headers.get("idempotency-key");
  if (!key) return execute();

  const existing = get<StoredResponse>(
    "SELECT response_status, response_body FROM idempotency_keys WHERE user_id = ? AND idempotency_key = ?",
    userId,
    key,
  );
  if (existing) {
    return new Response(existing.response_body, {
      status: existing.response_status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const response = await execute();
  if (response.status >= 200 && response.status < 300) {
    const body = await response.clone().text();
    run(
      `INSERT OR IGNORE INTO idempotency_keys
         (user_id, idempotency_key, endpoint, response_status, response_body, created_at_utc)
       VALUES (?, ?, ?, ?, ?, ?)`,
      userId,
      key,
      endpoint,
      response.status,
      body,
      nowIso(),
    );
  }
  return response;
}
