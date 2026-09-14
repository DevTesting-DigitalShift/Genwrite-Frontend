// src/api/Blog/Blog.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import { BlogAPI, type BlogFormData } from "./Blog.api"
import { toast } from "sonner"
import type { CampaignBlogRef } from "@/types/campaign"
import type { ApiRequestBody, ApiResponse } from "@/types/apiHelpers"

// Every type below is ApiResponse<Path, Method> / ApiRequestBody<Path, Method> — pulled
// directly off apiSchema.d.ts by the same path+method BlogAPI itself calls, never redeclared
// or hand-cast. This keeps the type tied to the real endpoint contract instead of to
// whatever a particular function happens to currently return.
export type Blog = ApiResponse<"/blogs/{id}", "get">
type BlogsListResponse = ApiResponse<"/blogs", "get">
type BlogSummary = ApiResponse<"/blogs/all", "get">[number]
type BlogPosting = ApiResponse<"/blogs/postings", "get">["postings"][number]

class BlogsQuery extends QueryBase<Blog> {
  baseKey = ["blogs"]
  api = BlogAPI

  /** GET /blogs is paginated — returns the full envelope, not a bare array (matches
   * BlogsPage/Dashboard/MyProjects's real usage of `.data`/`.page`/`.totalPages`/etc). */
  useList = (params?: Record<string, unknown>, options?: AnyUseQueryOptions<BlogsListResponse>) =>
    this.useParamQuery<BlogsListResponse>("list", (p) => this.api.list(p), params, options)

  useDetail = (id: string, options?: AnyUseQueryOptions<Blog>) =>
    this.useFetchQuery<Blog>(`detail-${id}`, () => this.api.get(id), { enabled: !!id, ...options })

  useCreate = (options?: { onSuccess?: (data: Blog) => void; onError?: (err: Error) => void }) =>
    this.useMutate<Blog, BlogFormData>((payload) => this.api.create(payload), {
      ...options,
      onSuccess: (data) => {
        this.invalidate("list")
        options?.onSuccess?.(data)
      },
    })

  useUpdate = (options?: { onSuccess?: (data: Blog) => void; onError?: (err: Error) => void }) =>
    this.useMutate<Blog, { id: string; data: ApiRequestBody<"/blogs/update/{id}", "put"> }>(
      ({ id, data }) => this.api.update(id, data),
      {
        ...options,
        onSuccess: (updated) => {
          this.queryClient.setQueryData<Blog>([...this.baseKey, `detail-${updated._id}`], updated)
          this.invalidate("list")
          options?.onSuccess?.(updated)
        },
      }
    )

  useDelete = (options?: { onSuccess?: (id: string) => void; onError?: (err: Error) => void }) =>
    this.useMutate<void, string>((id) => this.api.delete(id), {
      ...options,
      onSuccess: (_, id) => {
        this.queryClient.removeQueries({ queryKey: [...this.baseKey, `detail-${id}`] })
        this.invalidate("list")
        options?.onSuccess?.(id)
      },
    })

  useAllBlogs = (options?: AnyUseQueryOptions<BlogSummary[]>) =>
    this.useFetchQuery<BlogSummary[]>("allBlogs", () => BlogAPI.getAll(), options)

  /**
   * The blogs that are actually live somewhere, one entry per blog rather than one per
   * posting — a blog published to two platforms comes back from /blogs/postings twice.
   * Anything that reads Search Console performance (campaigns, most of all) can only
   * work with these, since an unpublished blog has no URL for GSC to report on.
   */
  usePostedBlogs = (enabled = true, options?: AnyUseQueryOptions<CampaignBlogRef[]>) =>
    this.useFetchQuery<CampaignBlogRef[]>(
      "postedBlogs",
      async () => {
        const postings = (await BlogAPI.getAllPostings()) as BlogPosting[]
        const byBlogId = new Map<string, CampaignBlogRef>()
        for (const posting of postings ?? []) {
          // `blogId` is populated server-side, but falls back to a bare id string if
          // the blog was deleted after it was posted — skip those, they can't be shown.
          const blog = posting?.blogId
          if (!blog || typeof blog !== "object" || !blog._id) continue
          const existing = byBlogId.get(blog._id)
          if (existing) {
            if (posting.integrationType && !existing.platforms?.includes(posting.integrationType)) {
              existing.platforms = [...(existing.platforms ?? []), posting.integrationType]
            }
            continue
          }
          byBlogId.set(blog._id, {
            _id: blog._id,
            title: blog.title || "Untitled blog",
            postedOn: posting.postedOn ?? undefined,
            platforms: [posting.integrationType].filter((p): p is NonNullable<typeof p> => !!p),
          })
        }
        return [...byBlogId.values()]
      },
      { enabled, ...options }
    )

  useStats = (id: string, options?: AnyUseQueryOptions<ApiResponse<"/blogs/{id}/stats", "get">>) =>
    this.useFetchQuery(`stats-${id}`, () => BlogAPI.getStats(id), { enabled: !!id, ...options })

  useStatus = (
    params: ApiRequestBody<"/blogs/status", "get">,
    options?: AnyUseQueryOptions<ApiResponse<"/blogs/status", "get">>
  ) => this.useParamQuery("status", (p) => BlogAPI.getStatus(p), params, options)

  useGeneratedTitles = (
    payload: ApiRequestBody<"/generate/title", "post">,
    options?: AnyUseQueryOptions<ApiResponse<"/generate/title", "post">>
  ) =>
    this.useParamQuery("generatedTitles", (p) => BlogAPI.getGeneratedTitles(p), payload, {
      enabled: !!payload,
      ...options,
    })

