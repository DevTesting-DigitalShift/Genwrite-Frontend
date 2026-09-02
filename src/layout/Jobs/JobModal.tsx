import React, { useState, useEffect } from "react"
import { debugPayload } from "@utils/debugPayload"
import useJobStore from "@store/useJobStore"
import useAnalysisStore from "@store/useAnalysisStore"
import StepContent from "./StepContent"
import { useCreateJobMutation, useUpdateJobMutation } from "@api/queries/jobQueries"
import { useZodForm } from "@/lib/forms"
import {
  JOB_STEP_FIELDS,
  type JobFormValues,
  jobFormDefaults,
  jobStepOfField,
  jobToFormValues,
  jobFormSchema,
  toJobPayload,
} from "@/forms/jobForm"
import { toast } from "sonner"
import type { Path } from "react-hook-form"

/** Any addressable field on the job form, nested paths included. */
type JobFieldName = Path<JobFormValues>

// Older jobs never persisted `enableAdvanced` even though advanced-section fields
// were saved, so derive it from those fields when the flag itself is falsy. Pure
// function of its argument — module scope so it's a stable reference.
const hasAdvancedOptionsEnabled = (job: any) => {
  if (!job) return false
  const { blogs = {}, options = {} } = job
  return Boolean(
    options.wordpressPosting ||
      options.includeFaqs ||
      options.includeCompetitorResearch ||
      options.includeInterlinks ||
      options.addOutBoundLinks ||
      options.easyToUnderstand ||
      options.embedYouTubeVideos ||
      options.extendedThinking ||
      options.deepResearch ||
      options.humanisation ||
      options.includeTableOfContents ||
      blogs.useBrandVoice ||
      blogs.brandId ||
      blogs.createBrandedImages ||
      (blogs.aiModel && blogs.aiModel !== "gemini")
  )
}

interface JobModalProps {
  user?: any
  userPlan?: any
  isUserLoaded?: boolean
}

