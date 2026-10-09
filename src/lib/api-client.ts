import { env } from "@/config/env";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import type { ProblemDetails } from "@/types/api";

export class ApiError extends Error {
  readonly status: number;
  readonly problem?: ProblemDetails;

  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}

export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: object;
  auth?: boolean;
  baseUrl?: string;
};

function buildUrl(
  path: string,
  params?: object,
  baseUrl: string = env.API_URL,
): string {
  const base = path.startsWith("http") ? path : `${baseUrl}${path}`;
  if (!params) return base;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  if (!query) return base;
  return `${base}${base.includes("?") ? "&" : "?"}${query}`;
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    body,
    params,
    auth = true,
    baseUrl,
    headers,
    ...init
  } = options;
  const accessToken = auth ? useAuthStore.getState().accessToken : null;

  const response = await fetch(buildUrl(path, params, baseUrl), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const problem = (payload ?? undefined) as ProblemDetails | undefined;
    throw new ApiError(
      response.status,
      problem?.title ?? response.statusText,
      problem,
    );
  }

  return payload as T;
}
