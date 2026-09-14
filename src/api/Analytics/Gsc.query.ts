// src/api/Analytics/Gsc.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import { GscAPI } from "./Gsc.api"
import type { ApiResponse } from "@/types/apiHelpers"
import { toast } from "sonner"

class GscQuery extends QueryBase<unknown> {
  baseKey = ["gsc"]
  api = GscAPI

  useVerifiedSites = (options?: AnyUseQueryOptions<ApiResponse<"/gsc/data", "get">>) =>
    this.useFetchQuery("verifiedSites", () => this.api.getVerifiedSites(), options)

  useAnalytics = (
    params: Record<string, unknown>,
    options?: AnyUseQueryOptions<ApiResponse<"/gsc/data", "get">>
  ) => this.useParamQuery("analytics", (p) => this.api.getAnalytics(p), params, options)

  /**
   * Live indexing status for one published URL.
   *
   * Search Console's URL Inspection API is rate limited (per-site daily quota),
   * so this is cached aggressively and never retried automatically — a failure
   * here is informational, not worth burning quota on.
   */
  useIndexingStatus = (
    pageUrl?: string,
    options?: AnyUseQueryOptions<ApiResponse<"/gsc/indexing/inspect", "get">>
  ) =>
    this.useFetchQuery(`indexingStatus-${pageUrl}`, () => this.api.inspectIndexing({ pageUrl }), {
      enabled: !!pageUrl,
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
      ...options,
    })

  useConnect = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<ApiResponse<"/gsc/callback", "get">, { code: string; state?: string }>(
      ({ code, state }) => this.api.connect({ code, state }),
      options
    )

  /**
   * Ask Google to crawl a published URL.
   *
   * Deliberately does not refetch the inspection right away: Google takes hours
   * to days to act on a request, so an immediate re-check would just spend quota
   * to show the same "not indexed" result. The cached status is marked stale
   * instead, so it refreshes next time the user comes back.
   */
  useRequestIndexing = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<
      ApiResponse<"/gsc/indexing/request", "post">,
      { blogId?: string; pageUrl?: string }
    >(({ blogId, pageUrl }) => this.api.requestIndexing({ blogId, pageUrl }), {
      ...options,
      onSuccess: (_data, variables) => {
        toast.success("Indexing requested", {
          description: "Google decides when to crawl — this usually takes a few days.",
        })
        this.queryClient.invalidateQueries({
          queryKey: [...this.baseKey, `indexingStatus-${variables?.pageUrl}`],
          refetchType: "none",
        })
        // The posting's indexing counters were bumped server-side.
        this.queryClient.invalidateQueries({ queryKey: ["blogPostings"] })
        options?.onSuccess?.()
      },
      onError: (error) => {
        toast.error(error.message || "Failed to request indexing")
        options?.onError?.(error)
      },
    })
}

export const gscQuery = new GscQuery() as GscQuery
