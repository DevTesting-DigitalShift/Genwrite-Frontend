import axiosInstance from "."; // Import the Axios instance

// Create a new blog
export const createBlog = async (blogData) => {
  try {
    const response = await axiosInstance.post("/blogs", blogData);
    console.log("blogData")
    console.log("blog data int he create blof api - ")
    console.log(blogData)
    console.log("blog data |||||")
    console.log(response)
    return response.data;
  } catch (error) {
    console.log("error + ===" + error)
    console.log(blogData)
    console.log(error)
    throw new Error(error.response?.data?.message || "Failed to create blog");
  }
};


export const createBlogMultiple = async (blogData) => {
  try {
    const response = await axiosInstance.post("/blogs/xyz", blogData);
    console.log("multiple blogData")
    console.log(blogData)
    console.log("blog data |||||")
  } catch (error) {
    console.log("error + ===" + error)
    console.log(blogData)
    console.log(error)
    throw new Error(error.response?.data?.message || "Failed to create blog");
  }
};

// Get all blogs
export const getAllBlogs = async () => {
  try {
    const response = await axiosInstance.get("/blogs");
    console.log(response.data)
    console.log()
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch blogs");
  }
};

// Get a blog by ID
export const getBlogById = async (id) => {
  try {
    console.log("api is hitting")
    const response = await axiosInstance.get(`/blogs/${id}`);
     console.log("API response for getBlogById:", response.data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch blog");
  }
};

// Update a blog by ID
export const updateBlog = async (id, updatedData) => {
  try {
    const response = await axiosInstance.put(`/blogs/${id}`, updatedData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update blog");
  }
};

// Delete a blog by ID
export const deleteBlog = async (id) => {
  try {
    const response = await axiosInstance.delete(`/blogs/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to delete blog");
  }
};

// Get all blogs by a specific author
export const getBlogsByAuthor = async (authorId) => {
  try {
    const response = await axiosInstance.get(`/blogs/author/${authorId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch blogs by author"
    );
  }
};











export const sendBrand = async (formData) => {
  try {
    console.log(formData)
    const response = await axiosInstance.post("/brand/addBrand", formData);
  } catch (error) {
    console.log("error + ===" + error)
    console.log(error)
    throw new Error(error.response?.data?.message || "Failed to create blog");
  }
};