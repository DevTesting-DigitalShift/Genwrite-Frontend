import axiosInstance from "."

export const createJob = async (payload) => {
  const response = await axiosInstance.post("/jobs", payload)
  return response.data
}

export const getJobs = async () => {
  const response = await axiosInstance.get("/jobs")
  return response.data
}

export const updateJob = async (jobId, jobPayload) => {
  const response = await axiosInstance.put(`/jobs/${jobId}`, jobPayload)
  return response.data
}

export const startJob = async (jobId) => {
  const res = await axiosInstance.patch(`/jobs/${jobId}/start`)
  return res.data
}

export const stopJob = async (jobId) => {
  const res = await axiosInstance.patch(`/jobs/${jobId}/stop`)
  return res.data
}

export const deleteJob = async (jobId) => {
  const res = await axiosInstance.delete(`/jobs/${jobId}`)
  return res.data
}
