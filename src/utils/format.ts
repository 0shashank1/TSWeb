export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export function truncate(value: string, length = 80): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trimEnd()}…`;
}
