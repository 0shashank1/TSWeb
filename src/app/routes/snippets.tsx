import { Link, createRoute } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { SnippetForm } from "@/features/snippets/components/snippet-form";
import { SnippetList } from "@/features/snippets/components/snippet-list";
import { useSnippets } from "@/features/snippets/hooks/use-snippets";
import { rootRoute } from "./root";

export const snippetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/snippets",
  component: SnippetsPage,
});

function SnippetsPage() {
  const { isAuthenticated } = useAuth();
  const snippets = useSnippets();

  if (!isAuthenticated) {
    return (
      <section className="stack">
        <h1>Your snippets</h1>
        <p className="muted">
          Please <Link to="/login">log in</Link> to manage your snippets.
        </p>
      </section>
    );
  }

  return (
    <section className="stack">
      <h1>Your snippets</h1>
      <SnippetForm />
      {snippets.isLoading ? <p className="muted">Loading…</p> : null}
      {snippets.isError ? (
        <p className="form__error">{snippets.error.message}</p>
      ) : null}
      {snippets.data ? <SnippetList snippets={snippets.data.items} /> : null}
    </section>
  );
}
