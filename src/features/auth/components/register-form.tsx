import { useNavigate } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paths } from "@/config/paths";
import { useRegister } from "../hooks/use-register";

export function RegisterForm() {
  const navigate = useNavigate();
  const register = useRegister();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    register.mutate(
      {
        displayName: String(form.get("displayName") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      },
      { onSuccess: () => navigate({ to: paths.snippets }) },
    );
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <Input label="Display name" name="displayName" required />
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
        autoComplete="new-password"
        required
      />
      {register.isError ? (
        <p className="form__error">{register.error.message}</p>
      ) : null}
      <Button type="submit" isLoading={register.isPending}>
        Create account
      </Button>
    </form>
  );
}
