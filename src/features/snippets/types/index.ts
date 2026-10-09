import type { PaginationParams } from "@/types/api";

export type Snippet = {
  id: string;
  title: string;
  content: string;
  expiresAtUtc: string | null;
  maxViews: number | null;
  viewCount: number;
  lastViewedAtUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  version?: string;
};

export type SnippetListItem = {
  id: string;
  title: string;
  expiresAtUtc: string | null;
  viewCount: number;
  createdAtUtc: string;
};

export type CreateSnippetRequest = {
  title: string;
  content: string;
  expiresAtUtc?: string | null;
  maxViews?: number | null;
};

export type UpdateSnippetRequest = Partial<CreateSnippetRequest>;

export type ListSnippetsParams = PaginationParams & {
  status?: "active" | "expired" | "all";
};
