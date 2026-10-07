import { useCallback, useEffect } from "react"
import { FormProvider, useWatch } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { jobsQuery } from "@api/Job/Job.query"
import useAuthStore from "@store/useAuthStore"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import {
  AiModelFields,
  BrandVoiceField,
  CreateFormShell,
  FormSection,
  ImageSettingsFields,
  PostingFields,
  RHFNumberField,
  RHFTagsField,
  RHFTextField,
  ScheduleFields,
  TemplatePickerField,
  ToggleListField,
  WritingStyleFields,
} from "@components/form"
import LoadingScreen from "@components/ui/LoadingScreen"
import { BLOG_CONFIG } from "@/data/blogConfig"
import {
  useCancelNavigation,
  useFormSubmission,
  useUnsavedChangesGuard,
  useZodForm,
} from "@/lib/forms"
import {
  JOB_MAX_BLOGS,
  JOB_MAX_TEMPLATES,
  jobFormDefaults,
  jobFormSchema,
  jobToFormValues,
  toJobPayload,
  type JobFormValues,
} from "@/forms/job/job.schema"
import { validateLink } from "@/forms/shared/links"
import type { CreateFormProps } from "./createForms.registry"

/**
 * Scheduled job as a single page, for both creating (`/create/job`) and editing
 * (`/create/job/:id`). Visible: name, templates, topics, keywords, schedule, images.
 * Collapsed: tone/length, reference links, writing & SEO switches, AI model, brand voice and
 * auto-posting.
 */
export default function JobForm({ id, prefill }: CreateFormProps) {
  const { data: job, isLoading } = jobsQuery.useDetail(id ?? "", { enabled: !!id })

  if (id && isLoading) return <LoadingScreen />

  return <JobFormBody id={id} initial={id ? jobToFormValues(job) : mergePrefill(prefill)} />
}

/** Router-state prefill (e.g. keywords picked in Keyword Research) over the defaults. */
function mergePrefill(prefill: CreateFormProps["prefill"]): JobFormValues {
  return { ...jobFormDefaults, ...(prefill as Partial<JobFormValues> | undefined) }
}

function JobFormBody({ id, initial }: { id?: string; initial: JobFormValues }) {
  const form = useZodForm(jobFormSchema, initial)
  const { control, clearErrors, handleSubmit } = form
  const navigate = useNavigate()
  const goBack = useCancelNavigation("/jobs")
  const user = useAuthStore((s) => s.user)
  const isEditing = !!id

  // Creating counts against the plan's monthly job limit; check it before the user fills
  // the whole form in, as the Jobs page used to when it opened the modal.
  const usage = user?.usage?.createdJobs || 0
  const usageLimit = user?.usageLimits?.createdJobs || 0
  useEffect(() => {
    if (!isEditing && user && usage >= usageLimit) {
      openUpgradePopup({ featureName: "Additional Jobs", navigate })
      goBack()
    }
  }, [isEditing, user, usage, usageLimit, navigate, goBack])

  const { mutateAsync: createJob } = jobsQuery.useCreate()
  const { mutateAsync: updateJob } = jobsQuery.useUpdate()

  const values = useWatch({ control }) as JobFormValues
  const researching = values.options?.performKeywordResearch

  const send = useCallback(
    (payload: ReturnType<typeof toJobPayload>) =>
      isEditing
        ? updateJob({ id: id as string, data: payload })
        : createJob(payload).then(() => undefined),
    [isEditing, id, createJob, updateJob]
  )

  const { submit, isSubmitting, sentRef } = useFormSubmission({
    loadingMessage: isEditing ? "Updating job..." : "Creating job...",
    debugName: isEditing ? "Job (Update)" : "Job (Create)",
    send,
    onSuccess: () => navigate("/jobs", { replace: true }),
  })

  useUnsavedChangesGuard(form.formState.isDirty, sentRef)

  const onSubmit = handleSubmit(
    (data) => submit(toJobPayload(data)),
    () => toast.error("Please fill all required fields correctly.")
  )

  return (
    <FormProvider {...form}>
      <CreateFormShell
        title={isEditing ? "Edit Job" : "Create Job"}
        description="Generate blogs automatically on a schedule."
        onCancel={goBack}
        onSubmit={onSubmit}
        submitLabel={isEditing ? "Update job" : "Create job"}
        isSubmitting={isSubmitting}
      >
        <FormSection title="Templates" description={`Pick up to ${JOB_MAX_TEMPLATES}`} fields={["templates"]} defaultOpen>
          <TemplatePickerField mode="multiple" name="templates" max={JOB_MAX_TEMPLATES} />
        </FormSection>

        <FormSection title="Topics" defaultOpen fields={["name", "topics", "keywords"]}>
          <RHFTextField control={control} name="name" label="Job name" required placeholder="e.g., Weekly tech posts" />

          <RHFTagsField
            control={control}
            name="topics"
            label="Topics"
            required
            csv
            maxVisible={18}
            description="Blogs are written about these topics. Paste a list or upload a CSV."
            placeholder="Enter topics (comma, tab, or newline separated)"
          />

          <ToggleListField
            keys={["performKeywordResearch"]}
            onToggle={{ performKeywordResearch: () => clearErrors("keywords") }}
          />
          {!researching && (
            <RHFTagsField
              control={control}
              name="keywords"
              label="Keywords"
              required
              csv
              maxVisible={18}
              placeholder="Enter keywords (comma, tab, or newline separated)"
            />
          )}

          <WritingStyleFields fields={["language"]} />
        </FormSection>

        <FormSection
          title="Schedule"
          defaultOpen
          fields={["schedule.daysOfWeek", "schedule.daysOfMonth", "schedule.customDates", "numberOfBlogs"]}
        >
          <ScheduleFields />
          <RHFNumberField
            control={control}
            name="numberOfBlogs"
            label="Blogs per run"
            required
            min={1}
            max={JOB_MAX_BLOGS}
          />
        </FormSection>

        <FormSection title="Images" fields={["imageSource", "numberOfImages"]} defaultOpen>
          <ImageSettingsFields />
        </FormSection>

        <FormSection title="Style & length" description="Tone and word count">
          <WritingStyleFields fields={["tone", "length"]} />
        </FormSection>

        <FormSection
          title="Reference links"
          description="Pages the AI should read first"
          fields={["referenceLinks"]}
        >
          <RHFTagsField
            control={control}
            name="referenceLinks"
            label="Reference links (max 3)"
            max={BLOG_CONFIG.CONSTRAINTS.MAX_BLOG_REFERENCE_LINKS}
            validate={(link) => validateLink(link, "reference")}
            placeholder="Enter full URLs (e.g., https://example.com)"
          />
        </FormSection>

        <FormSection title="Writing & SEO options" description="Extra switches for power users">
          <ToggleListField
            keys={[
              "easyToUnderstand",
              "humanisation",
              "extendedThinking",
              "deepResearch",
              "includeFaqs",
              "includeInterlinks",
              "addOutBoundLinks",
              "includeCompetitorResearch",
              "includeTableOfContents",
              "embedYouTubeVideos",
            ]}
          />
        </FormSection>

        <FormSection
          title="AI model, brand & posting"
          fields={["aiModel", "brandId", "postingDefaultType"]}
        >
          <AiModelFields />
          <BrandVoiceField />
          <PostingFields />
        </FormSection>
      </CreateFormShell>
    </FormProvider>
  )
}
