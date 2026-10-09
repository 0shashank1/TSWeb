import { serve } from "bun";
import index from "./index.html";
import { config } from "./server/config";
import { createApiRoutes } from "./server/router";
import { notFound, problemResponse, safe } from "./server/problem";
import {
  handlePublicShareGet,
  handleUnlock,
} from "./server/routes/public-share";
import { seedAdmin } from "./server/seed";

await seedAdmin();

const nonce = crypto.randomUUID();
const spaPath = `/__spa__/${nonce}`;

let server: { url: URL };

async function serveSpa(req: Request): Promise<Response> {
  const response = await fetch(new URL(spaPath, server.url), {
    method: "GET",
    headers: req.headers,
  });
  return new Response(response.body, response);
}

function wantsHtml(req: Request): boolean {
  if (req.method !== "GET") return false;
  const accept = req.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

const apiRoutes = createApiRoutes() as Record<string, unknown>;

server = serve({
  port: config.port,

  routes: {
    [spaPath]: index,

    "/s/:code": {
      GET: safe(async (req) => {
        if (wantsHtml(req)) return serveSpa(req);
        return handlePublicShareGet(req);
      }),
    },
    "/s/:code/unlock": {
      POST: handleUnlock,
    },

    ...apiRoutes,
  } as never,

  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      return problemResponse(
        notFound("The requested API endpoint does not exist."),
        url.pathname,
      );
    }
    return serveSpa(req);
  },

  development:
    process.env.NODE_ENV !== "production"
      ? { hmr: true, console: true }
      : false,
});

console.log(`🚀 TextShare API running at ${server.url}`);
