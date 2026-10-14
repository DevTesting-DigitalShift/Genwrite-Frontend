import { useCallback } from "react"
import { FormProvider, useWatch } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Sparkles } from "lucide-react"
import useBlogStore from "@store/useBlogStore"
import {
  CreateFormShell,
  type ReadinessItem,
  FormSection,
  RHFTagsField,
  RHFTextField,
  TemplatePickerField,
  ToggleListField,
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
  QUICK_BLOG_FIXED,
  QUICK_BLOG_WORD_COUNT,
  quickBlogFormDefaults,
  quickBlogFormSchema,
  toQuickBlogPayload,
  type QuickBlogFormValues,
} from "@/forms/quick/quick.schema"
import { toCostLines, useGenerationCostBreakdown } from "@/forms/shared/cost"
import { validateLink } from "@/forms/shared/links"
import {
  imagesSummary,
  keywordsSummary,
  modelSummary,
  originalCostOf,
  plural,
} from "@/forms/shared/summary"

/** Shown under the YouTube blog's inputs, where the other forms have their settings. */
const YT_AUTOMATIC =
  "We watch your videos and pick the template and keywords for you. The blog is written with Gemini (cost cutter on) and stock images."

/**
 * Quick / YouTube blog — the "just give me a blog" forms, so they ask for almost nothing and
 * the backend fills the rest (Gemini behind the cost cutter, stock images, ~800 words):
 *
 * - Quick: Template, then Basics — topic, the exact-title and keyword-research switches (the
 *   keyword fields appear only once research is off), and optional reference links.
 * - YouTube: one section — the video links and the topic. The template and keywords are
 *   picked from the videos by the backend's yt-setup step.
 *
 * No AI-model or advanced settings on either: those live in the advanced, bulk and job forms.
 */
