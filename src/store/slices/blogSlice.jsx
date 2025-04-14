import { createSlice } from "@reduxjs/toolkit";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  getBlogsByAuthor,
  createBlogMultiple,
  sendBrand,
} from "../../api/blogApi";
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
    setUserBlogs: (state, action) => {
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
    const data = await getBlogsByAuthor(authorId);
    dispatch(setUserBlogs(data));
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
    console.log("Creating new blog");
    const blog = await createBlog(blogData);
    console.log({ blog });
    dispatch(setUserBlogs((prev) => [...prev, blog])); // Add the new blog to the list
    dispatch(setSelectedBlog(blog));
    console.log(blogData)
    navigate(`/toolbox/${blog._id}`); // Navigate to the editor page
    toast.success("Blog created successfully");
  } catch (error) {
    dispatch(setError(error.message));
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
    dispatch(setUserBlogs((prev) => [...prev, blog])); // Add the new blog to the list
    dispatch(setSelectedBlog(blog));
    console.log(blogData)
    navigate(`/toolbox/${blog._id}`); // Navigate to the editor page
    toast.success("Blog created successfully");
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
    const blog = await  sendBrand(formData);
    console.log({ blog });
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};


export default blogSlice.reducer;
