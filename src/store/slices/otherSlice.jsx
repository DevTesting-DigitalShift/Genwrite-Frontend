import { createOutline, fetchCategories, generateMetadata, generatePromptContent } from "@api/otherApi"
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { message } from "antd"
import { data } from "react-router-dom"

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
      const response = await axiosInstance.post("/wordpress", {
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
      return data
    } catch (err) {
      console.error("Error in getCategoriesThunk", err)
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const createOutlineThunk = createAsyncThunk("outline/create", async (payload, thunkAPI) => {
  try {
    const data = await createOutline(payload)
    return data
  } catch (error) {
    console.error("Error in createOutline", error)
    return thunkAPI.rejectWithValue(error.response?.data || error.message)
  }
})

export const generateMetadataThunk = createAsyncThunk(
  "metadata/generate",
  async (payload, thunkAPI) => {
    try {
      const data = await generateMetadata(payload)
      return data
    } catch (error) {
      console.error("Error in generateMetadata", error)
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const generatePromptContentThunk = createAsyncThunk(
  "content/generatePromptContent",
  async ({ prompt, content }, thunkAPI) => {
    try {
      const data = await generatePromptContent({ prompt, content })
      return data
    } catch (error) {
      console.error("Error in generatePromptContent", error)
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

const wordpressSlice = createSlice({
  name: "wordpress",
  initialState: {
    data: null,
    loading: false,
    error: null,
    success: false,
    categories: [],
    metadata: null,
  },
  reducers: {
    resetMetadata: (state) => {
      state.data = null // clears the generated metadata
    },
  },
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

      .addCase(createOutlineThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createOutlineThunk.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(createOutlineThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Something went wrong"
      })

      .addCase(generateMetadataThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(generateMetadataThunk.fulfilled, (state, action) => {
        state.loading = false
        state.metadata = action.payload // 👈 store metadata response
      })
      .addCase(generateMetadataThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to generate metadata"
      })

      .addCase(generatePromptContentThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(generatePromptContentThunk.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload // or maybe state.humanizedContent if you want separate
      })
      .addCase(generatePromptContentThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to generate prompt content"
      })
  },
})

export const { resetMetadata } = wordpressSlice.actions
export default wordpressSlice.reducer
