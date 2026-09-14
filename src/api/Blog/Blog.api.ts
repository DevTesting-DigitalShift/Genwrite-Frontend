// src/api/Blog/Blog.api.ts
/** An upload entry as produced by the file picker before it is turned into a File. */
interface UploadFile {
  originFileObj: BlobPart
  name: string
  type: string
}

/** Blog creation payload; blogImages is split out and sent as multipart. */
export interface BlogFormData extends Record<string, unknown> {
  blogImages?: UploadFile[]
}

import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  ApiRequestError,
  rethrow,
  toApiRequestError,
} from "@api/typedClient"
import axiosInstance from "@api/index"

/**
 * Same idea as `rethrow`, but for the create-blog endpoints: a 402 means the backend's
 * `authMiddleware` rejected the request for insufficient credits, with the amount needed
 * in `.details.neededCredits` (see GenWrite-Backend auth.middleware.js). Rethrows the real
 * ApiRequestError either way (never a separate CreditError type) — callers branch on
 * `err.status === 402` and read `err.details?.neededCredits` directly.
 */
const rethrowWithCreditCheck = (err: unknown, fallback: string): never => {
  if (err instanceof ApiRequestError && err.status === 402) {
    const neededCredits = (err.details as { neededCredits?: number } | undefined)?.neededCredits
    err.message = neededCredits
      ? `Insufficient credits. You need ${neededCredits} credits to create this blog.`
      : err.message || "Insufficient credits to create blog"
    throw err
  }
  return rethrow(err, fallback)
}

