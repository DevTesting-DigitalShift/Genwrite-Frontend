import {
  createIntegration,
  createOutline,
  fetchCategories,
  fetchIntegrations,
  generateMetadata,
  generatePromptContent,
  pingIntegration,
  unsubscribeUser,
} from "@api/otherApi"
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { message } from "antd"
import { data } from "react-router-dom"

// Stripe
export const createStripeSession = async data => {
  try {
    const res = await axiosInstance.post("/stripe/create-checkout-session", data)
    return res.data
  } catch (error) {
    category
    throw new Error(error.response?.data?.message || "Stripe session creation failed")
  }
}

export const getCategoriesThunk = createAsyncThunk(
  "categories/getAll",
  async (type = "WORDPRESS", { rejectWithValue }) => {
    try {
      const data = await fetchCategories(type)
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

      // pick a clean, serializable message
      const errorMessage = error || "Error while generating content"

      return thunkAPI.rejectWithValue(errorMessage) // ✅ string only
    }
  }
)

export const unsubscribeThunk = createAsyncThunk(
  "user/unsubscribe",
  async (email, { rejectWithValue }) => {
    try {
      const data = await unsubscribeUser(email)
      return data
    } catch (error) {
      console.error("Error in unsubscribeThunk", error)
      return rejectWithValue(error.message || "Error while unsubscribing")
    }
  }
)

export const getIntegrationsThunk = createAsyncThunk(
  "integrations/getAll",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchIntegrations()
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const pingIntegrationThunk = createAsyncThunk(
  "integrations/ping",
  async (type, { rejectWithValue }) => {
    // <- get type here
    try {
      return await pingIntegration(type) // pass type to API
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const createIntegrationThunk = createAsyncThunk(
  "integrations/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await createIntegration(payload)
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const updateExistingIntegration = createAsyncThunk(
  "integrations/update",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await updateIntegration(payload)
      return res
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

const wordpressSlice = createSlice({
  name: "wordpress",
  initialState: {
    data: [],
    loading: false,
    error: null,
    success: false,
    categories: [],
    metadata: null,
  },
  reducers: {
    resetMetadata: state => {
      state.data = null
    },
    resetCategories: state => {
      state.categories = []
      state.error = null
    },
    resetUnsubscribe: state => {
      state.loading = false
      state.error = null
      state.successMessage = null
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getCategoriesThunk.pending, state => {
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

      .addCase(createOutlineThunk.pending, state => {
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

      .addCase(generateMetadataThunk.pending, state => {
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

      .addCase(generatePromptContentThunk.pending, state => {
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

      .addCase(unsubscribeThunk.pending, state => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(unsubscribeThunk.fulfilled, (state, action) => {
        state.loading = false
        state.successMessage = action.payload // backend sends "You have been unsubscribed..."
      })
      .addCase(unsubscribeThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(getIntegrationsThunk.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(getIntegrationsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(getIntegrationsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(updateExistingIntegration.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(updateExistingIntegration.fulfilled, (state, action) => {
        state.loading = false
        const updatedIntegration = action.payload
        const index = state.integrations.findIndex(p => p.id === updatedIntegration.id)
        if (index !== -1) {
          state.integrations[index] = updatedIntegration
        }
      })
      .addCase(updateExistingIntegration.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // PING
      //    .addCase(pingIntegrationThunk.pending, (state) => {
      //   state.loading = true
      //   state.error = null
      //   state.ping = null
      // })
      .addCase(pingIntegrationThunk.fulfilled, (state, action) => {
        state.loading = false
        state.ping = action.payload
        state.error = null
      })
      // .addCase(pingIntegrationThunk.rejected, (state, action) => {
      //   state.loading = false
      //   state.error = action.payload || "Failed to ping integration"
      //   state.ping = null
      // })

      // CREATE Integration
      .addCase(createIntegrationThunk.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(createIntegrationThunk.fulfilled, (state, action) => {
        state.loading = false
        state.error = null

        // Make sure state.data is an array
        if (!Array.isArray(state.data)) {
          state.data = []
        }

        // Convert payload to array element if necessary
        const integrationEntry = action.payload.integrations
          ? Object.entries(action.payload.integrations).map(([type, value]) => ({
              type,
              ...value,
            }))
          : action.payload

        state.data.push(
          ...(Array.isArray(integrationEntry) ? integrationEntry : [integrationEntry])
        )
      })

      .addCase(createIntegrationThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to create integration"
      })
  },
})

export const { resetMetadata, resetCategories, resetUnsubscribe } = wordpressSlice.actions
export default wordpressSlice.reducer
