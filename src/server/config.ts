function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
}

const isProduction = process.env.NODE_ENV === "production";

function secret(name: string, fallback: string): string {
  const value = process.env[name];
  if (value && value.length > 0) return value;
  if (isProduction) {
    console.warn(
      `[config] ${name} is not set; falling back to an insecure development secret.`,
    );
  }
  return fallback;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databasePath: optional("DATABASE_PATH", "textshare.db"),

  jwtSecret: secret("JWT_SECRET", "dev-jwt-secret-change-me"),
  hmacSecret: secret("HMAC_SECRET", "dev-hmac-secret-change-me"),

  accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 15 * 60),
  refreshTokenTtlSeconds: Number(
    process.env.REFRESH_TOKEN_TTL_SECONDS ?? 30 * 24 * 60 * 60,
  ),
  shareAccessTokenTtlSeconds: Number(
    process.env.SHARE_ACCESS_TOKEN_TTL_SECONDS ?? 10 * 60,
  ),

  shareCodeLength: 16,
  shareUrlBase: optional("SHARE_URL_BASE", ""),

  maxContentBytes: 1024 * 1024,

  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? null,
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? null,

  isProduction,
} as const;
