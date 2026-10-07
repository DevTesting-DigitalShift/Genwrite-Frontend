import { useCallback } from "react"
import { FormProvider, useWatch } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import useBlogStore from "@store/useBlogStore"
import {
  AiModelFields,
  CreateFormShell,
  FormSection,
  ImageSettingsFields,
  RHFTagsField,
  RHFTextField,
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
  QUICK_BLOG_WORD_COUNT,
  quickBlogFormDefaults,
  quickBlogFormSchema,
  toQuickBlogPayload,
  type QuickBlogFormValues,
} from "@/forms/quick/quick.schema"
import { toCostLines, useGenerationCostBreakdown } from "@/forms/shared/cost"
import { validateLink } from "@/forms/shared/links"

/**
 * Quick / YouTube blog as a single page, in the four groups every create form uses:
 * Template, Basics (what to write about), AI & Images, and Advanced options for everything
 * else. Visible by default: Template and Basics; AI & Images and Advanced stay collapsed
 * for the common case, since the defaults they hold are already sensible.
 */
export default function QuickBlogForm({ type }: { type: "quick" | "yt" }) {
  const form = useZodForm(quickBlogFormSchema, quickBlogFormDefaults(type))
  const { control, setValue, clearErrors, handleSubmit } = form
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const goBack = useCancelNavigation()

  const values = useWatch({ control }) as QuickBlogFormValues
  const researching = values.options?.performKeywordResearch
  const cost = useGenerationCostBreakdown(values, { wordCount: QUICK_BLOG_WORD_COUNT })

  const send = useCallback(
    (payload: ReturnType<typeof toQuickBlogPayload>) =>
      useBlogStore.getState().createNewQuickBlog({ blogData: payload, navigate, type, queryClient }),
    [navigate, type, queryClient]
  )

  const { submit, isSubmitting, sentRef } = useFormSubmission({
    loadingMessage: `Creating ${type === "quick" ? "quick" : "YouTube"} blog...`,
    debugName: type === "yt" ? "YouTubeBlog" : "QuickBlog",
    estimatedCost: cost.total,
    send,
  })

  useUnsavedChangesGuard(form.formState.isDirty, sentRef)

  const onSubmit = handleSubmit(
    (data) => submit(toQuickBlogPayload(data)),
    () => toast.error("Please fill all required fields correctly.")
  )

  const isYouTube = type === "yt"

  return (
    <FormProvider {...form}>
      <CreateFormShell
        title={`Generate ${isYouTube ? "YouTube" : "Quick"} Blog`}
        description={
          isYouTube
            ? "Turn a YouTube video into a blog post."
            : "A ready-to-edit blog from a topic in a couple of minutes."
        }
        onCancel={goBack}
        onSubmit={onSubmit}
        submitLabel="Generate blog"
        isSubmitting={isSubmitting}
        estimatedCost={cost.total}
        costNote={values.costCutter ? "(-50% off)" : undefined}
        costLines={toCostLines(cost)}
        selectionSummary={values.template ?? undefined}
      >
        <FormSection title="Template" description="How the blog is structured" fields={["template"]} defaultOpen>
          <TemplatePickerField mode="single" name="template" />
        </FormSection>

        <FormSection
          title="Basics"
          description="What the blog is about"
          defaultOpen
          fields={["topic", "keywords", "focusKeywords", "referenceLinks"]}
        >
          <RHFTextField control={control} name="topic" label="Topic" required placeholder="Enter the blog topic" />

          {isYouTube && (
            <RHFTagsField
              control={control}
              name="referenceLinks"
              label="YouTube video links"
              required
              max={BLOG_CONFIG.CONSTRAINTS.MAX_BLOG_REFERENCE_LINKS}
              validate={(link) => validateLink(link, "youtube")}
              placeholder="Paste a YouTube link and press Enter"
            />
          )}

          <WritingStyleFields fields={["language"]} />

          <ToggleListField
            keys={["exactTitle", "performKeywordResearch"]}
            onToggle={{
              performKeywordResearch: (checked) => {
                if (!checked) return
                setValue("focusKeywords", [], { shouldDirty: true })
                setValue("keywords", [], { shouldDirty: true })
                clearErrors(["focusKeywords", "keywords"])
              },
            }}
          />

          {!researching && (
            <>
              <RHFTagsField
                control={control}
                name="focusKeywords"
                label="Focus keywords (max 3)"
                required
                max={BLOG_CONFIG.CONSTRAINTS.MAX_FOCUS_KEYWORDS}
                description="The main keywords you want this article to rank for."
                placeholder="Enter keywords (comma, tab, or newline separated)"
              />
              <RHFTagsField
                control={control}
                name="keywords"
                label="Keywords"
                required
                description="Secondary keywords woven through the article."
                placeholder="Enter keywords (comma, tab, or newline separated)"
              />
            </>
          )}

          {!isYouTube && (
            <RHFTagsField
              control={control}
              name="referenceLinks"
              label="Reference links (max 3)"
              max={BLOG_CONFIG.CONSTRAINTS.MAX_BLOG_REFERENCE_LINKS}
              validate={(link) => validateLink(link, "reference")}
              placeholder="Enter full URLs (e.g., https://example.com)"
            />
          )}
        </FormSection>

        <FormSection
          title="AI & images"
          description="Model, cost cutter and image source"
          fields={["aiModel", "imageSource", "numberOfImages"]}
        >
          <AiModelFields />
          <ImageSettingsFields />
        </FormSection>

        <FormSection title="Advanced options" description="Writing style and extra switches">
          <SubGroup label="Writing style">
            <ToggleListField keys={["easyToUnderstand", "humanisation"]} />
          </SubGroup>
          {!isYouTube && (
            <SubGroup label="Content">
              <ToggleListField keys={["embedYouTubeVideos"]} />
            </SubGroup>
          )}
        </FormSection>
      </CreateFormShell>
    </FormProvider>
  )
}
