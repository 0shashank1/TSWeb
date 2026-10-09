import { apiClient } from "@/lib/api-client";
import type { SharedText, UnlockRequest, UnlockResponse } from "../types";

export const publicShareApi = {
  get: (code: string, shareAccessToken?: string) =>
    apiClient<SharedText>(`/s/${code}`, {
      auth: false,
      baseUrl: "",
      headers: shareAccessToken
        ? { Authorization: `Bearer ${shareAccessToken}` }
        : undefined,
    }),
  unlock: (code: string, data: UnlockRequest) =>
    apiClient<UnlockResponse>(`/s/${code}/unlock`, {
      method: "POST",
      body: data,
      auth: false,
      baseUrl: "",
    }),
};
