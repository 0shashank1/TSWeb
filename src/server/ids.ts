import { config } from "./config";

const BASE62 =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function newId(): string {
  return crypto.randomUUID();
}

export function newVersion(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function randomToken(length = 32): string {
  return Buffer.from(randomBytes(length)).toString("base64url");
}

export function randomShareCode(length = config.shareCodeLength): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += BASE62[bytes[i]! % BASE62.length];
  }
  return code;
}

export function sha256Hex(value: string): string {
  return new Bun.CryptoHasher("sha256").update(value).digest("hex");
}

export function hmacSha256Hex(value: string, secret = config.hmacSecret): string {
  return new Bun.CryptoHasher("sha256", secret).update(value).digest("hex");
}

export function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function addSecondsIso(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function isExpired(value: string | null | undefined): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return true;
  return parsed <= Date.now();
}
