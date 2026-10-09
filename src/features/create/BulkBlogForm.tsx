import { useCallback } from "react"
import { FormProvider, useWatch } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import useBlogStore from "@store/useBlogStore"
import {
  AiModelFields,
  BrandVoiceField,
  CreateFormShell,
  FormSection,
  ImageSettingsFields,
  PostingFields,
  RHFNumberField,
  RHFTagsField,
  SubGroup,
  TemplatePickerField,
  ToggleListField,
  WritingStyleFields,
} from "@components/form"
import { BLOG_CONFIG } from "@/data/blogConfig"
import {
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

  const onSubmit = handleSubmit(
    (data) => submit(toBulkBlogPayload(data)),
    (invalid) => {
      // Only the topic count is loud enough for a toast; the rest render inline.
      const topics = invalid.topics?.message
      toast.error(topics ?? "Please fill all required fields correctly.")
    }
  )

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
        costNote={
          <>
            {values.costCutter && "(-50% off) "}({values.numberOfBlogs || 0} blog
            {Number(values.numberOfBlogs) === 1 ? "" : "s"})
          </>
        }
        costLines={toCostLines(cost)}
        selectionSummary={
          values.templates?.length
            ? `${values.templates.length} template${values.templates.length > 1 ? "s" : ""}`
            : undefined
        }
      >
        <FormSection
          title="Templates"
          description={`Pick up to ${BULK_MAX_TEMPLATES}`}
          summary={
            values.templates?.length ? `${values.templates.length} selected` : "Not selected"
          }
          fields={["templates"]}
          defaultOpen
        >
          <TemplatePickerField mode="multiple" name="templates" max={BULK_MAX_TEMPLATES} />
        </FormSection>

        <FormSection
          title="Basics"
          defaultOpen
          summary={`${values.topics?.length ?? 0}/${values.numberOfBlogs || 0} topics`}
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
          {!researching && (
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
          )}
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
          description="Automatically publish generated blogs"
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
