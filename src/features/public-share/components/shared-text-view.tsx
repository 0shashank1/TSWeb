import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { useSharedText, useUnlockShare } from "../hooks/use-public-share";
import type { SharedText } from "../types";

export function SharedTextView({ code }: { code: string }) {
  const [shareAccessToken, setShareAccessToken] = useState<string>();
  const shared = useSharedText(code, shareAccessToken);
  const unlock = useUnlockShare(code);

  const handleUnlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    unlock.mutate(
      { password: String(form.get("password") ?? "") },
      { onSuccess: (data) => setShareAccessToken(data.accessToken) },
    );
  };

  const passwordRequired =
    shared.error instanceof ApiError && shared.error.status === 401;

  if (passwordRequired) {
    return (
      <form className="form" onSubmit={handleUnlock}>
        <p className="muted">This link is password protected.</p>
        <Input label="Password" name="password" type="password" required />
        {unlock.isError ? (
          <p className="form__error">{unlock.error.message}</p>
        ) : null}
        <Button type="submit" isLoading={unlock.isPending}>
          Unlock
        </Button>
      </form>
    );
  }

  if (shared.isLoading) return <p className="muted">Loading…</p>;
  if (shared.isError) return <p className="form__error">This link is unavailable.</p>;
  if (!shared.data) return null;

  return <SharedContent text={shared.data} />;
}

function SharedContent({ text }: { text: SharedText }) {
  return (
    <article className="card">
      <h2 className="card__title">{text.title}</h2>
      <pre className="code-block">{text.content}</pre>
    </article>
  );
}
