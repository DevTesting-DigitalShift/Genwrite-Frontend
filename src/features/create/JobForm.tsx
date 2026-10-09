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
  SubGroup,
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
 * (`/create/job/:id`), in the four groups every create form uses: Templates, Basics (what to
 * write and when to run it — side by side on desktop, since a job has both a content side and
 * a schedule side), AI & Images, and Advanced options for everything else.
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
        submittingLabel={isEditing ? "Updating job..." : "Creating job..."}
        isSubmitting={isSubmitting}
        selectionSummary={
          values.templates?.length
            ? `${values.templates.length} template${values.templates.length > 1 ? "s" : ""}`
            : undefined
        }
      >
        <FormSection
          title="Templates"
          description={`Pick up to ${JOB_MAX_TEMPLATES}`}
          summary={
            values.templates?.length ? `${values.templates.length} selected` : "Not selected"
          }
          fields={["templates"]}
          defaultOpen
        >
          <TemplatePickerField mode="multiple" name="templates" max={JOB_MAX_TEMPLATES} />
        </FormSection>

        <FormSection
          title="Basics"
          description="What to write, and when to run"
          defaultOpen
          summary={`${values.schedule.type} · ${values.numberOfBlogs || 0} per run`}
          fields={[
            "name",
            "topics",
            "keywords",
            "referenceLinks",
            "numberOfBlogs",
            "schedule.daysOfWeek",
            "schedule.daysOfMonth",
            "schedule.customDates",
            "schedule.type",
            "tone",
            "userDefinedLength",
            "languageToWrite",
          ]}
        >
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
            <div className="space-y-5">
              <RHFTextField
                control={control}
                name="name"
                label="Job name"
                required
                placeholder="e.g., Weekly tech posts"
              />

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

              <WritingStyleFields fields={["tone", "length", "language"]} />

              <RHFTagsField
                control={control}
                name="referenceLinks"
                label="Reference links (max 3)"
                max={BLOG_CONFIG.CONSTRAINTS.MAX_BLOG_REFERENCE_LINKS}
                validate={(link) => validateLink(link, "reference")}
                placeholder="Enter full URLs (e.g., https://example.com)"
              />
            </div>

            <div className="mt-5 space-y-5 lg:mt-0">
              <ScheduleFields />
              <RHFNumberField
                control={control}
                name="numberOfBlogs"
                label="Blogs per run"
                required
                min={1}
                max={JOB_MAX_BLOGS}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="AI & images"
          description="Model, cost cutter and image source"
          summary={`${values.aiModel || "No model"} · ${values.imageSource === "none" ? "Images off" : "Images on"}`}
          fields={["aiModel", "costCutter", "imageSource", "numberOfImages"]}
        >
          <AiModelFields />
          <ImageSettingsFields />
        </FormSection>

        <FormSection
          title="Advanced options"
          description="Writing, content and SEO controls"
          summary={`${
            [
              values.options.easyToUnderstand,
              values.options.humanisation,
              values.options.extendedThinking,
              values.options.deepResearch,
              values.options.includeFaqs,
              values.options.includeTableOfContents,
              values.options.embedYouTubeVideos,
              values.options.includeInterlinks,
              values.options.addOutBoundLinks,
              values.options.includeCompetitorResearch,
            ].filter(Boolean).length
          } enabled`}
        >
          <SubGroup label="Writing style">
            <ToggleListField
              keys={["easyToUnderstand", "humanisation", "extendedThinking", "deepResearch"]}
            />
          </SubGroup>

          <SubGroup label="Content">
            <ToggleListField
              keys={["includeFaqs", "includeTableOfContents", "embedYouTubeVideos"]}
            />
          </SubGroup>

          <SubGroup label="SEO & research">
            <ToggleListField
              keys={["includeInterlinks", "addOutBoundLinks", "includeCompetitorResearch"]}
            />
          </SubGroup>
        </FormSection>

        <FormSection
          title="Brand voice"
          description="Apply your saved brand style and assets"
          summary={values.isCheckedBrand ? "On" : "Off"}
          fields={["brandId"]}
        >
          <BrandVoiceField />
        </FormSection>

        <FormSection
          title="Publishing"
          description="Automatically publish each generated blog"
          summary={
            values.options.automaticPosting
              ? `On · ${values.postingDefaultType ?? "Choose platform"}`
              : "Off"
          }
          fields={["postingDefaultType"]}
        >
          <PostingFields />
        </FormSection>
      </CreateFormShell>
    </FormProvider>
  )
}
