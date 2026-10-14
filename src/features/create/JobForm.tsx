import { useCallback, useEffect } from "react"
import { FormProvider } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { jobsQuery } from "@api/Job/Job.query"
import useAuthStore from "@store/useAuthStore"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import {
  AdvancedConfigSection,
  AiImagesSection,
  CreateFormShell,
  DependentFields,
  FormSection,
  type FormSummary,
  Watch,
  type ReadinessItem,
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
  onInvalidSubmit,
  useCancelNavigation,
  useFormSubmission,
  useFormValues,
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
import { ScheduleType } from "@/types/forms.types"
import {
  countEnabled,
  imagesSummary,
  keywordsSummary,
  modelSummary,
  plural,
} from "@/forms/shared/summary"
import type { CreateFormProps } from "./createForms.registry"

/**
 * Scheduled job as a single page, for both creating (`/create/job`) and editing
 * (`/create/job/:id`): Templates, Content (what each run writes), Schedule (when it runs and
 * how many blogs per run, read back in plain words), AI model, and the Advanced configuration
 * tabs. Content and Schedule used to share one two-column "Basics" card, which squeezed both.
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

/** Everything the rail shows. Runs in the shell, so the form root never watches its values. */
function useJobSummary(): FormSummary {
  const values = useFormValues<JobFormValues>()
  const researching = values.options?.performKeywordResearch
  const templateCount = values.templates?.length ?? 0
  const topicCount = values.topics?.length ?? 0
  const links = values.referenceLinks?.length ?? 0
  const { schedule } = values
  // Days picked for the schedule types that need them (daily / weekdays need none).
  const scheduleDays =
    schedule.type === ScheduleType.WEEKLY
      ? schedule.daysOfWeek.length
      : schedule.type === ScheduleType.MONTHLY
        ? schedule.daysOfMonth.length
        : schedule.type === ScheduleType.CUSTOM
          ? schedule.customDates.length
          : null
  const scheduleType = schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)
  const scheduleDetail =
    scheduleDays === null ? scheduleType : `${scheduleType} · ${plural(scheduleDays, "day")}`
  const enabledOptions = countEnabled([
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
  ])

  // Brand voice and publishing only become requirements once they're switched on.
  const readiness: ReadinessItem[] = [
    {
      section: "template",
      label: "Templates chosen",
      done: templateCount > 0,
      detail: templateCount ? `${templateCount} of ${JOB_MAX_TEMPLATES}` : undefined,
      fields: ["templates"],
    },
    {
      section: "content",
      label: "Job named",
      done: !!values.name?.trim(),
      detail: values.name?.trim() || undefined,
      fields: ["name"],
    },
    {
      section: "content",
      label: "Topics added",
      done: topicCount > 0,
      detail: topicCount ? `${topicCount} added` : undefined,
      fields: ["topics"],
    },
    {
      section: "content",
      label: researching ? "Keywords: AI research" : "Keywords added",
      done: !!researching || (values.keywords?.length ?? 0) > 0,
      detail: researching ? undefined : `${values.keywords?.length ?? 0} added`,
      fields: ["keywords", "referenceLinks", "tone", "userDefinedLength", "languageToWrite"],
    },
    {
      section: "schedule",
      label: "Schedule set",
      done:
        scheduleDays !== 0 && values.numberOfBlogs >= 1 && values.numberOfBlogs <= JOB_MAX_BLOGS,
      detail: scheduleDetail,
      fields: [
        "schedule.type",
        "schedule.daysOfWeek",
        "schedule.daysOfMonth",
        "schedule.customDates",
        "numberOfBlogs",
      ],
    },
    ...(values.isCheckedBrand
      ? [
          {
            section: "advanced",
            tab: "brand",
            label: "Brand voice picked",
            done: !!values.brandId,
            fields: ["brandId"],
          },
        ]
      : []),
    ...(values.options.automaticPosting
      ? [
          {
            section: "advanced",
            tab: "publishing",
            label: "Publishing platform picked",
            done: !!values.postingDefaultType,
            detail: values.postingDefaultType ?? undefined,
            fields: ["postingDefaultType"],
          },
        ]
      : []),
  ]
  const sectionDone = (id: string) =>
    readiness.filter((item) => item.section === id).every((item) => item.done)

  return {
    sections: {
      template: {
        summary: templateCount ? `${templateCount} selected` : "Not selected",
        complete: templateCount > 0,
      },
      content: {
        summary: values.name?.trim() || "Not completed",
        complete: sectionDone("content"),
      },
      schedule: {
        summary: `${scheduleDetail} · ${values.numberOfBlogs || 0} per run`,
        complete: sectionDone("schedule"),
      },
    },
    readiness,
    summaryRows: [
      { label: "Job", value: values.name?.trim() || "—" },
      { label: "Templates", value: templateCount ? (values.templates ?? []).join(", ") : "—" },
      { label: "Topics", value: `${topicCount} added` },
      { label: "Keywords", value: keywordsSummary({ keywords: values.keywords }, researching) },
      { label: "Schedule", value: scheduleDetail },
      { label: "Blogs per run", value: values.numberOfBlogs || 0 },
      { label: "Tone · length", value: `${values.tone} · ~${values.userDefinedLength} words` },
      { label: "Language", value: values.languageToWrite },
      { label: "Reference links", value: links ? plural(links, "link") : "None" },
      { label: "Model", value: modelSummary(values.aiModel, values.costCutter) },
      { label: "Images", value: imagesSummary(values) },
      { label: "Advanced options", value: `${enabledOptions} enabled` },
      { label: "Brand voice", value: values.isCheckedBrand ? "On" : "Off" },
      {
        label: "Publishing",
        value: values.options.automaticPosting ? (values.postingDefaultType ?? "On") : "Off",
      },
    ],
  }
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

  const onSubmit = handleSubmit((data) => submit(toJobPayload(data)), onInvalidSubmit)

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
        useSummary={useJobSummary}
      >
        <FormSection
          id="template"
          step={1}
          title="Templates"
          description={`Pick up to ${JOB_MAX_TEMPLATES}`}
          fields={["templates"]}
          defaultOpen
        >
          <TemplatePickerField mode="multiple" name="templates" max={JOB_MAX_TEMPLATES} />
        </FormSection>

        <FormSection
          id="content"
          step={2}
          title="Content"
          description="What each run writes about"
          defaultOpen
          fields={[
            "name",
            "topics",
            "keywords",
            "referenceLinks",
            "tone",
            "userDefinedLength",
            "languageToWrite",
          ]}
        >
          <RHFTextField
            control={control}
            name="name"
            label="Job name"
            required
            placeholder="e.g., Weekly tech posts"
            description="Only you see this — it names the job in your Jobs list."
          />

          <RHFTagsField
            control={control}
            name="topics"
            label="Topics"
            required
            csv
            maxVisible={18}
            description="Each run picks from these topics. Paste a list or upload a CSV."
            placeholder="Enter topics (comma, tab, or newline separated)"
          />

          <ToggleListField
            keys={["performKeywordResearch"]}
            onToggle={{ performKeywordResearch: () => clearErrors("keywords") }}
          />
          <Watch<boolean | undefined> name="options.performKeywordResearch">
            {(researching) => (
              <DependentFields
                enabled={!researching}
                hint="Keyword research will pick these for you — turn it off to enter your own."
              >
                <RHFTagsField
                  control={control}
                  name="keywords"
                  label="Keywords"
                  required
                  csv
                  maxVisible={18}
                  description="Secondary keywords woven through every blog."
                  placeholder="Enter keywords (comma, tab, or newline separated)"
                />
              </DependentFields>
            )}
          </Watch>

          <RHFTagsField
            control={control}
            name="referenceLinks"
            label="Reference links (max 3)"
            max={BLOG_CONFIG.CONSTRAINTS.MAX_BLOG_REFERENCE_LINKS}
            validate={(link) => validateLink(link, "reference")}
            placeholder="Enter full URLs (e.g., https://example.com)"
          />

          <SubGroup label="Writing style">
            <WritingStyleFields fields={["tone", "length", "language"]} />
          </SubGroup>
        </FormSection>

        <FormSection
          id="schedule"
          step={3}
          title="Schedule"
          description="When it runs, and how much each run writes"
          defaultOpen
          fields={[
            "schedule.type",
            "schedule.daysOfWeek",
            "schedule.daysOfMonth",
            "schedule.customDates",
            "numberOfBlogs",
          ]}
        >
          <ScheduleFields
            footer={
              <RHFNumberField
                control={control}
                name="numberOfBlogs"
                label="Blogs per run"
                required
                min={1}
                max={JOB_MAX_BLOGS}
                inline
                description={`How many blogs each run generates (1–${JOB_MAX_BLOGS}).`}
              />
            }
          />
        </FormSection>

        <AiImagesSection step={4} />

        <AdvancedConfigSection step={5} />
      </CreateFormShell>
    </FormProvider>
  )
}
