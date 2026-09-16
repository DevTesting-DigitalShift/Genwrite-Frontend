// src/api/Job/Job.query.ts
import type { AnyUseQueryOptions } from "@api/QueryBase"
import { BaseCRUDQuery } from "@api/BaseCRUDQuery"
import { JobAPI, type Job } from "./Job.api"
import { toast } from "sonner"
import { pushJobAgentCreationEvent } from "@utils/creationEvents"
import type { ApiRequestBody } from "@/types/apiHelpers"

class JobsQuery extends BaseCRUDQuery<Job> {
  baseKey = ["jobs"]
  api = JobAPI

  /** Jobs with a posting destination configured — for the campaign form's job picker. */
  useEligibleForCampaign = (options?: AnyUseQueryOptions<Job[]>) =>
    this.useFetchQuery<Job[]>(
      "eligible-for-campaign",
      () => this.api.getEligibleForCampaign(),
      options
    )

  useUpdate = (options?: { onSuccess?: (data: Job) => void; onError?: (err: Error) => void }) =>
    this.useMutate<Job, { id: string; data: Partial<Job> }>(
      ({ id, data }) => this.api.update(id, data),
      {
        ...options,
        onSuccess: (updated) => {
          this.queryClient.setQueryData<Job[]>([...this.baseKey, "list"], (old = []) =>
            old.map((j) => (j._id === updated._id ? updated : j))
          )
          this.queryClient.setQueryData<Job>([...this.baseKey, `detail-${updated._id}`], updated)
          toast.success("Job updated successfully!")
          options?.onSuccess?.(updated)
        },
        onError: (error) => {
          toast.error("Failed to update job")
          options?.onError?.(error)
        },
      }
    )

  useDelete = (options?: { onSuccess?: (id: string) => void; onError?: (err: Error) => void }) =>
    this.useMutate<void, string>((id) => this.api.delete(id), {
      ...options,
      onSuccess: (_, id) => {
        this.queryClient.setQueryData<Job[]>([...this.baseKey, "list"], (old = []) =>
          old.filter((j) => j._id !== id)
        )
        this.queryClient.removeQueries({ queryKey: [...this.baseKey, `detail-${id}`] })
        toast.success("Job deleted successfully!")
        options?.onSuccess?.(id)
      },
      onError: (error) => {
        toast.error("Failed to delete job")
        options?.onError?.(error)
      },
    })

  useCreate = (options?: { onSuccess?: (data: Job) => void; onError?: (err: Error) => void }) =>
    this.useMutate<Job, Partial<Job>>((payload) => this.api.create(payload), {
      ...options,
      onSuccess: (data) => {
        this.queryClient.setQueryData<Job[]>([...this.baseKey, "list"], (old = []) => [
          ...(old || []),
          data,
        ])
        pushJobAgentCreationEvent({ status: "success", job: data })
        toast.success("Job created successfully!")
        options?.onSuccess?.(data)
      },
      onError: (error) => {
        pushJobAgentCreationEvent({ status: "error", error })
        toast.error(error.message || "Failed to create job")
        options?.onError?.(error)
      },
    })

  useCreateFromRanking = (options?: {
    onSuccess?: (data: Job) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<Job, ApiRequestBody<"/jobs/create-from-ranking", "post">>(
      (payload) => this.api.createFromRanking(payload),
      {
        ...options,
        onSuccess: (data) => {
          this.queryClient.setQueryData<Job[]>([...this.baseKey, "list"], (old = []) => [
            ...(old || []),
            data,
          ])
          toast.success("Job created from audit!")
          options?.onSuccess?.(data)
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create job from audit")
          options?.onError?.(error)
        },
      }
    )

  /** Toggles a job between running and stopped, based on its current status. */
  useToggleStatus = (options?: {
    onSuccess?: (data: Job) => void
    onError?: (err: Error) => void
  }) =>
    this.useMutate<Job, { jobId: string; currentStatus: string }>(
      ({ jobId, currentStatus }) =>
        currentStatus === "active" ? this.api.stop(jobId) : this.api.start(jobId),
      {
        ...options,
        onSuccess: (updated, variables) => {
          this.queryClient.setQueryData<Job[]>([...this.baseKey, "list"], (old = []) =>
            old.map((j) => (j._id === updated._id ? updated : j))
          )
          toast.success(variables.currentStatus === "active" ? "Job paused!" : "Job started!")
          options?.onSuccess?.(updated)
        },
        onError: (error) => {
          toast.error("Failed to update job status")
          options?.onError?.(error)
        },
      }
    )
}

export const jobsQuery = new JobsQuery() as JobsQuery
