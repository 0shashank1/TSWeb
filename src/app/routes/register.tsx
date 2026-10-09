import { createRoute } from "@tanstack/react-router";
import { RegisterForm } from "@/features/auth/components/register-form";
import { rootRoute } from "./root";

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <section className="stack">
      <h1>Create account</h1>
      <RegisterForm />
    </section>
  );
}
