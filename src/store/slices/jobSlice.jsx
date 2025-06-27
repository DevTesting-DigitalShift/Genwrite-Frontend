import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { createJob, deleteJob, getJobs, stopJob, updateJob } from "@api/jobApi"
import { message } from "antd"

// Fetch Jobs
export const fetchJobs = createAsyncThunk("jobs/fetchJobs", async (_, { rejectWithValue }) => {
  try {
    const jobs = await getJobs()
    return jobs || []
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Something went wrong"
    message.error("Failed to fetch jobs")
    return rejectWithValue(errorMessage)
  }
})

// Create Job (already exists)
export const createJobThunk = createAsyncThunk(
  "jobs/createJob",
  async ({ jobPayload, onSuccess }, { rejectWithValue }) => {
    try {
      const data = await createJob(jobPayload)
      message.success("Job created successfully!")
      if (onSuccess) onSuccess()
      return data
    } catch (error) {
      message.error("Failed to create job. Please try again.")
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const updateJobThunk = createAsyncThunk(
  "jobs/updateJob",
  async ({ jobId, jobPayload, onSuccess }, { rejectWithValue }) => {
    try {
      const response = await updateJob(jobId, jobPayload)
      message.success("Job updated successfully!")
      if (onSuccess) onSuccess()
      return response
    } catch (error) {
      console.error("Job update", error)
      message.error("Failed to update job. Please try again.")
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const toggleJobStatusThunk = createAsyncThunk(
  "jobs/toggleStatus",
  async ({ jobId, currentStatus }, { rejectWithValue }) => {
    try {
      currentStatus === "active" ? await stopJob(jobId) : await startJob(jobId)

      message.success(
        currentStatus === "active" ? "Job paused successfully!" : "Job started successfully!"
      )
      return { jobId, status: currentStatus === "active" ? "paused" : "active" }
    } catch (error) {
      message.error("Failed to update job status.")
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const deleteJobThunk = createAsyncThunk(
  "jobs/delete",
  async (jobId, { rejectWithValue }) => {
    try {
      await deleteJob(jobId)
      message.success("Job deleted successfully!")
      return jobId
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to delete job")
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const jobSlice = createSlice({
  name: "jobs",
  initialState: {
    jobs: [],
    loading: false,
    error: null,
    showJobModal: false,
  },
  reducers: {
    openJobModal: (state) => {
      state.showJobModal = true
    },
    closeJobModal: (state) => {
      state.showJobModal = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false
        state.jobs = action.payload
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(createJobThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(createJobThunk.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(createJobThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(updateJobThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(updateJobThunk.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(updateJobThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(toggleJobStatusThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(toggleJobStatusThunk.fulfilled, (state, action) => {
        state.loading = false
        const { jobId, status } = action.payload
        const job = state.jobs.find((j) => j._id === jobId)
        if (job) job.status = status
      })
      .addCase(toggleJobStatusThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(deleteJobThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(deleteJobThunk.fulfilled, (state, action) => {
        state.loading = false
        const jobId = action.payload
        state.jobs = state.jobs.filter((job) => job._id !== jobId)
      })
      .addCase(deleteJobThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { openJobModal, closeJobModal } = jobSlice.actions
export default jobSlice.reducer
