// src/api/Blog/Blog.query.ts
import { QueryBase, type AnyUseQueryOptions } from "@api/QueryBase"
import { BlogAPI, type BlogFormData } from "./Blog.api"
import { toast } from "sonner"
import type { CampaignBlogRef } from "@/types/campaign"

// Every type below is pulled straight off BlogAPI's own inferred return types (which already
// come from typedClient.ts's per-endpoint generics against apiSchema.d.ts) — never redeclared
// or cast, since BlogAPI's methods are already correctly typed per their real OpenAPI schema.
export type Blog = Awaited<ReturnType<typeof BlogAPI.get>>
type BlogsListResponse = Awaited<ReturnType<typeof BlogAPI.list>>
type BlogSummary = Awaited<ReturnType<typeof BlogAPI.getAll>>[number]
type BlogPosting = Awaited<ReturnType<typeof BlogAPI.getAllPostings>>[number]

class BlogsQuery extends QueryBase<Blog> {
  baseKey = ["blogs"]
  api = BlogAPI

  /** GET /blogs is paginated — returns the full envelope, not a bare array (matches
   * BlogsPage/Dashboard/MyProjects's real usage of `.data`/`.page`/`.totalPages`/etc). */
  useList = (
    params?: Record<string, unknown>,
    options?: AnyUseQueryOptions<BlogsListResponse, Error>
  ) => this.useParamQuery<BlogsListResponse>("list", (p) => this.api.list(p), params, options)

  useDetail = (id: string, options?: AnyUseQueryOptions<Blog, Error>) =>
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
    this.useMutate<Blog, { id: string; data: unknown }>(
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

  useAllBlogs = (options?: AnyUseQueryOptions<BlogSummary[], Error>) =>
    this.useFetchQuery<BlogSummary[]>("allBlogs", () => BlogAPI.getAll(), options)

  /**
   * The blogs that are actually live somewhere, one entry per blog rather than one per
   * posting — a blog published to two platforms comes back from /blogs/postings twice.
   * Anything that reads Search Console performance (campaigns, most of all) can only
   * work with these, since an unpublished blog has no URL for GSC to report on.
   */
  usePostedBlogs = (enabled = true, options?: AnyUseQueryOptions<CampaignBlogRef[], Error>) =>
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
            if (
              posting.integrationType &&
              !existing.platforms?.includes(posting.integrationType)
            ) {
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

  useStats = (id: string, options?: AnyUseQueryOptions<unknown, Error>) =>
    this.useFetchQuery(`stats-${id}`, () => BlogAPI.getStats(id), { enabled: !!id, ...options })

  useStatus = (params: Record<string, unknown>, options?: AnyUseQueryOptions<unknown, Error>) =>
    this.useParamQuery("status", (p) => BlogAPI.getStatus(p), params, options)

  useGeneratedTitles = (payload: unknown, options?: AnyUseQueryOptions<unknown, Error>) =>
    this.useParamQuery("generatedTitles", (p) => BlogAPI.getGeneratedTitles(p), payload, {
      enabled: !!payload,
      ...options,
    })

  useRestore = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<Awaited<ReturnType<typeof BlogAPI.restore>>, string>((id) => BlogAPI.restore(id), {
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
    })

  useDeleteAll = (options?: {
    onSuccess?: (result: { deletedCount?: number }) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<{ deletedCount?: number }, void>(() => BlogAPI.deleteAll(), {
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
    this.useMutate<Awaited<ReturnType<typeof BlogAPI.archive>>, string>((id) => BlogAPI.archive(id), {
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
    })

  useRetry = (options?: {
    onSuccess?: (result: { message?: string }) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<{ message?: string }, { id: string; payload?: unknown }>(
      ({ id, payload }) => BlogAPI.retry(id, payload),
      {
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
      }
    )

  useToggleVisibility = (options?: {
    onSuccess?: (isPublic: boolean) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<
      Awaited<ReturnType<typeof BlogAPI.toggleVisibility>>,
      { id: string; isPublic: boolean }
    >(
      ({ id, isPublic }) => BlogAPI.toggleVisibility(id, isPublic),
      {
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
      }
    )

  /**
   * Run the AI performance review for a posted blog. Costs credits, so it is a
   * mutation rather than a query — never fired automatically on mount.
   */
  useAnalyze = (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
    this.useMutate<Awaited<ReturnType<typeof BlogAPI.analyzePerformance>>, string>(
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
    options?: AnyUseQueryOptions<Awaited<ReturnType<typeof BlogAPI.getInsight>>, Error>
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
      Awaited<ReturnType<typeof BlogAPI.applyInsight>>,
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
      Awaited<ReturnType<typeof BlogAPI.confirmInsight>>,
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
