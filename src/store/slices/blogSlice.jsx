import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@api/index";
import {
  createBlog,
  createQuickBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  getBlogsByAuthor,
  createBlogMultiple,
  sendBrand,
} from "@api/blogApi";
import { toast } from "react-toastify";

// Async thunk to fetch recent projects
export const fetchRecentProjects = createAsyncThunk(
  "blogs/fetchRecentProjects",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/blogs");
      return response.data; // Return the fetched data
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  userBlogs: [],
  /**
   * Selected blog is the blog that is currently being open in the editor edited.
   */
  selectedBlog: null,
  loading: false,
  error: null,
  newBlog: {},
  scheduledJobs: [], // Add scheduledJobs to the initial state
  recentProjects: [],
};

const blogSlice = createSlice({
  name: "blogs",
  initialState,
  reducers: {
    addUserBlog: (state, action) => {
      // Add the new blog to the existing array
      state.userBlogs.push(action.payload);
    },
    setUserBlogs: (state, action) => {
      // Keep this reducer for fetching all blogs
      state.userBlogs = action.payload;
    },
    setSelectedBlog: (state, action) => {
      state.selectedBlog = action.payload;
    },
    clearSelectedBlog: (state) => {
      state.selectedBlog = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addScheduledJob: (state, action) => {
      state.scheduledJobs.push(action.payload); // Add a new job
    },
    deleteScheduledJob: (state, action) => {
      state.scheduledJobs = state.scheduledJobs.filter(
        (job) => job.id !== action.payload
      ); // Delete a job by ID
    },
    editScheduledJob: (state, action) => {
      const { id, updatedJob } = action.payload;
      state.scheduledJobs = state.scheduledJobs.map((job) =>
        job.id === id ? { ...job, ...updatedJob } : job
      ); // Edit a job by ID
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.recentProjects = action.payload;
      })
      .addCase(fetchRecentProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addUserBlog, // Export the new reducer action
  setUserBlogs,
  setSelectedBlog,
  clearSelectedBlog,
  setLoading,
  setError,
  addScheduledJob,
  deleteScheduledJob,
  editScheduledJob,
} = blogSlice.actions;

// Thunks for asynchronous actions

export const fetchUserBlogs = (authorId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const data = await getBlogsByAuthor();
    dispatch(setUserBlogs(data)); // Use setUserBlogs when fetching the whole list
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchBlogById = (id) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const data = await getBlogById(id);
    dispatch(setSelectedBlog(data));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateBlogById = (id, updatedData) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const data = await updateBlog(id, updatedData);
    dispatch(setSelectedBlog(data));
    // Optionally update userBlogs if necessary
    const updatedBlogs = await getAllBlogs(); // Fetch all blogs again or update the list accordingly
    dispatch(setUserBlogs(updatedBlogs));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const createNewBlog = (blogData, navigate) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const blog = await createBlog({ ...blogData, aiModel: blogData.aiModel || "Gemini" });
    dispatch(addUserBlog(blog));
    navigate(`/project`);
    toast.success("Blog created successfully");
  } catch (error) {
    console.error("Error creating blog:", error);
    toast.error("Failed to create blog");
  } finally {
    dispatch(setLoading(false));
  }
};

export const createNewQuickBlog = (blogData, navigate) => async (dispatch, getState) => {
  // Add getState
  dispatch(setLoading(true));
  try {
    // This will wait until the blog is fully generated with content
    const blog = await createQuickBlog(blogData);

    if (!blog || !blog._id) {
      // Check for blog._id as confirmation
      throw new Error("Blog creation failed: Invalid response from server");
    }

    // Blog is ready with content
    dispatch(addUserBlog(blog)); // Dispatch the new action with the blog object
    dispatch(setSelectedBlog(blog));
    navigate(`/toolbox/${blog._id}`);
    toast.success("QuickBlog created successfully");
  } catch (error) {
    console.error("QuickBlog creation error:", error);
    const errorMessage =
      error.response?.data?.message || error.message || "QuickBlog creation failed";
    dispatch(setError(errorMessage));
    toast.error(errorMessage);
  } finally {
    dispatch(setLoading(false));
  }
};

export const createMultiBlog = (blogData, navigate) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const blog = await createBlogMultiple(blogData);
    navigate(`/project`); // Navigate to the project page
    toast.success("Bulk Blogs will be generated shortly on 10 min interval");
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const sendBrandVoice = (formData, navigate) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const blog = await sendBrand(formData);
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export default blogSlice.reducer;
