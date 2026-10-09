import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, name, ...props }: InputProps) {
  const inputId = id ?? name;

  return (
    <label className="field" htmlFor={inputId}>
      <span className="field__label">{label}</span>
      <input id={inputId} name={name} className="field__input" {...props} />
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}
