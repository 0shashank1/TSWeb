import { createRoute } from "@tanstack/react-router";
import { LoginForm } from "@/features/auth/components/login-form";
import { rootRoute } from "./root";

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

function LoginPage() {
  return (
    <section className="stack">
      <h1>Log in</h1>
      <LoginForm />
    </section>
  );
}
