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
import { useGenerationCost } from "@/forms/shared/cost"
import type { CreateFormProps } from "./createForms.registry"

/**
 * Bulk blog as a single page. Visible: templates, how many blogs and which topics, keywords
 * (unless research is on), language and images. Collapsed: tone/length and the writing/SEO
 * switches, then AI model, brand voice and auto-posting.
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
  const estimatedCost = useGenerationCost(values, { blogs: Number(values.numberOfBlogs) || 0 })

  const send = useCallback(
    (payload: ReturnType<typeof toBulkBlogPayload>) =>
      useBlogStore.getState().createMultiBlog({ blogData: payload, navigate, queryClient }),
    [navigate, queryClient]
  )

  const { submit, isSubmitting, sentRef } = useFormSubmission({
    loadingMessage: "Creating blogs...",
    debugName: "BulkBlog",
    estimatedCost,
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
        isSubmitting={isSubmitting}
        estimatedCost={estimatedCost}
        costNote={
          <>
            {values.costCutter && "(-50% off) "}({values.numberOfBlogs || 0} blog
            {Number(values.numberOfBlogs) === 1 ? "" : "s"})
          </>
        }
      >
        <FormSection
          title="Templates"
          description={`Pick up to ${BULK_MAX_TEMPLATES}`}
          fields={["templates"]}
          defaultOpen
        >
          <TemplatePickerField mode="multiple" name="templates" max={BULK_MAX_TEMPLATES} />
        </FormSection>

        <FormSection
          title="Topics"
          defaultOpen
          fields={["numberOfBlogs", "topics", "keywords", "languageToWrite"]}
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

          <WritingStyleFields fields={["language"]} />

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

        <FormSection title="Images" fields={["imageSource", "numberOfImages"]} defaultOpen>
          <ImageSettingsFields />
        </FormSection>

        <FormSection title="Writing & SEO options" description="Tone, length and extra switches">
          <WritingStyleFields fields={["tone", "length"]} />
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
