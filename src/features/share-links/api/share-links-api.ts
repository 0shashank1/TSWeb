import { apiClient } from "@/lib/api-client";
import type { Paginated, PaginationParams } from "@/types/api";
import type {
  CreateShareLinkRequest,
  CreateShareLinkResponse,
  ShareLink,
  UpdateShareLinkRequest,
} from "../types";

export const shareLinksApi = {
  create: (snippetId: string, data: CreateShareLinkRequest) =>
    apiClient<CreateShareLinkResponse>(`/snippets/${snippetId}/links`, {
      method: "POST",
      body: data,
    }),
  list: (snippetId: string, params?: PaginationParams) =>
    apiClient<Paginated<ShareLink>>(`/snippets/${snippetId}/links`, { params }),
  get: (linkId: string) =>
    apiClient<ShareLink>(`/share-links/${linkId}`),
  update: (linkId: string, data: UpdateShareLinkRequest) =>
    apiClient<ShareLink>(`/share-links/${linkId}`, {
      method: "PATCH",
      body: data,
    }),
  revoke: (linkId: string) =>
    apiClient<void>(`/share-links/${linkId}`, { method: "DELETE" }),
};
