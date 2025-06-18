import axiosInstance from "." // Import the Axios instance

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
    const sanitizedData = {
      ...blogData,
      isUnsplashActive: Boolean(blogData.isUnsplashActive),
    }

    const response = await axiosInstance.post("/blogs", sanitizedData)

    // Wait for the blog to be fully generated with content
    let blog = response.data.blog
    // while (!blog.content) {
    //   await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    //   const checkResponse = await axiosInstance.get(`/blogs/${blog._id}`);
    //   blog = checkResponse.data;
    // }
    return blog
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
    const response = await axiosInstance.put(`/blogs/${id}`, updatedData)
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
