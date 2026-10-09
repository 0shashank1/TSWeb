import { config } from "./config";
import { base64UrlDecode, base64UrlEncode } from "./ids";

export type AccessTokenClaims = {
  sub: string;
  role: "user" | "admin";
  typ: "access";
  iat: number;
  exp: number;
  jti: string;
};

export type ShareAccessTokenClaims = {
  sl: string;
  typ: "share-access";
  iat: number;
  exp: number;
  jti: string;
};

export type TokenClaims = AccessTokenClaims | ShareAccessTokenClaims;

type SignableClaims =
  | Omit<AccessTokenClaims, "iat" | "exp" | "jti">
  | Omit<ShareAccessTokenClaims, "iat" | "exp" | "jti">;

function sign(input: string): string {
  return new Bun.CryptoHasher("sha256", config.jwtSecret)
    .update(input)
    .digest("base64url");
}

export function signToken(
  claims: SignableClaims & { ttlSeconds: number },
): { token: string; expiresAtUtc: string } {
  const now = Math.floor(Date.now() / 1000);
  const { ttlSeconds, ...rest } = claims;
  const payload = { ...rest, iat: now, exp: now + ttlSeconds, jti: crypto.randomUUID() };
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${header}.${body}`);
  return {
    token: `${header}.${body}.${signature}`,
    expiresAtUtc: new Date(payload.exp * 1000).toISOString(),
  };
}

export function verifyToken<T extends TokenClaims = TokenClaims>(
  token: string,
): T | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts as [string, string, string];
  const expected = sign(`${header}.${body}`);
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(signature, expected)) return null;
  try {
    const claims = JSON.parse(base64UrlDecode(body)) as TokenClaims;
    if (typeof claims.exp !== "number" || claims.exp * 1000 <= Date.now()) {
      return null;
    }
    return claims as T;
  } catch {
    return null;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
