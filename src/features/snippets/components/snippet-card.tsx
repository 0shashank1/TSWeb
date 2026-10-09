import { Link } from "@tanstack/react-router";
import { formatDate } from "@/utils/format";
import type { SnippetListItem } from "../types";

export function SnippetCard({ snippet }: { snippet: SnippetListItem }) {
  return (
    <Link
      to="/snippets/$snippetId"
      params={{ snippetId: snippet.id }}
      className="card"
    >
      <h3 className="card__title">{snippet.title}</h3>
      <p className="card__meta">
        {snippet.viewCount} views · created {formatDate(snippet.createdAtUtc)}
      </p>
      {snippet.expiresAtUtc ? (
        <p className="card__meta">expires {formatDate(snippet.expiresAtUtc)}</p>
      ) : null}
    </Link>
  );
}
