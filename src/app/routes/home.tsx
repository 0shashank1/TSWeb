import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

function HomePage() {
  return (
    <section className="stack">
      <h1>TextShare</h1>
      <p className="muted">
        Share text snippets securely with expiring, usage-limited, and
        password-protected links.
      </p>
    </section>
  );
}