export const BlogAPI = {
  list: async (params: Record<string, unknown> = {}) => {
    try {
      return await apiGet("/blogs", { query: params as never })
    } catch (err) {
      return rethrow(err, "Failed to fetch blogs")
    }
  },

  get: async (id: string) => {
    try {
      return await apiGet("/blogs/{id}", { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to fetch blog")
    }
  },

  createQuickBlog: async (blogData: unknown, type?: string) => {
    try {
      const path = type === "yt" ? ("/blogs/yt" as const) : ("/blogs/quick" as const)
      const result = await apiPost(path, blogData as never)
      return result.blog
    } catch (err) {
      return rethrowWithCreditCheck(err, "Failed to create blog")
    }
  },

  createTopicOnlyBlog: async ({ topic }: { topic: string }) => {
    try {
      const result = await apiPost("/blogs/topic", { topic })
      return result.blog || result
    } catch (err) {
      return rethrowWithCreditCheck(err, "Failed to create blog")
    }
  },

  create: async (blogData: BlogFormData) => {
    try {
      const formData = new FormData()
      const { blogImages, ...restData } = blogData

      // Filter out null/undefined
      const finalData = Object.fromEntries(
        Object.entries(restData).filter(([_, v]) => v !== null && v !== undefined)
      )
      // Append normal data
      formData.append("data", JSON.stringify(finalData))

      // Append images (binary form)
      if (blogImages && blogImages.length > 0) {
        blogImages.forEach((blogfile: UploadFile) => {
          const file = new File([blogfile.originFileObj], blogfile.name, { type: blogfile.type })
          formData.append("blogImages", file, file.name) // directly append file object
        })
      }

      // Multipart upload — not expressible as an OpenAPI JSON requestBody, so this one
      // stays on plain axios rather than the typed client.
      const response = await axiosInstance.postForm("/blogs", formData)

      return response.data.blog || response.data
    } catch (rawError) {
      return rethrowWithCreditCheck(
        toApiRequestError(rawError, "Failed to create blog"),
        "Failed to create blog"
      )
    }
  },

  createMultiple: async (blogData: BlogFormData) => {
    try {
      const result = await apiPost("/blogs/xyz", blogData as never)
      return result.bulkBlogs
    } catch (err) {
      return rethrowWithCreditCheck(err, "Failed to create blog")
    }
  },

  update: async (id: string, updatedData: unknown) => {
    try {
      return await apiPut("/blogs/update/{id}", updatedData as never, { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to update blog")
    }
  },

  delete: async (id: string) => {
    try {
      await apiDelete("/blogs/{id}", { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to delete blog")
    }
  },

  getByAuthor: async () => {
    try {
      return await apiGet("/blogs")
    } catch (err) {
      return rethrow(err, "Failed to fetch blogs")
    }
  },

  sendRetryLines: async (id: string, payload?: unknown) => {
    try {
      return await apiPost("/blogs/{id}/rewrite", payload as never, { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to retry")
    }
  },

  deleteAll: async () => {
    try {
      return await apiDelete("/blogs")
    } catch (err) {
      return rethrow(err, "Failed to delete blogs")
    }
  },

  restore: async (id: string) => {
    try {
      return await apiPatch("/blogs/restore/{id}", undefined, { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to restore blog")
    }
  },

  restoreAll: async () => {
    try {
      return await apiPatch("/blogs/restore")
    } catch (err) {
      return rethrow(err, "Failed to restore blogs")
    }
  },

  archive: async (id: string) => {
    try {
      return await apiPatch("/blogs/archive/{id}", undefined, { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to archive blog")
    }
  },

  retry: async (id: string, payload: unknown = { createNew: false }) => {
    try {
      return await apiPost("/blogs/{id}/retry", payload as never, { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to retry blog")
    }
  },

  proofread: async ({ id }: { id: string }) => {
    try {
      return await apiPost("/blogs/{id}/proofread", undefined, { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to get proofreading suggestions")
    }
  },

  getStats: (id: string) => apiGet("/blogs/{id}/stats", { params: { id } }),

  getGeneratedTitles: (data: unknown) => apiPost("/generate/title", data as never),

  createSimple: async (data: unknown) => {
    try {
      return await apiPost("/blogs/new", data as never)
    } catch (err) {
      return rethrow(err, "Failed to create blog")
    }
  },

  getStatus: async (params: Record<string, unknown> = {}) => {
    try {
      return await apiGet("/blogs/status", { query: params as never })
    } catch (err) {
      return rethrow(err, "Failed to fetch blog status")
    }
  },

  getAll: async () => {
    try {
      return await apiGet("/blogs/all")
    } catch (err) {
      return rethrow(err, "Failed to fetch blogs")
    }
  },

  /**
   * Get every posting the user has made, across all blogs and platforms. Each entry
   * carries its blog populated as `{ _id, title, status }`, which makes this the only
   * list endpoint that can answer "which blogs are actually published?" — /blogs/all
   * returns ids and titles with no posting information at all.
   */
  getAllPostings: async (params: Record<string, unknown> = {}) => {
    try {
      const result = await apiGet("/blogs/postings", { query: params as never })
      return result.postings || []
    } catch (err) {
      return rethrow(err, "Failed to fetch blog postings")
    }
  },

  getPrompt: async (id: string, prompt: string) => {
    try {
      return await apiPost("/blogs/{id}/prompt", { prompt }, { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to fetch blog prompt")
    }
  },

  /** Get blog postings for a specific blog. */
  getPostings: async (blogId: string) => {
    try {
      const result = await apiGet("/blogs/postings/{id}", { params: { id: blogId } })
      return result.postings || []
    } catch (err) {
      return rethrow(err, "Failed to fetch blog postings")
    }
  },

  // Returns a raw file blob, not a JSON body documented in the OpenAPI spec, so this one
  // stays on plain axios rather than the typed client.
  export: async (
    id: string,
    { type = "pdf", withImages = false }: { type?: string; withImages?: boolean } = {}
  ) => {
    try {
      const response = await axiosInstance.get(`/blogs/${id}/export`, {
        params: { type, withImages: withImages ? "true" : "false" },
        responseType: "blob",
      })

      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers["content-disposition"]
      let filename = `blog.${type}`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      return { data: response.data, filename }
    } catch (rawError) {
      return rethrow(
        toApiRequestError(rawError, "Export failed"),
        `Failed to export ${type.toUpperCase()}`
      )
    }
  },

  exportAsPdf: async function (this: void, id: string) {
    const result = await BlogAPI.export(id, { type: "pdf", withImages: false })
    return result.data
  },

  toggleVisibility: async (id: string, isPublic: unknown) => {
    try {
      return await apiPatch("/blogs/{id}/visibility", { isPublic } as never, { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to toggle blog visibility")
    }
  },

  getPublicly: async (id: string) => {
    try {
      return await apiGet("/public/blog/{blogId}", { params: { blogId: id } })
    } catch (err) {
      return rethrow(err, "Public blog not found")
    }
  },

  /**
   * Run an AI performance review of a posted blog using its Search Console data.
   * Backend requires the blog to already be published somewhere.
   */
  analyzePerformance: async (id: string) => {
    try {
      return await apiPost("/blogs/{id}/analyze", undefined, { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to analyze blog performance")
    }
  },

  /**
   * Fetch the most recently generated insight for a blog, if one exists — lets the
   * editor restore a previous analysis on reload instead of re-running it.
   */
  getInsight: async (id: string) => {
    try {
      return await apiGet("/blogs/{id}/insight", { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to fetch blog insight")
    }
  },

  /**
   * Generate the rewrite for an insight suggestion (target section or the whole
   * blog) for review. Nothing is persisted yet — the blog's saved content and the
   * suggestion's status are untouched until confirmInsight is called.
   */
  applyInsight: async (
    id: string,
    { suggestionId, scope = "section" }: { suggestionId: string; scope?: string }
  ) => {
    try {
      return await apiPost("/blogs/{id}/apply-insight", { suggestionId, scope } as never, {
        params: { id },
      })
    } catch (err) {
      return rethrow(err, "Failed to generate suggestion rewrite")
    }
  },

  /**
   * Commit a rewrite the user reviewed and accepted: persists it as the blog's
   * content, marks the suggestion applied, and reposts if requested.
   */
  confirmInsight: async (
    id: string,
    {
      suggestionId,
      content,
      republish = false,
    }: { suggestionId: string; content?: string; republish?: boolean }
  ) => {
    try {
      return await apiPost(
        "/blogs/{id}/confirm-insight",
        { suggestionId, content, republish } as never,
        { params: { id } }
      )
    } catch (err) {
      return rethrow(err, "Failed to apply suggestion")
    }
  },
}
