import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shareLinksApi } from "../api/share-links-api";
import type { CreateShareLinkRequest } from "../types";

export const shareLinkKeys = {
  all: ["share-links"] as const,
  list: (snippetId: string) => [...shareLinkKeys.all, "list", snippetId] as const,
  detail: (linkId: string) => [...shareLinkKeys.all, "detail", linkId] as const,
};

export function useShareLinks(snippetId: string) {
  return useQuery({
    queryKey: shareLinkKeys.list(snippetId),
    queryFn: () => shareLinksApi.list(snippetId),
    enabled: Boolean(snippetId),
  });
}

export function useShareLink(linkId: string) {
  return useQuery({
    queryKey: shareLinkKeys.detail(linkId),
    queryFn: () => shareLinksApi.get(linkId),
    enabled: Boolean(linkId),
  });
}

export function useCreateShareLink(snippetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateShareLinkRequest) =>
      shareLinksApi.create(snippetId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: shareLinkKeys.list(snippetId),
      });
    },
  });
}

export function useRevokeShareLink(snippetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) => shareLinksApi.revoke(linkId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: shareLinkKeys.list(snippetId),
      });
    },
  });
}
