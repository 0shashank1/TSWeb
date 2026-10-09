import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/format";
import {
  useCreateShareLink,
  useRevokeShareLink,
  useShareLinks,
} from "../hooks/use-share-links";

export function ShareLinkPanel({ snippetId }: { snippetId: string }) {
  const links = useShareLinks(snippetId);
  const createLink = useCreateShareLink(snippetId);
  const revokeLink = useRevokeShareLink(snippetId);
  const [createdUrl, setCreatedUrl] = useState<string>();

  const handleCreate = () => {
    createLink.mutate(
      {},
      { onSuccess: (data) => setCreatedUrl(data.url) },
    );
  };

  return (
    <div className="panel">
      <div className="panel__header">
        <h2>Share links</h2>
        <Button onClick={handleCreate} isLoading={createLink.isPending}>
          Create link
        </Button>
      </div>

      {createdUrl ? (
        <p className="notice">
          New link: <code>{createdUrl}</code>
        </p>
      ) : null}

      {links.isLoading ? <p className="muted">Loading…</p> : null}
      {links.data && links.data.items.length > 0 ? (
        <ul className="list">
          {links.data.items.map((link) => (
            <li key={link.id} className="list__item">
              <span>
                {link.isRevoked ? "Revoked" : "Active"} · {link.useCount}/
                {link.maxUses ?? "∞"} uses
              </span>
              <span className="muted">
                expires {formatDate(link.expiresAtUtc)}
              </span>
              <Button
                variant="ghost"
                onClick={() => revokeLink.mutate(link.id)}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No share links yet.</p>
      )}
    </div>
  );
}