export default function QuickBlogForm({ type }: { type: "quick" | "yt" }) {
  const form = useZodForm(quickBlogFormSchema, quickBlogFormDefaults(type))
  const { control, setValue, clearErrors, handleSubmit } = form
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const goBack = useCancelNavigation()

  const values = useWatch({ control }) as QuickBlogFormValues
  const isYouTube = type === "yt"
  const researching = !isYouTube && values.options?.performKeywordResearch
  const cost = useGenerationCostBreakdown(
    { ...values, ...QUICK_BLOG_FIXED },
    { wordCount: QUICK_BLOG_WORD_COUNT }
  )

  const send = useCallback(
    (payload: ReturnType<typeof toQuickBlogPayload>) =>
      useBlogStore
        .getState()
        .createNewQuickBlog({ blogData: payload, navigate, type, queryClient }),
    [navigate, type, queryClient]
  )

  const { submit, isSubmitting, sentRef } = useFormSubmission({
    loadingMessage: `Creating ${isYouTube ? "YouTube" : "quick"} blog...`,
    debugName: isYouTube ? "YouTubeBlog" : "QuickBlog",
    estimatedCost: cost.total,
    send,
  })

  useUnsavedChangesGuard(form.formState.isDirty, sentRef)

  const onSubmit = handleSubmit((data) => submit(toQuickBlogPayload(data)), onInvalidSubmit)

  const topic = values.topic?.trim() ?? ""
  const links = values.referenceLinks?.length ?? 0
  const keywordsDone =
    researching || (values.focusKeywords?.length > 0 && values.keywords?.length > 0)

  const readiness: ReadinessItem[] = isYouTube
    ? [
        {
          section: "videos",
          label: "YouTube video linked",
          done: links > 0,
          detail: links ? plural(links, "video") : undefined,
          fields: ["referenceLinks"],
        },
        {
          section: "videos",
          label: "Topic written",
          done: !!topic,
          detail: topic ? plural(topic.length, "char") : undefined,
          fields: ["topic"],
        },
      ]
    : [
        {
          section: "template",
          label: "Template chosen",
          done: !!values.template,
          detail: values.template ?? undefined,
          fields: ["template"],
        },
        {
          section: "basics",
          label: "Topic written",
          done: !!topic,
          detail: topic ? plural(topic.length, "char") : undefined,
          fields: ["topic"],
        },
        {
          section: "basics",
          label: researching ? "Keywords: AI research" : "Keywords added",
          done: !!keywordsDone,
          detail: keywordsDone ? keywordsSummary(values, researching) : undefined,
          fields: ["focusKeywords", "keywords", "referenceLinks"],
        },
      ]
  const sectionDone = (id: string) =>
    readiness.filter((item) => item.section === id).every((item) => item.done)

  const titleRule = values.options?.exactTitle ? "Exactly your topic" : "Written by AI"
  const fixedRows = [
    { label: "Writes with", value: modelSummary(QUICK_BLOG_FIXED.aiModel, true) },
    { label: "Images", value: imagesSummary(QUICK_BLOG_FIXED) },
  ]

  const exactTitleSwitch = <ToggleListField keys={["exactTitle"]} />
  const topicField = (
    <RHFTextField
      control={control}
      name="topic"
      label="Topic"
      required
      placeholder={isYouTube ? "What should the blog be about?" : "Enter the blog topic"}
    />
  )

  return (
    <FormProvider {...form}>
      <CreateFormShell
        title={`Generate ${isYouTube ? "YouTube" : "Quick"} Blog`}
        description={
          isYouTube
            ? "Turn YouTube videos into a blog post."
            : "A ready-to-edit blog from a topic in a couple of minutes."
        }
        onCancel={goBack}
        onSubmit={onSubmit}
        submitLabel="Generate blog"
        submittingLabel="Generating blog..."
        isSubmitting={isSubmitting}
        estimatedCost={cost.total}
        originalCost={originalCostOf(cost)}
        costLines={toCostLines(cost)}
        readiness={readiness}
        summaryRows={
          isYouTube
            ? [
                { label: "Videos", value: links ? plural(links, "video") : "—" },
                { label: "Topic", value: topic || "—" },
                { label: "Title", value: titleRule },
                { label: "Template", value: "Picked from the videos" },
                { label: "Keywords", value: "Picked from the videos" },
                ...fixedRows,
              ]
            : [
                { label: "Template", value: values.template ?? "—" },
                { label: "Topic", value: topic || "—" },
                { label: "Title", value: titleRule },
                { label: "Keywords", value: keywordsSummary(values, researching) },
                { label: "Reference links", value: links ? plural(links, "link") : "None" },
                ...fixedRows,
              ]
        }
      >
        {isYouTube ? (
          <FormSection
            id="videos"
            step={1}
            title="Videos & topic"
            description="The videos to write from, and what the blog is about"
            defaultOpen
            summary={links ? plural(links, "video") : "No videos yet"}
            complete={sectionDone("videos")}
            fields={["referenceLinks", "topic"]}
          >
            <RHFTagsField
              control={control}
              name="referenceLinks"
              label="YouTube video links"
              required
              max={BLOG_CONFIG.CONSTRAINTS.MAX_BLOG_REFERENCE_LINKS}
              validate={(link) => validateLink(link, "youtube")}
              placeholder="Paste a YouTube link and press Enter"
            />
            {topicField}
            {exactTitleSwitch}
            <p className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3.5 py-3 text-xs text-muted-foreground">
              <Sparkles className="mt-px size-3.5 shrink-0 text-primary" aria-hidden />
              {YT_AUTOMATIC}
            </p>
          </FormSection>
        ) : (
          <>
            <FormSection
              id="template"
              step={1}
              title="Template"
              description="How the blog is structured"
              summary={values.template ?? "Not selected"}
              complete={!!values.template}
              fields={["template"]}
              defaultOpen
            >
              <TemplatePickerField mode="single" name="template" />
            </FormSection>

            <FormSection
              id="basics"
              step={2}
              title="Basics"
              description="What the blog is about"
              defaultOpen
              summary={topic || "Not completed"}
              complete={sectionDone("basics")}
              fields={["topic", "keywords", "focusKeywords", "referenceLinks"]}
            >
              {topicField}

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

              {/* Hidden while research is on — it picks them, and the form stays short. */}
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

              <RHFTagsField
                control={control}
                name="referenceLinks"
                label="Reference links (max 3)"
                max={BLOG_CONFIG.CONSTRAINTS.MAX_BLOG_REFERENCE_LINKS}
                validate={(link) => validateLink(link, "reference")}
                placeholder="Enter full URLs (e.g., https://example.com)"
              />
            </FormSection>
          </>
        )}
      </CreateFormShell>
    </FormProvider>
  )
}
