import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type {
  CreateSnippetRequest,
  ListSnippetsParams,
  Snippet,
  SnippetListItem,
  UpdateSnippetRequest,
} from "../types";

export const snippetsApi = {
  create: (data: CreateSnippetRequest) =>
    apiClient<Snippet>("/snippets", { method: "POST", body: data }),
  list: (params?: ListSnippetsParams) =>
    apiClient<Paginated<SnippetListItem>>("/snippets", { params }),
  get: (snippetId: string) =>
    apiClient<Snippet>(`/snippets/${snippetId}`),
  update: (snippetId: string, data: UpdateSnippetRequest, version?: string) =>
    apiClient<Snippet>(`/snippets/${snippetId}`, {
      method: "PATCH",
      body: data,
      headers: version ? { "If-Match": `"${version}"` } : undefined,
    }),
  remove: (snippetId: string) =>
    apiClient<void>(`/snippets/${snippetId}`, { method: "DELETE" }),
};
