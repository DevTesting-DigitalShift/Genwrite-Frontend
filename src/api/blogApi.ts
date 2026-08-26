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

import { asApiError, creditError } from "@/types/api"
import axiosInstance from "."

export const createQuickBlog = async (blogData: unknown, type?: string) => {
  try {
    const endpoint = type === "yt" ? "/blogs/yt" : "/blogs/quick"
    const response = await axiosInstance.post(endpoint, blogData)
    return response.data.blog
  } catch (rawError) {
    const error = asApiError(rawError)
    console.error("Blog creation API error:", error)

    // Handle 402 Insufficient Credits error
    if (error.response?.status === 402) {
      const neededCredits = error.response?.data?.neededCredits as number | undefined
      const errorMsg = neededCredits
        ? `Insufficient credits. You need ${neededCredits} credits to create this blog.`
        : error.response?.data?.message || "Insufficient credits to create blog"
      throw creditError(errorMsg, neededCredits)
    }

    const msg = error.response?.data?.message || "Failed to create blog"
    throw new Error(msg)
  }
}

export const createTopicOnlyBlog = async ({ topic }: { topic: string }) => {
  try {
    const response = await axiosInstance.post("/blogs/topic", { topic })
    return response.data.blog || response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    console.error("createTopicOnlyBlog error", error.response?.data || error)

    // Handle 402 Insufficient Credits error
    if (error.response?.status === 402) {
      const neededCredits = error.response?.data?.neededCredits as number | undefined
      const errorMsg = neededCredits
        ? `Insufficient credits. You need ${neededCredits} credits to create this blog.`
        : error.response?.data?.message || "Insufficient credits to create blog"
      throw creditError(errorMsg, neededCredits)
    }

    throw new Error(error.response?.data?.message || "Failed to create blog")
  }
}

export const createBlog = async (blogData: BlogFormData) => {
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

    // Send request
    const response = await axiosInstance.postForm("/blogs", formData)

    return response.data.blog || response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    console.error("createBlog error", error.response?.data || error)

    // Handle 402 Insufficient Credits error
    if (error.response?.status === 402) {
      const neededCredits = error.response?.data?.neededCredits as number | undefined
      const errorMsg = neededCredits
        ? `Insufficient credits. You need ${neededCredits} credits to create this blog.`
        : error.response?.data?.message || "Insufficient credits to create blog"
      throw creditError(errorMsg, neededCredits)
    }

    throw new Error(error.response?.data?.message || "Failed to create blog")
  }
}

export const createBlogMultiple = async (blogData: BlogFormData) => {
  try {
    const response = await axiosInstance.post("/blogs/xyz", blogData)
    return response.data.insertedBlogs
  } catch (rawError) {
    const error = asApiError(rawError)
    console.error("createBlogMultiple", error)

    // Handle 402 Insufficient Credits error
    if (error.response?.status === 402) {
      const neededCredits = error.response?.data?.neededCredits as number | undefined
      const errorMsg = neededCredits
        ? `Insufficient credits. You need ${neededCredits} credits to create these blogs.`
        : error.response?.data?.message || "Insufficient credits to create blogs"
      throw creditError(errorMsg, neededCredits)
    }

    throw new Error(error.response?.data?.message || "Failed to create blog")
  }
}

export const getAllBlogs = async (params: Record<string, unknown> = {}) => {
  try {
    const response = await axiosInstance.get("/blogs", { params })
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to fetch blogs")
  }
}

export const getBlogById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/blogs/${id}`)
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to fetch blog")
  }
}

export const updateBlog = async (id: string, updatedData: unknown) => {
  try {
    const response = await axiosInstance.put(`/blogs/update/${id}`, updatedData)
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to update blog")
  }
}

export const deleteBlog = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/blogs/${id}`)
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to delete blog")
  }
}

export const getBlogsByAuthor = async () => {
  try {
    const response = await axiosInstance.get(`/blogs`)
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to fetch blogs")
  }
}

export const sendBrand = async (formData: unknown) => {
  try {
    const _response = await axiosInstance.post("/brand/addBrand", formData)
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to create blog")
  }
}

export const sendRetryLines = async (id: string, payload: unknown) => {
  try {
    const response = await axiosInstance.post(`/blogs/${id}/rewrite`, payload)
    return response
  } catch (rawError) {
    const error = asApiError(rawError)
    console.error(error)
    throw new Error(error.response?.data?.message || error.message || "Failed to retry")
  }
}

export const deleteAllBlogs = async () => {
  try {
    const response = await axiosInstance.delete("/blogs")
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to delete blogs")
  }
}

export const restoreBlogById = async (id: string) => {
  try {
    const response = await axiosInstance.patch(`/blogs/restore/${id}`)
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to restore blog")
  }
}

export const restoreAllBlogs = async () => {
  try {
    const response = await axiosInstance.patch("/blogs/restore")
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to restore blogs")
  }
}

