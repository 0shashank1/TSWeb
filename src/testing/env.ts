export type AppEnv = "development" | "test" | "production";

export function resolveEnv(): AppEnv {
  if (process.env.NODE_ENV === "production") return "production";
  if (process.env.NODE_ENV === "test") return "test";
  return "development";
}
