import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateSnippet } from "../hooks/use-snippet-mutations";

export function SnippetForm() {
  const createSnippet = useCreateSnippet();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const maxViews = form.get("maxViews");

    createSnippet.mutate(
      {
        title: String(form.get("title") ?? ""),
        content: String(form.get("content") ?? ""),
        expiresAtUtc: (form.get("expiresAtUtc") as string) || null,
        maxViews: maxViews ? Number(maxViews) : null,
      },
      { onSuccess: () => formElement.reset() },
    );
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <Input label="Title" name="title" required />
      <label className="field" htmlFor="content">
        <span className="field__label">Content</span>
        <textarea id="content" name="content" className="field__input" required />
      </label>
      <Input label="Expires at" name="expiresAtUtc" type="datetime-local" />
      <Input label="Max views" name="maxViews" type="number" min={1} />
      {createSnippet.isError ? (
        <p className="form__error">{createSnippet.error.message}</p>
      ) : null}
      <Button type="submit" isLoading={createSnippet.isPending}>
        Create snippet
      </Button>
    </form>
  );
}
