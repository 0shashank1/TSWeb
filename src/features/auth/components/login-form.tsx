import { useNavigate } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paths } from "@/config/paths";
import { useLogin } from "../hooks/use-login";

export function LoginForm() {
  const navigate = useNavigate();
  const login = useLogin();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    login.mutate(
      {
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      },
      { onSuccess: () => navigate({ to: paths.snippets }) },
    );
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {login.isError ? <p className="form__error">{login.error.message}</p> : null}
      <Button type="submit" isLoading={login.isPending}>
        Log in
      </Button>
    </form>
  );
}
