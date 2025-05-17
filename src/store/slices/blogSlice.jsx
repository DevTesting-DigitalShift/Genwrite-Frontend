import { createSlice } from "@reduxjs/toolkit";
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

const initialState = {
  userBlogs: [],
  /**
   * Selected blog is the blog that is currently being open in the editor edited.
   */
  selectedBlog: null,
  loading: false,
  error: null,
  newBlog: {},
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
  },
});

export const {
  addUserBlog, // Export the new reducer action
  setUserBlogs,
  setSelectedBlog,
  clearSelectedBlog,
  setLoading,
  setError,
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

export const createNewBlog = (blogData, navigate) => async (dispatch, getState) => {
  // Add getState
  dispatch(setLoading(true));
  try {
    console.log("Creating new blog with data:", blogData); // Log the data being sent
    // This will wait until the blog is fully generated with content
    const blog = await createBlog(blogData);

    if (!blog || !blog._id) {
      // Check for blog._id as confirmation
      throw new Error("Blog creation failed: Invalid response from server");
    }

    // Blog is ready with content
    console.log("Blog created successfully on backend:", blog);
    dispatch(addUserBlog(blog)); // Dispatch the new action with the blog object
    // dispatch(setSelectedBlog(blog));
    navigate(`/project`);
    toast.success("Blog will be generated shortly");
  } catch (error) {
    console.error("Blog creation error:", error);
    const errorMessage = error.response?.data?.message || error.message || "Blog creation failed";
    dispatch(setError(errorMessage));
    toast.error(errorMessage);
  } finally {
    dispatch(setLoading(false));
  }
};

export const createNewQuickBlog = (blogData, navigate) => async (dispatch, getState) => {
  // Add getState
  dispatch(setLoading(true));
  try {
    console.log("Creating new blog with data:", blogData); // Log the data being sent
    // This will wait until the blog is fully generated with content
    const blog = await createQuickBlog(blogData);

    if (!blog || !blog._id) {
      // Check for blog._id as confirmation
      throw new Error("Blog creation failed: Invalid response from server");
    }

    // Blog is ready with content
    console.log("Blog created successfully on backend:", blog);
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
    console.log("Creating multi new blog");
    const blog = await createBlogMultiple(blogData);
    console.log({ blog });
    dispatch(addUserBlog(blog)); // Dispatch the new action with the blog object
    // dispatch(setSelectedBlog(blog));
    // console.log(blogData);
    navigate(`/project`); // Navigate to the project page
    toast.success("Bulk Blogs added successfully");
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const sendBrandVoice = (formData, navigate) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    console.log("hitting /brand/addBrand ");
    const blog = await sendBrand(formData);
    console.log({ blog });
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export default blogSlice.reducer;
