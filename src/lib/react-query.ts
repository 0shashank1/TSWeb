import { QueryClient } from "@tanstack/react-query";
import type { DefaultOptions } from "@tanstack/react-query";

export const queryConfig = {
  queries: {
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 30_000,
  },
} satisfies DefaultOptions;

export const queryClient = new QueryClient({ defaultOptions: queryConfig });
