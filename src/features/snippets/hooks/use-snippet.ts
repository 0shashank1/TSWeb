import { useQuery } from "@tanstack/react-query";
import { snippetsApi } from "../api/snippets-api";

export function useSnippet(snippetId: string) {
  return useQuery({
    queryKey: ["snippets", "detail", snippetId],
    queryFn: () => snippetsApi.get(snippetId),
    enabled: Boolean(snippetId),
  });
}
