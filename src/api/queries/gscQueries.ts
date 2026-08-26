import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { inspectIndexing, requestIndexing } from "@api/gscApi"
import { toast } from "sonner"

/**
 * Live indexing status for one published URL.
 *
 * Search Console's URL Inspection API is rate limited (per-site daily quota),
 * so this is cached aggressively and never retried automatically — a failure
 * here is informational, not worth burning quota on.
 *
 * @param {string} [pageUrl] - The published URL to inspect
 * @param {{ enabled?: boolean }} [options]
 */
export const useIndexingStatusQuery = (pageUrl, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ["indexingStatus", pageUrl],
    queryFn: () => inspectIndexing({ pageUrl }),
    enabled: enabled && !!pageUrl,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

/**
 * Ask Google to crawl a published URL.
 *
 * Deliberately does not refetch the inspection right away: Google takes hours
 * to days to act on a request, so an immediate re-check would just spend quota
 * to show the same "not indexed" result. The cached status is marked stale
 * instead, so it refreshes next time the user comes back.
 */
export const useRequestIndexingMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    /** @param {{ blogId?: string, pageUrl?: string }} vars */
    mutationFn: ({ blogId, pageUrl }) => requestIndexing({ blogId, pageUrl }),
    onSuccess: (_data, variables) => {
      toast.success("Indexing requested", {
        description: "Google decides when to crawl — this usually takes a few days.",
      })
      queryClient.invalidateQueries({
        queryKey: ["indexingStatus", variables.pageUrl],
        refetchType: "none",
      })
      // The posting's indexing counters were bumped server-side.
      queryClient.invalidateQueries({ queryKey: ["blogPostings"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to request indexing")
    },
  })
}
