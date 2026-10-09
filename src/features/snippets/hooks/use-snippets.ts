import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { snippetsApi } from "../api/snippets-api";
import type { ListSnippetsParams } from "../types";

export function useSnippets(params?: ListSnippetsParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["snippets", "list", params ?? {}],
    queryFn: () => snippetsApi.list(params),
    enabled: isAuthenticated,
  });
}
