import { objectToFormData } from "@utils/usableFunctions"
import axiosInstance from "."
import { message } from "antd"

export const createQuickBlog = async (blogData, type) => {
  try {
    const endpoint = type === "yt" ? "/blogs/yt" : "/blogs/quick"

    const response = await axiosInstance.post(endpoint, blogData)
    return response.data.blog
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to create blog"
    console.error("Blog creation API error:", error)
    throw new Error(msg)
  }
}

export const createBlog = async blogData => {
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
    if (blogImages?.length > 0) {
      blogImages.forEach(blogfile => {
        const file = new File([blogfile.originFileObj], blogfile.name, { type: blogfile.type })
        formData.append("blogImages", file, file.name) // directly append file object
      })
    }

    // Send request
    const response = await axiosInstance.postForm("/blogs", formData)

    return response.data.blog || response.data
  } catch (error) {
    console.error("createBlog error", error.response?.data || error)
    throw new Error(error.response?.data?.message || "Failed to create blog")
  }
}

export const createBlogMultiple = async blogData => {
  try {
    const response = await axiosInstance.post("/blogs/xyz", blogData)
    return response.data.insertedBlogs
  } catch (error) {
    console.error("createBlogMultiple", error)
    throw new Error(error.response?.data?.message || "Failed to create blog")
  }
}

export const getAllBlogs = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/blogs", { params })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch blogs")
  }
}

export const getBlogById = async id => {
  try {
    const response = await axiosInstance.get(`/blogs/${id}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch blog")
  }
}

export const updateBlog = async (id, updatedData) => {
  try {
    const response = await axiosInstance.put(`/blogs/update/${id}`, updatedData)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update blog")
  }
}

export const deleteBlog = async id => {
  try {
    const response = await axiosInstance.delete(`/blogs/${id}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to delete blog")
  }
}

export const getBlogsByAuthor = async () => {
  try {
    const response = await axiosInstance.get(`/blogs`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch blogs")
  }
}

export const sendBrand = async formData => {
  try {
    const response = await axiosInstance.post("/brand/addBrand", formData)
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to create blog")
  }
}

export const sendRetryLines = async (id, payload) => {
  try {
    const response = await axiosInstance.post(`/blogs/${id}/rewrite`, payload)
    return response
  } catch (error) {
    console.error(error)
    throw new Error(error || "Failed to retry")
  }
}

export const deleteAllBlogs = async () => {
  try {
    const response = await axiosInstance.delete("/blogs")
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to delete blogs")
  }
}

export const restoreBlogById = async id => {
  try {
    const response = await axiosInstance.patch(`/blogs/restore/${id}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to restore blog")
  }
}

export const archiveBlogById = async id => {
  try {
    const response = await axiosInstance.patch(`/blogs/archive/${id}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to archive blog")
  }
}

export const retryBlogById = async (id, payload = { createNew: false }) => {
  try {
    const response = await axiosInstance.post(`/blogs/${id}/retry`, payload)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to retry blog")
  }
}

export const proofreadBlogContent = async ({ id }) => {
  try {
    const response = await axiosInstance.post(`/blogs/${id}/proofread`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to get proofreading suggestions")
  }
}

export const getBlogStatsById = async id => {
  const response = await axiosInstance.get(`/blogs/${id}/stats`)
  return response.data
}

export const getGeneratedTitles = async data => {
  const response = await axiosInstance.post(`/generate/title`, data)
  return response.data
}

export const createSimpleBlog = async data => {
  try {
    const response = await axiosInstance.post("/blogs/new", data)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to create blog")
  }
}

export const getBlogStatus = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/blogs/status", { params })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch blog status")
  }
}

export const getBlogs = async () => {
  try {
    const response = await axiosInstance.get("/blogs/all")
    return response.data
  } catch (error) {
    throw new Error(error || "Failed to fetch blogs")
  }
}

export const getBlogPrompt = async (id, prompt) => {
  try {
    const response = await axiosInstance.post(`/blogs/${id}/prompt`, { prompt })
    return response
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch blog prompt")
  }
}

/**
 * Get blog postings for a specific blog
 * @param {string} blogId - The blog ID
 * @returns {Promise<Array>} Array of posting objects
 */
export const getBlogPostings = async blogId => {
  try {
    const response = await axiosInstance.get(`/blogs/postings/${blogId}`)
    return response.data.postings || []
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch blog postings")
  }
}

export const getExportedBlog = async (blogId, type = "pdf") => {
  try {
    const response = await axiosInstance.get(`/blogs/${blogId}/export?type=${type}`, {
      responseType: "blob",
      withCredentials: true,
      headers: {
        Accept: "application/pdf",
      },
    })
    // Create blob from response
    const pdfBlob = new Blob([response.data], {
      type: "application/pdf",
    })

    // Extract filename from backend headers
    const disposition = response.headers["content-disposition"]
    let filename = "blog.pdf"

    if (disposition?.includes("filename=")) {
      filename = disposition.split("filename=")[1].replace(/"/g, "")
    }
    return { pdfBlob, filename }
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to export blog")
  }
}
