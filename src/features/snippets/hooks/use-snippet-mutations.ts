import { useMutation, useQueryClient } from "@tanstack/react-query";
import { snippetsApi } from "../api/snippets-api";
import type { CreateSnippetRequest, UpdateSnippetRequest } from "../types";

export function useCreateSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSnippetRequest) => snippetsApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["snippets"] });
    },
  });
}

export function useUpdateSnippet(snippetId: string, version?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSnippetRequest) =>
      snippetsApi.update(snippetId, data, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["snippets"] });
    },
  });
}

export function useDeleteSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (snippetId: string) => snippetsApi.remove(snippetId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["snippets"] });
    },
  });
}
