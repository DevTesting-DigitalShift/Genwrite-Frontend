import { useCallback } from "react"
import { FormProvider, useWatch } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import useBlogStore from "@store/useBlogStore"
import {
  AdvancedConfigSection,
  AiImagesSection,
  CreateFormShell,
  DependentFields,
  FormSection,
  type ReadinessItem,
  RHFNumberField,
  RHFTagsField,
  TemplatePickerField,
  ToggleListField,
  WritingStyleFields,
} from "@components/form"
import { BLOG_CONFIG } from "@/data/blogConfig"
import {
  onInvalidSubmit,
  useCancelNavigation,
  useFormSubmission,
  useUnsavedChangesGuard,
  useZodForm,
} from "@/lib/forms"
import {
  BULK_MAX_TEMPLATES,
  blogCountForTopics,
  bulkBlogFormDefaults,
  bulkBlogFormSchema,
  toBulkBlogPayload,
  type BulkBlogFormValues,
} from "@/forms/bulk/bulk.schema"
import { toCostLines, useGenerationCostBreakdown } from "@/forms/shared/cost"
import {
  countEnabled,
  imagesSummary,
  keywordsSummary,
  modelSummary,
  originalCostOf,
  plural,
} from "@/forms/shared/summary"
import type { CreateFormProps } from "./createForms.registry"

/**
 * Bulk blog as a single page, in the four groups every create form uses: Templates, Basics
 * (topics, keywords, tone), AI & Images, and Advanced options (the remaining content
 * switches, brand voice and auto-posting, each under its own label).
 */
