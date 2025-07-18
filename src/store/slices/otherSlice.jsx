import { fetchCategories } from "@api/otherApi"
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { message } from "antd"

// Stripe
export const createStripeSession = async (data) => {
  try {
    const res = await axiosInstance.post("/stripe/create-checkout-session", data)
    return res.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Stripe session creation failed")
  }
}

// WordPress
export const postToWordPress = createAsyncThunk(
  "blog/postToWordPress",
  async ({ blogId, content }, { rejectWithValue }) => {
    const postingToastId = message.loading("Posting to WordPress...")

    const processedContent = content.replace(
      /<img[^>]*src="([^"]*)"[^>]*>/g,
      (match, src) => `
        <div style="max-width: 600px; margin: 2rem auto; text-align: center;">
          <img src="${src}" alt="Blog image" style="max-width: 100%; height: auto; display: block; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
        </div>`
    )

    try {
      const response = await axiosInstance.post("/wordpress/post", {
        blogId,
        includeTableOfContents: true,
        content: processedContent,
      })

      message.dismiss(postingToastId)
      message.success("Post submitted to WordPress!")

      return response.data
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to post to WordPress"
      message.dismiss(postingToastId)
      message.error(errorMessage)
      return rejectWithValue(errorMessage)
    }
  }
)

export const getCategoriesThunk = createAsyncThunk(
  "categories/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchCategories()
      console.log({ data })
      return data
    } catch (err) {
      console.error("Error in getCategoriesThunk", err)
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

const wordpressSlice = createSlice({
  name: "wordpress",
  initialState: {
    loading: false,
    error: null,
    success: false,
    categories: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(postToWordPress.pending, (state) => {
        state.loading = true
        state.success = false
        state.error = null
      })
      .addCase(postToWordPress.fulfilled, (state) => {
        state.loading = false
        state.success = true
      })
      .addCase(postToWordPress.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(getCategoriesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getCategoriesThunk.fulfilled, (state, action) => {
        state.loading = false
        state.categories = action.payload
      })
      .addCase(getCategoriesThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export default wordpressSlice.reducer
