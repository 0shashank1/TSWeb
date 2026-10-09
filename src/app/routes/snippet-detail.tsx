import { createRoute } from "@tanstack/react-router";
import { formatDate } from "@/utils/format";
import { ShareLinkPanel } from "@/features/share-links/components/share-link-panel";
import { useSnippet } from "@/features/snippets/hooks/use-snippet";
import { rootRoute } from "./root";

export const snippetDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/snippets/$snippetId",
  component: SnippetDetailPage,
});

function SnippetDetailPage() {
  const { snippetId } = snippetDetailRoute.useParams();
  const snippet = useSnippet(snippetId);

  if (snippet.isLoading) return <p className="muted">Loading…</p>;
  if (snippet.isError)
    return <p className="form__error">{snippet.error.message}</p>;
  if (!snippet.data) return null;

  return (
    <section className="stack">
      <h1>{snippet.data.title}</h1>
      <p className="muted">
        {snippet.data.viewCount} views · updated{" "}
        {formatDate(snippet.data.updatedAtUtc)}
      </p>
      <pre className="code-block">{snippet.data.content}</pre>
      <ShareLinkPanel snippetId={snippetId} />
    </section>
  );
}
