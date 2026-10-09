import { base64UrlDecode, base64UrlEncode } from "./ids";
import { badRequest } from "./problem";

export type Cursor = Record<string, string>;

export function encodeCursor(cursor: Cursor): string {
  return base64UrlEncode(JSON.stringify(cursor));
}

export function decodeCursor(value: string | null | undefined): Cursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(base64UrlDecode(value)) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    return parsed as Cursor;
  } catch {
    throw badRequest("The pagination cursor is invalid.");
  }
}

export function pageSize(value: string | null, fallback = 20, max = 100): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}