  useRestore = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<ApiResponse<"/blogs/restore/{id}", "patch">, string>(
      (id) => BlogAPI.restore(id),
      {
        ...options,
        onSuccess: () => {
          toast.success("Blog restored successfully")
          this.invalidate("trashedBlogs")
          this.invalidate("list")
          options?.onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message || "Failed to restore blog")
          options?.onError?.(error)
        },
      }
    )

  useDeleteAll = (options?: {
    onSuccess?: (result: ApiResponse<"/blogs", "delete">) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<ApiResponse<"/blogs", "delete">, void>(() => BlogAPI.deleteAll(), {
      ...options,
      onSuccess: (result) => {
        toast.success(`${result?.deletedCount} blogs deleted`)
        this.invalidate("trashedBlogs")
        options?.onSuccess?.(result)
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete all blogs")
        options?.onError?.(error)
      },
    })

  useArchive = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<ApiResponse<"/blogs/archive/{id}", "patch">, string>(
      (id) => BlogAPI.archive(id),
      {
        ...options,
        onSuccess: () => {
          toast.success("Blog deleted successfully")
          this.invalidate("list")
          this.invalidate("trashedBlogs")
          options?.onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete blog")
          options?.onError?.(error)
        },
      }
    )

  useRetry = (options?: {
    onSuccess?: (result: ApiResponse<"/blogs/{id}/retry", "post">) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<
      ApiResponse<"/blogs/{id}/retry", "post">,
      { id: string; payload?: ApiRequestBody<"/blogs/{id}/retry", "post"> }
    >(({ id, payload }) => BlogAPI.retry(id, payload), {
      ...options,
      onSuccess: (result) => {
        toast.success(result?.message || "Blog regenerated successfully")
        this.invalidate("list")
        options?.onSuccess?.(result)
      },
      onError: (error) => {
        toast.error(error.message || "Failed to retry blog")
        options?.onError?.(error)
      },
    })

  useToggleVisibility = (options?: {
    onSuccess?: (isPublic: boolean) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<
      ApiResponse<"/blogs/{id}/visibility", "patch">,
      { id: string; isPublic: boolean }
    >(({ id, isPublic }) => BlogAPI.toggleVisibility(id, isPublic), {
      onSuccess: (_data, variables) => {
        toast.success(variables.isPublic ? "Blog is now public" : "Blog is now private")
        this.invalidate(`detail-${variables.id}`)
        this.invalidate("list")
        options?.onSuccess?.(variables.isPublic)
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update visibility")
        options?.onError?.(error)
      },
    })

  /**
   * Run the AI performance review for a posted blog. Costs credits, so it is a
   * mutation rather than a query — never fired automatically on mount.
   */
  useAnalyze = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<ApiResponse<"/blogs/{id}/analyze", "post">, string>(
      (id) => BlogAPI.analyzePerformance(id),
      {
        onSuccess: () => {
          // The analysis spends credits, so the header balance is now stale.
          this.queryClient.invalidateQueries({ queryKey: ["user"] })
          options?.onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message || "Failed to analyze blog performance")
          options?.onError?.(error)
        },
      }
    )

  /**
   * Fetch the most recently generated insight for a blog, so the editor can
   * restore a previous analysis on reload instead of showing an empty state.
   * Uses the same ["blogs", "insight-<id>"] key the editor's local cache-restore
   * effect and handleAnalyzeInsights/useConfirmInsight write to, so a fresh
   * analyze/confirm overwrites this query's cached data directly.
   */
  useInsight = (
    blogId: string,
    options?: AnyUseQueryOptions<ApiResponse<"/blogs/{id}/insight", "get">>
  ) =>
    this.useFetchQuery(`insight-${blogId}`, () => BlogAPI.getInsight(blogId), {
      enabled: !!blogId,
      staleTime: Infinity,
      ...options,
    })

  /**
   * Generate the rewrite for an insight suggestion, for review. Spends credits
   * (the AI compute already ran) but does not touch the blog's saved content —
   * only useConfirmInsight does that, once the user accepts the diff.
   */
  useApplyInsight = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<
      ApiResponse<"/blogs/{id}/apply-insight", "post">,
      { id: string; suggestionId: string; scope?: string }
    >(({ id, suggestionId, scope }) => BlogAPI.applyInsight(id, { suggestionId, scope }), {
      onSuccess: () => {
        // The generation spends credits, so the header balance is now stale.
        this.queryClient.invalidateQueries({ queryKey: ["user"] })
        options?.onSuccess?.()
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate suggestion rewrite")
        options?.onError?.(error)
      },
    })

  /**
   * Commit a rewrite the user reviewed and accepted. Rewrites blog content
   * server-side, so both the blog caches and the credit balance (in case a
   * republish ran) need refreshing on success.
   */
  useConfirmInsight = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<
      ApiResponse<"/blogs/{id}/confirm-insight", "post">,
      { id: string; suggestionId: string; content?: string; republish?: boolean }
    >(
      ({ id, suggestionId, content, republish }) =>
        BlogAPI.confirmInsight(id, { suggestionId, content, republish }),
      {
        onSuccess: (_data, variables) => {
          this.invalidate(`detail-${variables.id}`)
          this.invalidate("list")
          this.queryClient.invalidateQueries({ queryKey: ["user"] })
          options?.onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message || "Failed to apply suggestion")
          options?.onError?.(error)
        },
      }
    )
}

export const blogsQuery = new BlogsQuery() as BlogsQuery
