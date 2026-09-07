import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

/** Axios-shaped error, so retry logic can read the HTTP status off it. */
interface HttpError extends Error {
  response?: { status?: number }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 30s, so navigating back to a page you just left
      // reuses the cache instead of re-hitting the network. Queries that need
      // stricter or looser behaviour override these per-query — see
      // gscQueries.js (10 min) and QueryBase.ts (Infinity).
      staleTime: 30 * 1000,
      // Note: this is `gcTime` in React Query v5 — the old `cacheTime` name was
      // removed and is silently ignored if used.
      gcTime: 5 * 60 * 1000,
      // Default `true` refetches on mount only when data is stale, which is what
      // we want; "always" would refetch on every single mount regardless.
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Don't burn retries on 4xx — those won't succeed on a second attempt.
      retry: (failureCount, error) => {
        const status = (error as HttpError)?.response?.status
        if (status !== undefined && status >= 400 && status < 500) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})

export const QueryProvider = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)
