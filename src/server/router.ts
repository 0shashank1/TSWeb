import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { snippetRoutes } from "./routes/snippets";
import { shareLinkRoutes } from "./routes/share-links";
import { adminRoutes } from "./routes/admin";
import { healthRoutes } from "./routes/health";

export function createApiRoutes(): Record<string, unknown> {
  return {
    ...authRoutes,
    ...userRoutes,
    ...snippetRoutes,
    ...shareLinkRoutes,
    ...adminRoutes,
    ...healthRoutes,
  };
}
