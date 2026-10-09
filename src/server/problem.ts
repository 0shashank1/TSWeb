export const problemBase = "https://api.textshare.dev/problems";

export type ProblemDetailsBody = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};

export class ApiProblem extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail?: string;
  readonly type: string;
  readonly errors?: Record<string, string[]>;

  constructor(
    status: number,
    title: string,
    options: {
      detail?: string;
      type?: string;
      errors?: Record<string, string[]>;
    } = {},
  ) {
    super(options.detail ?? title);
    this.name = "ApiProblem";
    this.status = status;
    this.title = title;
    this.detail = options.detail;
    this.type = options.type ?? `${problemBase}/${slug(title)}`;
    this.errors = options.errors;
  }
}

function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function problemResponse(problem: ApiProblem, instance?: string): Response {
  const body: ProblemDetailsBody = {
    type: problem.type,
    title: problem.title,
    status: problem.status,
    ...(problem.detail ? { detail: problem.detail } : {}),
    ...(instance ? { instance } : {}),
    traceId: crypto.randomUUID(),
    ...(problem.errors ? { errors: problem.errors } : {}),
  };
  return Response.json(body, {
    status: problem.status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

export function validationProblem(
  errors: Record<string, string[]>,
  detail = "One or more validation errors occurred.",
): ApiProblem {
  return new ApiProblem(400, "Validation failed", {
    detail,
    type: `${problemBase}/validation-error`,
    errors,
  });
}

export function unauthorized(detail = "Authentication is required."): ApiProblem {
  return new ApiProblem(401, "Unauthorized", { detail });
}

export function forbidden(detail = "You are not allowed to perform this action."): ApiProblem {
  return new ApiProblem(403, "Forbidden", { detail });
}

export function notFound(detail = "The requested resource was not found."): ApiProblem {
  return new ApiProblem(404, "Not Found", { detail });
}

export function conflict(detail: string): ApiProblem {
  return new ApiProblem(409, "Conflict", { detail });
}

export function tooManyRequests(detail = "Too many requests. Try again later."): ApiProblem {
  return new ApiProblem(429, "Too Many Requests", { detail });
}

export function badRequest(detail: string): ApiProblem {
  return new ApiProblem(400, "Bad Request", { detail });
}

export async function readJson<T = Record<string, unknown>>(
  req: Request,
): Promise<T> {
  try {
    const body = (await req.json()) as T;
    if (body === null || typeof body !== "object") {
      throw new Error("Body must be a JSON object.");
    }
    return body;
  } catch {
    throw badRequest("The request body is not valid JSON.");
  }
}

export function assert(
  condition: unknown,
  problem: ApiProblem,
): asserts condition {
  if (!condition) throw problem;
}

type Handler = (req: Request, server?: unknown) => Response | Promise<Response>;

export function safe(handler: Handler): Handler {
  return async (req, server) => {
    try {
      return await handler(req, server);
    } catch (error) {
      if (error instanceof ApiProblem) {
        return problemResponse(error, new URL(req.url).pathname);
      }
      console.error("[server] unhandled error:", error);
      return problemResponse(
        new ApiProblem(500, "Unexpected server error", {
          detail: "An unexpected error occurred while processing the request.",
          type: `${problemBase}/internal-error`,
        }),
        new URL(req.url).pathname,
      );
    }
  };
}
