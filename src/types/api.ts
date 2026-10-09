export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};

export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
};

export type PaginationParams = {
  pageSize?: number;
  cursor?: string | null;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type EmptyResponse = void;
