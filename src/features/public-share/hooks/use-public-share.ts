import { useMutation, useQuery } from "@tanstack/react-query";
import { publicShareApi } from "../api/public-share-api";
import type { UnlockRequest } from "../types";

export const publicShareKeys = {
  detail: (code: string, shareAccessToken?: string) =>
    ["public-share", code, shareAccessToken ?? "anonymous"] as const,
};

export function useSharedText(code: string, shareAccessToken?: string) {
  return useQuery({
    queryKey: publicShareKeys.detail(code, shareAccessToken),
    queryFn: () => publicShareApi.get(code, shareAccessToken),
    enabled: Boolean(code),
    retry: false,
  });
}

export function useUnlockShare(code: string) {
  return useMutation({
    mutationFn: (data: UnlockRequest) => publicShareApi.unlock(code, data),
  });
}
