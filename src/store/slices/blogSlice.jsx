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
  getGeneratedTitles,
  createSimpleBlog,
  getBlogStatus,
} from "@api/blogApi"
import { message } from "antd"

// ----------------------- Async Thunks -----------------------

// blogSlice.ts
export const fetchAllBlogs = createAsyncThunk(
  "blogs/fetchAllBlogs",
  async (params = {}, { rejectWithValue }) => {
    try {
      const blogs = await getAllBlogs(params)
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
    if (!blogData) {
      message.error("Blog data is required to create a blog.")
      return rejectWithValue("Blog data is required to create a blog.")
    }

    try {
      const blog = await createBlog(blogData)
      message.success("Blog created successfully")
      navigate("/blogs")
      return blog
    } catch (error) {
      message.error(error.message)
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
      message.success("QuickBlog created successfully")
      navigate(`/toolbox/${blog._id}`)
      return blog
    } catch (error) {
      message.error(error.message)
      return rejectWithValue(error.message)
    }
  }
)

export const createMultiBlog = createAsyncThunk(
  "blogs/createMultiBlog",
  async ({ blogData, navigate }, { rejectWithValue }) => {
    try {
      await createBlogMultiple(blogData)
      message.success("Bulk blogs will be generated shortly")
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
      message.success("Blog updated successfully")
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
      message.success("Blog restored successfully")
      return result
    } catch (error) {
      message.error(error.message)
      return rejectWithValue(error.message)
    }
  }
)

export const deleteAllUserBlogs = createAsyncThunk(
  "blogs/deleteAllUserBlogs",
  async (_, { rejectWithValue }) => {
    try {
      const result = await deleteAllBlogs()
      message.success(`${result.deletedCount} blogs deleted`)
      return result
    } catch (error) {
      message.error(error.message)
      return rejectWithValue(error.message)
    }
  }
)

export const archiveBlog = createAsyncThunk(
  "blogs/archiveBlog",
  async (id, { rejectWithValue }) => {
    try {
      const result = await archiveBlogById(id)
      message.success("Blog deleted successfully")
      return result
    } catch (error) {
      message.error(error.message)
      return rejectWithValue(error.message)
    }
  }
)

export const retryBlog = createAsyncThunk(
  "blogs/retryBlog",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const result = await retryBlogById(id, payload)
      message.success(result?.message || "Blog regenerated successfully")
      return result
    } catch (error) {
      message.error(error.message || "Something went wrong")
      return rejectWithValue(error.message || "Failed to retry blog")
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
  async (payload, { rejectWithValue }) => {
    try {
      const { id, ...updatedData } = payload
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
  async ({ id }, { rejectWithValue }) => {
    try {
      const data = await proofreadBlogContent({ id })
      return data.suggestions
    } catch (error) {
      console.error("Proofreading error:", error)
      return rejectWithValue(error.message || "Unknown error")
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
      message.error("Failed to load blog performance stats.")
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchGeneratedTitles = createAsyncThunk(
  "blogs/fetchGeneratedTitles",
  async ({ keywords, focusKeywords, topic, template }, { rejectWithValue }) => {
    try {
      const titles = await getGeneratedTitles({
        keywords,
        focusKeywords,
        topic,
        template,
      })
      return titles
    } catch (error) {
      message.error("Failed to generate blog titles.")
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const createManualBlog = createAsyncThunk(
  "blogs/createBlog",
  async (blogData, { rejectWithValue }) => {
    try {
      const response = await createSimpleBlog(blogData)
      return response
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const fetchBlogStatus = createAsyncThunk(
  "blogs/fetchBlogStatus",
  async (params = {}, { rejectWithValue }) => {
    try {
      const result = await getBlogStatus(params)
      return result
    } catch (error) {
      return rejectWithValue(error.message)
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
  blogStats: {},
  generatedTitles: [],
  blogStatus: null,
}

// ------------------------ Slice ------------------------

const blogSlice = createSlice({
  name: "blog",
  initialState,
  reducers: {
    clearSelectedBlog: (state) => {
      state.selectedBlog = null
    },
    setProofreadingSuggestions(state, action) {
      state.proofreadingSuggestions = action.payload
    },
    setIsAnalyzingProofreading(state, action) {
      state.isAnalyzingProofreading = action.payload
    },
    clearProofreadingSuggestions(state) {
      state.proofreadingSuggestions = []
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchAllBlogs.fulfilled, (state, action) => {
        // state.loading = false
        state.blogs = action.payload
      })
      .addCase(fetchAllBlogs.rejected, (state, action) => {
        // state.loading = false
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

      .addCase(fetchGeneratedTitles.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGeneratedTitles.fulfilled, (state, action) => {
        state.loading = false
        state.generatedTitles = action.payload
      })
      .addCase(fetchGeneratedTitles.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(createManualBlog.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createManualBlog.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(createManualBlog.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(fetchBlogStatus.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchBlogStatus.fulfilled, (state, action) => {
        state.loading = false
        state.blogStatus = action.payload // Add `blogStatus` in initialState
      })
      .addCase(fetchBlogStatus.rejected, (state, action) => {
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

export const {
  clearSelectedBlog,
  setProofreadingSuggestions,
  setIsAnalyzingProofreading,
  clearProofreadingSuggestions,
} = blogSlice.actions
export default blogSlice.reducer
