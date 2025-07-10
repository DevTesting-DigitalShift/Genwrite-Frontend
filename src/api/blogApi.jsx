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
  if (!blogData) {
    throw new Error("Missing blog data in createBlog")
  }

  try {
    const sanitizedData = {
      ...blogData,
      isUnsplashActive: Boolean(blogData.isUnsplashActive),
    }

    const response = await axiosInstance.post("/blogs", sanitizedData)
    return response.data.blog
  } catch (error) {
    console.error("Blog creation API error:", error)
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
export const getAllBlogs = async () => {
  try {
    const response = await axiosInstance.get("/blogs")
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
    throw new Error(error.response?.data?.message || "Failed to fetch blogs by author")
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

export const getGeneratedTitles = async ({ keywords, focusKeywords, topic, template }) => {
  const response = await axiosInstance.post(`/generate/title`, {
    keywords,
    focusKeywords,
    topic,
    template,
  })
  return response.data
}
