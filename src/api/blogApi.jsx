import { objectToFormData } from "@utils/usableFunctions"
import axiosInstance from "."

// Create a new blog
export const createQuickBlog = async (blogData) => {
  try {
    const response = await axiosInstance.post("/blogs/quick", blogData)
    const blog = response.data.blog
    return blog
  } catch (error) {
    console.error("Quick Blog creation API error:", error)
    throw new Error(error.response?.data?.message || "Failed to create quickBlog")
  }
}

export const createBlog = async (blogData) => {
  try {
    const formData = new FormData()
    const { blogImages, ...restData } = blogData

    // ✅ Build safe defaults
    const rawData = {
      ...restData,
      title: restData.title?.trim(),
      brandId: restData.brandId,
      isCompetitiveResearchEnabled: restData.isCompetitiveResearchEnabled ?? false,
      isCheckedBrand: restData.isCheckedBrand ?? false,
      isCheckedGeneratedImages: restData.isCheckedGeneratedImages ?? false,
      isUnsplashActive: restData.isUnsplashActive ?? false,
      isCheckedQuick: restData.isCheckedQuick ?? false,
      isFAQEnabled: restData.isFAQEnabled ?? false,
      includeInterlinks: restData.includeInterlinks ?? false,
      addOutBoundLinks: restData.addOutBoundLinks ?? false,
      addCTA: restData.addCTA ?? false,
      numberOfImages: restData.numberOfImages ?? 0,
    }

    // ✅ Remove null/undefined keys
    const finalData = Object.fromEntries(
      Object.entries(rawData).filter(([_, v]) => v !== null && v !== undefined)
    )

    // ✅ Append blog data as JSON string
    formData.append("data", JSON.stringify(finalData))

    // ✅ Append ONLY metadata for images (no binary files)
    if (blogImages?.length > 0) {
      const imagesArray = blogImages.map((file) => ({ name: file.name }))
      formData.append("blogImages", JSON.stringify(imagesArray))
    }

    // ✅ Send request
    const response = await axiosInstance.post("/blogs", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })

    return response.data.blog || response.data
  } catch (error) {
    console.error("createBlog error", error.response?.data || error)
    throw new Error(error.response?.data?.message || "Failed to create blog")
  }
}

export const createBlogMultiple = async (blogData) => {
  try {
    const response = await axiosInstance.post("/blogs/xyz", blogData)
    return response.data.insertedBlogs
  } catch (error) {
    console.error("createBlogMultiple", error)
    throw new Error(error.response?.data?.message || "Failed to create blog")
  }
}

// Get all blogs
export const getAllBlogs = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/blogs", { params })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch blogs")
  }
}

// Get a blog by ID
export const getBlogById = async (id) => {
  try {
    const response = await axiosInstance.get(`/blogs/${id}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch blog")
  }
}

// Update a blog by ID
export const updateBlog = async (id, updatedData) => {
  try {
    const response = await axiosInstance.put(`/blogs/update/${id}`, updatedData)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update blog")
  }
}

// Delete a blog by ID
export const deleteBlog = async (id) => {
  try {
    const response = await axiosInstance.delete(`/blogs/${id}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to delete blog")
  }
}

// Get all blogs by a specific author
export const getBlogsByAuthor = async () => {
  try {
    const response = await axiosInstance.get(`/blogs`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch blogs")
  }
}

export const sendBrand = async (formData) => {
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

export const restoreBlogById = async (id) => {
  try {
    const response = await axiosInstance.patch(`/blogs/restore/${id}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to restore blog")
  }
}

export const archiveBlogById = async (id) => {
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

export const getBlogStatsById = async (id) => {
  const response = await axiosInstance.get(`/blogs/${id}/stats`)
  return response.data
}

export const getGeneratedTitles = async (data) => {
  const response = await axiosInstance.post(`/generate/title`, data)
  return response.data
}

export const createSimpleBlog = async (data) => {
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
