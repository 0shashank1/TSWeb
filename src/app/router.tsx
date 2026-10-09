import { RouterProvider, createRouter } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { env } from "@/config/env";
import { queryClient } from "@/lib/react-query";
import { routeTree } from "./routes";

export type RouterContext = {
  queryClient: QueryClient;
};

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRouter() {
  return (
    <>
      <RouterProvider router={router} />
      {env.IS_DEV ? <TanStackRouterDevtools router={router} /> : null}
    </>
  );
}
