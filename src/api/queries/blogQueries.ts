import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  restoreBlogById,
  deleteAllBlogs,
  archiveBlogById,
  retryBlogById,
  getGeneratedTitles,
  getBlogStatus,
  getBlogs,
  getBlogStatsById,
  toggleBlogVisibility,
  analyzeBlogPerformance,
  getBlogInsight,
  applyBlogInsight,
  confirmBlogInsight,
} from "@api/blogApi"
import { toast } from "sonner"

// ----------------------- Queries -----------------------

export const useBlogsQuery = (params: Record<string, unknown>) => {
  return useQuery({ queryKey: ["blogs", params], queryFn: () => getAllBlogs(params) })
}

export const useAllBlogsQuery = () => {
  return useQuery({ queryKey: ["allBlogs"], queryFn: () => getBlogs() })
}

export const useBlogDetailsQuery = (id: string) => {
  return useQuery({ queryKey: ["blog", id], queryFn: () => getBlogById(id), enabled: !!id })
}

export const useBlogStatsQuery = (id: string) => {
  return useQuery({
    queryKey: ["blogStats", id],
    queryFn: () => getBlogStatsById(id),
    enabled: !!id,
  })
}

export const useBlogStatusQuery = (params: Record<string, unknown>) => {
  return useQuery({ queryKey: ["blogStatus", params], queryFn: () => getBlogStatus(params) })
}

export const useGeneratedTitlesQuery = (payload: unknown) => {
  return useQuery({
    queryKey: ["generatedTitles", payload],
    queryFn: () => getGeneratedTitles(payload),
    enabled: !!payload,
  })
}

// ----------------------- Mutations -----------------------

export const useCreateBlogMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
    },
  })
}

export const useRestoreBlogMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: restoreBlogById,
    onSuccess: () => {
      toast.success("Blog restored successfully")
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"] })
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to restore blog")
    },
  })
}

export const useDeleteAllBlogsMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAllBlogs,
    onSuccess: (result) => {
      toast.success(`${result.deletedCount} blogs deleted`)
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete all blogs")
    },
  })
}

export const useArchiveBlogMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: archiveBlogById,
    onSuccess: () => {
      toast.success("Blog deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete blog")
    },
  })
}

export const useRetryBlogMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: unknown }) =>
      retryBlogById(id, payload),
    onSuccess: (result) => {
      toast.success(result?.message || "Blog regenerated successfully")
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to retry blog")
    },
  })
}

export const useUpdateBlogMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateBlog(id, data),
    onSuccess: (_data, variables) => {
      toast.success("Blog updated successfully")
      queryClient.invalidateQueries({ queryKey: ["blog", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update blog")
    },
  })
}

export const useToggleBlogVisibilityMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      toggleBlogVisibility(id, isPublic),
    onSuccess: (_data, variables) => {
      toast.success(variables.isPublic ? "Blog is now public" : "Blog is now private")
      queryClient.invalidateQueries({ queryKey: ["blog", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update visibility")
    },
  })
}

/**
 * Run the AI performance review for a posted blog. Costs credits, so it is a
 * mutation rather than a query — never fired automatically on mount.
 */
export const useAnalyzeBlogMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => analyzeBlogPerformance(id),
    onSuccess: () => {
      // The analysis spends credits, so the header balance is now stale.
      queryClient.invalidateQueries({ queryKey: ["user"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to analyze blog performance")
    },
  })
}

/**
 * Fetch the most recently generated insight for a blog, so the editor can
 * restore a previous analysis on reload instead of showing an empty state.
 * Uses the same ["blogInsight", id] key the editor's local cache-restore
 * effect and handleAnalyzeInsights/useConfirmInsightMutation write to, so a
 * fresh analyze/confirm overwrites this query's cached data directly.
 */
export const useBlogInsightQuery = (blogId: string) => {
  return useQuery({
    queryKey: ["blogInsight", blogId],
    queryFn: () => getBlogInsight(blogId),
    enabled: !!blogId,
    staleTime: Infinity,
  })
}

/**
 * Generate the rewrite for an insight suggestion, for review. Spends credits
 * (the AI compute already ran) but does not touch the blog's saved content —
 * only useConfirmInsightMutation does that, once the user accepts the diff.
 */
export const useApplyInsightMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      suggestionId,
      scope,
    }: { id: string; suggestionId: string; scope?: string }) =>
      applyBlogInsight(id, { suggestionId, scope }),
    onSuccess: () => {
      // The generation spends credits, so the header balance is now stale.
      queryClient.invalidateQueries({ queryKey: ["user"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate suggestion rewrite")
    },
  })
}

/**
 * Commit a rewrite the user reviewed and accepted. Rewrites blog content
 * server-side, so both the blog caches and the credit balance (in case a
 * republish ran) need refreshing on success.
 */
export const useConfirmInsightMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      suggestionId,
      content,
      republish,
    }: { id: string; suggestionId: string; content?: string; republish?: boolean }) =>
      confirmBlogInsight(id, { suggestionId, content, republish }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blog", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
      queryClient.invalidateQueries({ queryKey: ["user"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to apply suggestion")
    },
  })
}
