import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  isLoading?: boolean;
};

export function Button({
  variant = "primary",
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Loading…" : children}
    </button>
  );
}
