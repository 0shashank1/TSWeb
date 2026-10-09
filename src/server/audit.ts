import { run } from "./db";
import { newId, nowIso } from "./ids";

export type AccessLogInput = {
  shareLinkId: string | null;
  userId?: string | null;
  wasSuccessful: boolean;
  failureReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export function logAccess(input: AccessLogInput): void {
  run(
    `INSERT INTO share_access_logs
       (id, share_link_id, user_id, accessed_at_utc, was_successful, failure_reason, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    newId(),
    input.shareLinkId,
    input.userId ?? null,
    nowIso(),
    input.wasSuccessful ? 1 : 0,
    input.failureReason ?? null,
    input.ipAddress ?? null,
    input.userAgent ?? null,
  );
}
