const hasProcess = typeof process !== "undefined";

export const env = {
  API_URL:
    (hasProcess ? process.env.BUN_PUBLIC_API_URL : undefined) ?? "/api/v1",
  APP_URL: (hasProcess ? process.env.BUN_PUBLIC_APP_URL : undefined) ?? "",
  IS_DEV: process.env.NODE_ENV !== "production",
} as const;
