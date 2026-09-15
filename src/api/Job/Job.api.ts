// src/api/Job/Job.api.ts
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, rethrow } from "@api/typedClient"
import type { ApiRequestBody } from "@/types/apiHelpers"

/** Minimal shape the CRUD base class needs — the backend Job document has many more
 * fields than are worth modeling here since most call sites treat jobs as `unknown`. */
export type Job = { _id?: string } & Record<string, unknown>

export const JobAPI = {
  list: async (): Promise<Job[]> => {
    try {
      return (await apiGet("/jobs")) as Job[]
    } catch (err) {
      return rethrow(err, "Failed to fetch jobs")
    }
  },

  get: async (id: string): Promise<Job> => {
    try {
      return (await apiGet("/jobs/{id}", { params: { id } })) as Job
    } catch (err) {
      return rethrow(err, "Failed to fetch job")
    }
  },

  create: async (payload: Partial<Job>): Promise<Job> => {
    try {
      return (await apiPost("/jobs", payload as never)) as Job
    } catch (err) {
      return rethrow(err, "Failed to create job")
    }
  },

  update: async (id: string, payload: Partial<Job>): Promise<Job> => {
    try {
      return (await apiPut("/jobs/{id}", payload as never, { params: { id } })) as Job
    } catch (err) {
      return rethrow(err, "Failed to update job")
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiDelete("/jobs/{id}", { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to delete job")
    }
  },

  createFromRanking: async (
    payload: ApiRequestBody<"/jobs/create-from-ranking", "post">
  ): Promise<Job> => {
    try {
      return (await apiPost("/jobs/create-from-ranking", payload as never)) as Job
    } catch (err) {
      return rethrow(err, "Failed to create job from ranking")
    }
  },

  /** Jobs with a posting destination configured — the only jobs a campaign can usefully link to. */
  getEligibleForCampaign: async (): Promise<Job[]> => {
    try {
      return (await apiGet("/jobs", { query: { eligibleForCampaign: true } as never })) as Job[]
    } catch (err) {
      return rethrow(err, "Failed to fetch eligible jobs")
    }
  },

  // Both endpoints respond with { message, job, ... } rather than a bare Job — unwrap here
  // so callers (and the query layer's cache-patch, which keys off updated._id) get the
  // entity directly, matching every other JobAPI method.
  start: async (id: string): Promise<Job> => {
    try {
      const result = (await apiPatch("/jobs/{id}/start", undefined, { params: { id } })) as {
        job: Job
      }
      return result.job
    } catch (err) {
      return rethrow(err, "Failed to start job")
    }
  },

  stop: async (id: string): Promise<Job> => {
    try {
      const result = (await apiPatch("/jobs/{id}/stop", undefined, { params: { id } })) as {
        job: Job
      }
      return result.job
    } catch (err) {
      return rethrow(err, "Failed to stop job")
    }
  },
}
