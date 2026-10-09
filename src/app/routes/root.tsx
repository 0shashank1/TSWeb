import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import type { RouterContext } from "../router";

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="empty">
      <h2>Page not found</h2>
      <p className="muted">The page you are looking for does not exist.</p>
    </div>
  ),
});

function RootComponent() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
