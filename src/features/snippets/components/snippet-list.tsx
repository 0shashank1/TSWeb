import { SnippetCard } from "./snippet-card";
import type { SnippetListItem } from "../types";

export function SnippetList({ snippets }: { snippets: SnippetListItem[] }) {
  if (snippets.length === 0) {
    return <p className="muted">No snippets yet.</p>;
  }

  return (
    <div className="grid">
      {snippets.map((snippet) => (
        <SnippetCard key={snippet.id} snippet={snippet} />
      ))}
    </div>
  );
}
