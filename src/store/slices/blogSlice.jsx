import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import {
  createBlog,
  createQuickBlog,
  createBlogMultiple,
  getAllBlogs,
  getBlogById,
  updateBlog,
  getBlogsByAuthor,
  restoreBlogById,
  deleteAllBlogs,
  archiveBlogById,
  retryBlogById,
  proofreadBlogContent,
  getBlogStatsById,
} from "@api/blogApi"
import { toast } from "react-toastify"

// ----------------------- Async Thunks -----------------------

export const fetchAllBlogs = createAsyncThunk(
  "blogs/fetchAllBlogs",
  async (_, { rejectWithValue }) => {
    try {
      const blogs = await getAllBlogs()
      return blogs
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchUserBlogs = createAsyncThunk(
  "blogs/fetchUserBlogs",
  async (_, { rejectWithValue }) => {
    try {
      return await getBlogsByAuthor()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchBlogDetails = createAsyncThunk(
  "blogs/fetchBlogDetails",
  async (id, { rejectWithValue }) => {
    try {
      return await getBlogById(id)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createNewBlog = createAsyncThunk(
  "blogs/createNewBlog",
  async ({ blogData, navigate }, { rejectWithValue }) => {
    console.log("Creating new blog with data:", blogData)
    if (!blogData) {
      toast.error("Blog data is required to create a blog.")
      return rejectWithValue("Blog data is required to create a blog.")
    }

    try {
      const blog = await createBlog(blogData)
      toast.success("Blog created successfully")
      navigate("/blogs")
      return blog
    } catch (error) {
      toast.error(error.message)
      console.error("Blog creation error:", error)
      return rejectWithValue(error.message)
    }
  }
)

export const createNewQuickBlog = createAsyncThunk(
  "blogs/createNewQuickBlog",
  async ({ blogData, navigate }, { rejectWithValue }) => {
    try {
      const blog = await createQuickBlog(blogData)
      toast.success("QuickBlog created successfully")
      navigate(`/toolbox/${blog._id}`)
      return blog
    } catch (error) {
      toast.error(error.message)
      return rejectWithValue(error.message)
    }
  }
)

export const createMultiBlog = createAsyncThunk(
  "blogs/createMultiBlog",
  async ({ blogData, navigate }, { rejectWithValue }) => {
    try {
      await createBlogMultiple(blogData)
      toast.success("Bulk blogs will be generated shortly")
      navigate("/blogs")
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateBlogDetails = createAsyncThunk(
  "blogs/updateBlogDetails",
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const updated = await updateBlog(id, updatedData)
      toast.success("Blog updated successfully")
      return updated
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const restoreTrashedBlog = createAsyncThunk(
  "blogs/restoreTrashedBlog",
  async (id, { rejectWithValue }) => {
    try {
      const result = await restoreBlogById(id)
      toast.success("Blog restored successfully")
      return result
    } catch (error) {
      toast.error(error.message)
      return rejectWithValue(error.message)
    }
  }
)

export const deleteAllUserBlogs = createAsyncThunk(
  "blogs/deleteAllUserBlogs",
  async (_, { rejectWithValue }) => {
    try {
      const result = await deleteAllBlogs()
      toast.success(`${result.deletedCount} blogs deleted`)
      return result
    } catch (error) {
      toast.error(error.message)
      return rejectWithValue(error.message)
    }
  }
)

export const archiveBlog = createAsyncThunk(
  "blogs/archiveBlog",
  async (id, { rejectWithValue }) => {
    try {
      const result = await archiveBlogById(id)
      toast.success("Blog archived successfully")
      return result
    } catch (error) {
      toast.error(error.message)
      return rejectWithValue(error.message)
    }
  }
)

export const retryBlog = createAsyncThunk(
  "blogs/retryBlog",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const result = await retryBlogById(id, payload)
      toast.success(result?.message || "Blog regenerated successfully")
      return result
    } catch (error) {
      toast.error(error.message)
      return rejectWithValue(error.message)
    }
  }
)

export const fetchBlogById = createAsyncThunk(
  "blogs/fetchBlogById",
  async (id, { rejectWithValue }) => {
    try {
      const blog = await getBlogById(id)
      return blog
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch blog")
    }
  }
)

export const updateBlogById = createAsyncThunk(
  "blogs/updateBlogById",
  async ({ id, updatedData }, { rejectWithValue }) => {
    console.log("{id", id)
    try {
      const updated = await updateBlog(id, updatedData)
      const allBlogs = await getAllBlogs()
      return { updated, allBlogs }
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update blog")
    }
  }
)

export const fetchProofreadingSuggestions = createAsyncThunk(
  "blogs/fetchProofreadingSuggestions",
  async ({ content, message }, { rejectWithValue }) => {
    try {
      const data = await proofreadBlogContent({ content, message })
      toast.success("Proofreading suggestions received!")
      return data.suggestions || []
    } catch (error) {
      toast.error(error.message)
      return rejectWithValue(error.message)
    }
  }
)

export const fetchBlogStats = createAsyncThunk(
  "blogs/fetchBlogStats",
  async (id, { rejectWithValue }) => {
    try {
      const stats = await getBlogStatsById(id)
      return { id, stats }
    } catch (error) {
      toast.error("Failed to load blog performance stats.")
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// ------------------------ Initial State ------------------------

const initialState = {
  userBlogs: [],
  proofreadingSuggestions: [],
  selectedBlog: null,
  loading: false,
  error: null,
  blogs: [],
  selectedBlog: null,
  blogStats: {},
}

// ------------------------ Slice ------------------------

const blogSlice = createSlice({
  name: "blog",
  initialState,
  reducers: {
    clearSelectedBlog: (state) => {
      state.selectedBlog = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch recent
      .addCase(fetchAllBlogs.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchAllBlogs.fulfilled, (state, action) => {
        state.loading = false
        state.blogs = action.payload
      })
      .addCase(fetchAllBlogs.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch user blogs
      .addCase(fetchUserBlogs.fulfilled, (state, action) => {
        state.userBlogs = action.payload
      })

      // Blog by ID
      .addCase(fetchBlogDetails.fulfilled, (state, action) => {
        state.selectedBlog = action.payload
      })

      // Create Blog
      .addCase(createNewBlog.fulfilled, (state, action) => {
        state.userBlogs.push(action.payload)
      })
      .addCase(createNewQuickBlog.fulfilled, (state, action) => {
        state.userBlogs.push(action.payload)
        state.selectedBlog = action.payload
      })

      // Update Blog
      .addCase(updateBlogDetails.fulfilled, (state, action) => {
        state.selectedBlog = action.payload
      })

      // Restore / Retry / Archive
      .addCase(restoreTrashedBlog.fulfilled, (state, action) => {
        state.userBlogs.push(action.payload)
      })
      .addCase(retryBlog.fulfilled, (state, action) => {
        state.userBlogs.push(action.payload)
      })
      .addCase(archiveBlog.fulfilled, (state, action) => {
        const id = action.meta.arg
        state.userBlogs = state.userBlogs.filter((b) => b._id !== id)
      })

      // Delete All
      .addCase(deleteAllUserBlogs.fulfilled, (state) => {
        state.userBlogs = []
      })

      // Fetch Blog by ID
      .addCase(fetchBlogById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBlogById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedBlog = action.payload
      })
      .addCase(fetchBlogById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      //Update Blog by ID
      .addCase(updateBlogById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateBlogById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedBlog = action.payload.updated
        state.userBlogs = action.payload.allBlogs
      })
      .addCase(updateBlogById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch Proofreading Suggestions
      .addCase(fetchProofreadingSuggestions.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchProofreadingSuggestions.fulfilled, (state, action) => {
        state.loading = false
        state.proofreadingSuggestions = action.payload
      })
      .addCase(fetchProofreadingSuggestions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch Blog Stats
      .addCase(fetchBlogStats.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBlogStats.fulfilled, (state, action) => {
        const { id, stats } = action.payload
        state.blogStats[id] = stats
      })
      .addCase(fetchBlogStats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Generic Error/Loading Handling
      .addMatcher(
        (action) => action.type.startsWith("blogs/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true
          state.error = null
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("blogs/") && action.type.endsWith("/fulfilled"),
        (state) => {
          state.loading = false
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("blogs/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false
          state.error = action.payload
        }
      )
  },
})

export const { clearSelectedBlog } = blogSlice.actions
export default blogSlice.reducer
