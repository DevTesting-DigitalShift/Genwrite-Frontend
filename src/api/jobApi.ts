import { apiDelete, apiGet, apiPatch, apiPost, apiPut, ApiRequestError } from "./typedClient"

/**
 * `apiGet`/`apiPost`/etc already resolve to the bare payload and reject with
 * `ApiRequestError` (`.message`/`.code`/`.status`/`.details`) — see typedClient.ts. This
 * rethrows a plain `Error` carrying the real backend message, matching blogApi.ts's pattern.
 */
const rethrow = (err: unknown, fallback: string): never => {
  if (err instanceof ApiRequestError) throw new Error(err.message || fallback)
  throw err instanceof Error ? err : new Error(fallback)
}

export const createJob = async (payload: unknown) => {
  try {
    return await apiPost("/api/v1/jobs", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to create job")
  }
}

export const createJobFromRanking = async (payload: unknown) => {
  try {
    return await apiPost("/api/v1/jobs/create-from-ranking", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to create job from ranking")
  }
}

export const getJobs = async () => {
  try {
    return await apiGet("/api/v1/jobs")
  } catch (err) {
    return rethrow(err, "Failed to fetch jobs")
  }
}

/** Jobs with a posting destination configured — the only jobs a campaign can usefully link to. */
export const getEligibleJobsForCampaign = async () => {
  try {
    return await apiGet("/api/v1/jobs", { query: { eligibleForCampaign: true } as never })
  } catch (err) {
    return rethrow(err, "Failed to fetch eligible jobs")
  }
}

export const updateJob = async (jobId: string, jobPayload: unknown) => {
  try {
    return await apiPut("/api/v1/jobs/{id}", jobPayload as never, { params: { id: jobId } })
  } catch (err) {
    return rethrow(err, "Failed to update job")
  }
}

export const startJob = async (jobId: string) => {
  try {
    return await apiPatch("/api/v1/jobs/{id}/start", undefined, { params: { id: jobId } })
  } catch (err) {
    return rethrow(err, "Failed to start job")
  }
}

export const stopJob = async (jobId: string) => {
  try {
    return await apiPatch("/api/v1/jobs/{id}/stop", undefined, { params: { id: jobId } })
  } catch (err) {
    return rethrow(err, "Failed to stop job")
  }
}

export const deleteJob = async (jobId: string) => {
  try {
    return await apiDelete("/api/v1/jobs/{id}", { params: { id: jobId } })
  } catch (err) {
    return rethrow(err, "Failed to delete job")
  }
}
