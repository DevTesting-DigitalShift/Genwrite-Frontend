import axiosInstance from "."

export const createJob = async (payload: unknown) => {
  const response = await axiosInstance.post("/jobs", payload)
  return response.data
}

export const createJobFromRanking = async (payload: unknown) => {
  const response = await axiosInstance.post("/jobs/create-from-ranking", payload)
  return response.data
}

export const getJobs = async () => {
  const response = await axiosInstance.get("/jobs")
  return response.data
}

/** Jobs with a posting destination configured — the only jobs a campaign can usefully link to. */
export const getEligibleJobsForCampaign = async () => {
  const response = await axiosInstance.get("/jobs", { params: { eligibleForCampaign: true } })
  return response.data
}

export const updateJob = async (jobId: string, jobPayload: unknown) => {
  const response = await axiosInstance.put(`/jobs/${jobId}`, jobPayload)
  return response.data
}

export const startJob = async (jobId: string) => {
  const res = await axiosInstance.patch(`/jobs/${jobId}/start`)
  return res.data
}

export const stopJob = async (jobId: string) => {
  const res = await axiosInstance.patch(`/jobs/${jobId}/stop`)
  return res.data
}

export const deleteJob = async (jobId: string) => {
  const res = await axiosInstance.delete(`/jobs/${jobId}`)
  return res.data
}