export default function BulkBlogForm({ prefill }: CreateFormProps) {
  const form = useZodForm(bulkBlogFormSchema, {
    ...bulkBlogFormDefaults,
    ...(prefill as Partial<BulkBlogFormValues> | undefined),
  })
  const { control, setValue, getValues, clearErrors, handleSubmit } = form
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const goBack = useCancelNavigation()

  const values = useWatch({ control }) as BulkBlogFormValues
  const researching = values.options?.performKeywordResearch
  const cost = useGenerationCostBreakdown(values, { blogs: Number(values.numberOfBlogs) || 0 })

  const send = useCallback(
    (payload: ReturnType<typeof toBulkBlogPayload>) =>
      useBlogStore.getState().createMultiBlog({ blogData: payload, navigate, queryClient }),
    [navigate, queryClient]
  )

  const { submit, isSubmitting, sentRef } = useFormSubmission({
    loadingMessage: "Creating blogs...",
    debugName: "BulkBlog",
    estimatedCost: cost.total,
    send,
  })

  useUnsavedChangesGuard(form.formState.isDirty, sentRef)

  const onSubmit = handleSubmit((data) => submit(toBulkBlogPayload(data)), onInvalidSubmit)

  /** Adding more topics than blogs raises the count for the user instead of refusing them. */
  const syncBlogCount = useCallback(
    (_added: string[], topics: string[]) => {
      const next = blogCountForTopics(topics.length, getValues("numberOfBlogs"))
      if (next === null) return
      setValue("numberOfBlogs", next, { shouldDirty: true })
      clearErrors("numberOfBlogs")
      toast.info(`Number of blogs increased to ${next} to match your topics.`)
    },
    [getValues, setValue, clearErrors]
  )

  const templateCount = values.templates?.length ?? 0
  const topicCount = values.topics?.length ?? 0
  const blogCount = Number(values.numberOfBlogs) || 0
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
      detail: templateCount ? `${templateCount} of ${BULK_MAX_TEMPLATES}` : undefined,
      fields: ["templates"],
    },
    {
      section: "basics",
      label: "Topics added",
      // Mirrors the schema: one topic per blog, inside the bulk limits.
      done:
        topicCount === blogCount &&
        blogCount >= BLOG_CONFIG.BULK.MIN_BLOGS &&
        blogCount <= BLOG_CONFIG.BULK.MAX_BLOGS,
      detail: `${topicCount}/${blogCount}`,
      fields: ["numberOfBlogs", "topics"],
    },
    {
      section: "basics",
      label: researching ? "Keywords: AI research" : "Keywords added",
      done: !!researching || (values.keywords?.length ?? 0) > 0,
      detail: researching ? undefined : `${values.keywords?.length ?? 0} added`,
      fields: ["keywords", "tone", "userDefinedLength", "languageToWrite"],
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

  return (
    <FormProvider {...form}>
      <CreateFormShell
        title="Generate Bulk Blogs"
        description="Several blogs at once, one topic each."
        onCancel={goBack}
        onSubmit={onSubmit}
        submitLabel="Generate blogs"
        submittingLabel="Generating blogs..."
        isSubmitting={isSubmitting}
        estimatedCost={cost.total}
        originalCost={originalCostOf(cost)}
        costNote={`For ${plural(blogCount, "blog")}`}
        costLines={toCostLines(cost)}
        readiness={readiness}
        summaryRows={[
          { label: "Templates", value: templateCount ? (values.templates ?? []).join(", ") : "—" },
          { label: "Blogs", value: blogCount },
          { label: "Topics", value: `${topicCount} added` },
          { label: "Keywords", value: keywordsSummary({ keywords: values.keywords }, researching) },
          { label: "Tone · length", value: `${values.tone} · ~${values.userDefinedLength} words` },
          { label: "Language", value: values.languageToWrite },
          { label: "Model", value: modelSummary(values.aiModel, values.costCutter) },
          { label: "Images", value: imagesSummary(values) },
          { label: "Advanced options", value: `${enabledOptions} enabled` },
          { label: "Brand voice", value: values.isCheckedBrand ? "On" : "Off" },
          {
            label: "Publishing",
            value: values.options.automaticPosting ? (values.postingDefaultType ?? "On") : "Off",
          },
        ]}
      >
        <FormSection
          id="template"
          step={1}
          title="Templates"
          description={`Pick up to ${BULK_MAX_TEMPLATES}`}
          summary={templateCount ? `${templateCount} selected` : "Not selected"}
          complete={templateCount > 0}
          fields={["templates"]}
          defaultOpen
        >
          <TemplatePickerField mode="multiple" name="templates" max={BULK_MAX_TEMPLATES} />
        </FormSection>

        <FormSection
          id="basics"
          step={2}
          title="Basics"
          description="Topics, keywords and writing style"
          defaultOpen
          summary={`${topicCount}/${blogCount} topics`}
          complete={sectionDone("basics")}
          fields={[
            "numberOfBlogs",
            "topics",
            "keywords",
            "tone",
            "userDefinedLength",
            "languageToWrite",
          ]}
        >
          <RHFNumberField
            control={control}
            name="numberOfBlogs"
            label="Number of blogs"
            required
            min={BLOG_CONFIG.BULK.MIN_BLOGS}
            max={BLOG_CONFIG.BULK.MAX_BLOGS}
            description={`${BLOG_CONFIG.BULK.MIN_BLOGS}–${BLOG_CONFIG.BULK.MAX_BLOGS}. Adding more topics than this raises it automatically.`}
          />

          <RHFTagsField
            control={control}
            name="topics"
            label={`Topics (${values.topics?.length ?? 0}/${values.numberOfBlogs || 0} added)`}
            required
            max={BLOG_CONFIG.BULK.MAX_BLOGS}
            csv
            maxVisible={18}
            onItemsAdded={syncBlogCount}
            description="One topic per blog. Paste a list or upload a CSV."
            placeholder="Enter topics (comma, tab, or newline separated)"
          />

          <WritingStyleFields fields={["tone", "length", "language"]} />

          <ToggleListField
            keys={["performKeywordResearch"]}
            onToggle={{ performKeywordResearch: () => clearErrors("keywords") }}
          />
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
        </FormSection>

        <AiImagesSection step={3} />

        <AdvancedConfigSection step={4} />
      </CreateFormShell>
    </FormProvider>
  )
}