const JobModal = ({ user, userPlan, isUserLoaded }: JobModalProps) => {
  const scrollableRef = React.useRef<any>(null)
  const { showJobModal, closeJobModal, selectedJob } = useJobStore()
  const { selectedKeywords, pendingImport, setPendingImport, clearSelectedKeywords } =
    useAnalysisStore()
  const { mutate: createJobMutate, isPending: isCreating } = useCreateJobMutation()
  const { mutate: updateJobMutate, isPending: isUpdating } = useUpdateJobMutation()

  const [currentStep, setCurrentStep] = useState(1)

  // One form holds the whole job: `jobFormSchema` owns its shape and its rules, and
  // `toJobPayload` owns the request body — so the raw text boxes and the selected
  // template ids can live here without ever reaching the API.
  const {
    watch,
    setValue,
    getValues,
    reset,
    trigger,
    clearErrors,
    handleSubmit: submitForm,
    formState: { errors },
  } = useZodForm(jobFormSchema, jobFormDefaults)

  const newJob = watch()

  /** Writes one field and re-checks it, so a fixed field drops its error as you type. */
  const setField = React.useCallback(
    (name: JobFieldName, value: unknown) =>
      setValue(name, value as never, { shouldValidate: true, shouldDirty: true }),
    [setValue]
  )

  const [recentlyUploadedTopicsCount, setRecentlyUploadedTopicsCount] = useState<any>(null)
  const [recentlyUploadedKeywordsCount, setRecentlyUploadedKeywordsCount] = useState<any>(null)
  const [showAllTopics, setShowAllTopics] = useState<any>(false)
  const [showAllKeywords, setShowAllKeywords] = useState<any>(false)

  // Clear Job Modules and it's states on close
  useEffect(() => {
    if (!showJobModal) {
      reset(jobFormDefaults)
      setCurrentStep(1)
      clearSelectedKeywords()
    }
  }, [showJobModal, clearSelectedKeywords, reset])

  useEffect(() => {
    if (selectedJob) {
      const values = jobToFormValues(selectedJob)
      reset({
        ...values,
        blogs: {
          ...values.blogs,
          enableAdvanced:
            Boolean(selectedJob.blogs?.enableAdvanced) || hasAdvancedOptionsEnabled(selectedJob),
        },
      })
    } else {
      reset(jobFormDefaults)
    }
  }, [selectedJob, reset])

  useEffect(() => {
    if (pendingImport === "job" && selectedKeywords) {
      const blogs = getValues("blogs")
      setField("blogs.topics", [
        ...new Set([...(blogs.topics || []), ...(selectedKeywords?.allKeywords || [])]),
      ])
      setField("blogs.keywords", [
        ...new Set([
          ...(blogs.keywords || []),
          ...(selectedKeywords?.focusKeywords || []),
          ...(selectedKeywords?.allKeywords || []),
        ]),
      ])
      if (selectedKeywords?.numberOfBlogs) {
        setField("blogs.numberOfBlogs", selectedKeywords.numberOfBlogs)
      }
      setPendingImport(null)
    }
  }, [selectedKeywords, pendingImport, setPendingImport, getValues, setField])

  /** Validates only the fields shown on the given step. */
  const validateStep = async (step: number) => {
    const fields = (JOB_STEP_FIELDS[step as keyof typeof JOB_STEP_FIELDS] ??
      []) as unknown as JobFieldName[]
    const valid = await trigger(fields)
    if (!valid) scrollableRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    return valid
  }

  const resetModal = () => {
    closeJobModal()
    reset(jobFormDefaults)
    setCurrentStep(1)
    clearSelectedKeywords()
  }

  /** Every failing field path, flattened to the dotted names the step map uses. */
  const failingPaths = (invalid: Record<string, any>, prefix = ""): string[] =>
    Object.entries(invalid).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key
      if (value && typeof value === "object" && !("message" in value)) {
        return failingPaths(value, path)
      }
      return [path]
    })

  const onInvalid = (invalid: Record<string, any>) => {
    const steps = failingPaths(invalid).map(jobStepOfField)
    if (steps.length) setCurrentStep(Math.min(...steps))
    scrollableRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  // The schema is checked before either of these runs, so `values` is complete;
  // `toJobPayload` is the only thing that decides what the request carries.
  const handleCreateJob = submitForm(async (values) => {
    const payload = toJobPayload(values)
    if (debugPayload("Job (Create)", payload)) return
    createJobMutate(payload, { onSuccess: () => resetModal() })
  }, onInvalid)

  const handleUpdateJob = (jobId: string) =>
    submitForm(async (values) => {
      if (!isUserLoaded) {
        toast.error("User data is still loading. Please try again.")
        return
      }
      const payload = toJobPayload(values)
      if (debugPayload("Job (Update)", payload)) return
      updateJobMutate({ jobId, jobPayload: payload }, { onSuccess: () => resetModal() })
    }, onInvalid)

  if (!showJobModal) return null

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box w-11/12 max-w-3xl p-0 relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-300">
          <h3 className="font-bold text-lg">
            Step {currentStep}:{" "}
            {currentStep === 1
              ? "Select Templates"
              : currentStep === 2
                ? "Job Details"
                : currentStep === 3
                  ? "Schedule Settings"
                  : "Blog Options"}
          </h3>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            onClick={() => closeJobModal()}
          >
            ✕
          </button>
        </div>
        {/* Sleek Minimal Progress Bar */}
        <div className="w-full bg-slate-100 h-[3px] overflow-hidden">
          <div
            className="bg-[#4C5BD6] h-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / (newJob.blogs.enableAdvanced ? 4 : 3)) * 100}%` }}
          />
        </div>

        <div ref={scrollableRef} className="flex-1 overflow-y-auto p-4 md:p-6 md:pt-4">
          <StepContent
            currentStep={currentStep}
            newJob={newJob}
            setField={setField}
            getValues={getValues}
            clearErrors={clearErrors}
            errors={errors}
            recentlyUploadedTopicsCount={recentlyUploadedTopicsCount}
            setRecentlyUploadedTopicsCount={setRecentlyUploadedTopicsCount}
            recentlyUploadedKeywordsCount={recentlyUploadedKeywordsCount}
            setRecentlyUploadedKeywordsCount={setRecentlyUploadedKeywordsCount}
            showAllTopics={showAllTopics}
            setShowAllTopics={setShowAllTopics}
            showAllKeywords={showAllKeywords}
            setShowAllKeywords={setShowAllKeywords}
            user={user}
            userPlan={userPlan}
          />
        </div>

        <div className="modal-action p-4 border-t border-gray-300 mt-0 bg-gray-50 flex justify-end gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              key="previous"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="min-h-auto h-auto font-normal text-base px-6 py-2 border border-gray-300 bg-gray-100 hover:bg-gray-200 rounded-md transition-all"
              aria-label="Previous step"
            >
              Previous
            </button>
          )}
          {currentStep < (newJob.blogs.enableAdvanced ? 4 : 3) ? (
            <button
              type="button"
              key="next"
              onClick={async () => {
                if (await validateStep(currentStep)) setCurrentStep(currentStep + 1)
              }}
              className="btn min-h-auto h-auto font-bold text-base px-8 py-2.5 text-white bg-[#4C5BD6] hover:bg-[#3B4BB8] border-none rounded-md transition-all"
              aria-label="Next step"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              key="submit"
              onClick={selectedJob ? handleUpdateJob(selectedJob._id ?? "") : handleCreateJob}
              className="btn min-h-auto h-auto font-bold text-base normal-case px-8 py-2.5 text-white bg-[#4C5BD6] hover:bg-[#3B4BB8] border-none rounded-md transition-all"
              aria-label={selectedJob ? "Update job" : "Create job"}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating
                ? "Processing..."
                : selectedJob
                  ? "Update Job"
                  : "Create Job"}
            </button>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={() => closeJobModal()}>
          close
        </button>
      </form>
    </div>
  )
}

export default JobModal