export const archiveBlogById = async (id: string) => {
  try {
    const response = await axiosInstance.patch(`/blogs/archive/${id}`)
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to archive blog")
  }
}

export const retryBlogById = async (id: string, payload: unknown = { createNew: false }) => {
  try {
    const response = await axiosInstance.post(`/blogs/${id}/retry`, payload)
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to retry blog")
  }
}

export const proofreadBlogContent = async ({ id }: { id: string }) => {
  try {
    const response = await axiosInstance.post(`/blogs/${id}/proofread`)
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to get proofreading suggestions")
  }
}

export const getBlogStatsById = async (id: string) => {
  const response = await axiosInstance.get(`/blogs/${id}/stats`)
  return response.data
}

export const getGeneratedTitles = async (data: unknown) => {
  const response = await axiosInstance.post(`/generate/title`, data)
  return response.data
}

export const createSimpleBlog = async (data: unknown) => {
  try {
    const response = await axiosInstance.post("/blogs/new", data)
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to create blog")
  }
}

export const getBlogStatus = async (params: Record<string, unknown> = {}) => {
  try {
    const response = await axiosInstance.get("/blogs/status", { params })
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to fetch blog status")
  }
}

export const getBlogs = async () => {
  try {
    const response = await axiosInstance.get("/blogs/all")
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch blogs")
  }
}

export const getBlogPrompt = async (id: string, prompt: string) => {
  try {
    const response = await axiosInstance.post(`/blogs/${id}/prompt`, { prompt })
    return response
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to fetch blog prompt")
  }
}

/**
 * Get blog postings for a specific blog
 * @param {string} blogId - The blog ID
 * @returns {Promise<Array>} Array of posting objects
 */
export const getBlogPostings = async (blogId: string) => {
  try {
    const response = await axiosInstance.get(`/blogs/postings/${blogId}`)
    return response.data.postings || []
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to fetch blog postings")
  }
}

export const exportBlog = async (
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
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || `Failed to export ${type.toUpperCase()}`)
  }
}

// Legacy function for backward compatibility
export const exportBlogAsPdf = async (id: string) => {
  const result = await exportBlog(id, { type: "pdf", withImages: false })
  return result.data
}

export const toggleBlogVisibility = async (id: string, isPublic: unknown) => {
  try {
    const response = await axiosInstance.patch(`/blogs/${id}/visibility`, { isPublic })
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to toggle blog visibility")
  }
}

export const getBlogPublicly = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/public/blog/${id}`)
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Public blog not found")
  }
}

/**
 * Run an AI performance review of a posted blog using its Search Console data.
 * Backend requires the blog to already be published somewhere.
 * @param {string} id - Blog ID
 * @returns {Promise<Object>} BlogInsight document (metricsSnapshot, overallSummary, suggestions)
 */
export const analyzeBlogPerformance = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/blogs/${id}/analyze`)
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to analyze blog performance")
  }
}

/**
 * Fetch the most recently generated insight for a blog, if one exists — lets the
 * editor restore a previous analysis on reload instead of re-running it.
 * @param {string} id - Blog ID
 * @returns {Promise<Object|null>} BlogInsight document, or null if never analyzed
 */
export const getBlogInsight = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/blogs/${id}/insight`)
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to fetch blog insight")
  }
}

/**
 * Generate the rewrite for an insight suggestion (target section or the whole
 * blog) for review. Nothing is persisted yet — the blog's saved content and the
 * suggestion's status are untouched until confirmBlogInsight is called.
 * @param {string} id - Blog ID
 * @param {Object} payload
 * @param {string} payload.suggestionId - Suggestion _id from the insight document
 * @param {"section"|"whole"} [payload.scope="section"] - Rewrite scope
 * @returns {Promise<{content: string, suggestionId: string, scope: string}>}
 */
export const applyBlogInsight = async (
  id: string,
  { suggestionId, scope = "section" }: { suggestionId: string; scope?: string }
) => {
  try {
    const response = await axiosInstance.post(`/blogs/${id}/apply-insight`, {
      suggestionId,
      scope,
    })
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to generate suggestion rewrite")
  }
}

/**
 * Commit a rewrite the user reviewed and accepted: persists it as the blog's
 * content, marks the suggestion applied, and reposts if requested.
 * @param {string} id - Blog ID
 * @param {Object} payload
 * @param {string} payload.suggestionId - Suggestion _id from the insight document
 * @param {string} payload.content - The reviewed content, as returned by applyBlogInsight
 * @param {boolean} [payload.republish=false] - Repost to connected platforms after applying
 * @returns {Promise<{content: string, repost: Object|null}>}
 */
export const confirmBlogInsight = async (
  id: string,
  {
    suggestionId,
    content,
    republish = false,
  }: { suggestionId: string; content?: string; republish?: boolean }
) => {
  try {
    const response = await axiosInstance.post(`/blogs/${id}/confirm-insight`, {
      suggestionId,
      content,
      republish,
    })
    return response.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || "Failed to apply suggestion")
  }
}
