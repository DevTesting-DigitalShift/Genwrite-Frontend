import { useCallback, useMemo } from "react"
import { Controller, FormProvider } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import useBlogStore from "@store/useBlogStore"
import {
  AdvancedConfigSection,
  AiImagesSection,
  CreateFormShell,
  DependentFields,
  FieldShell,
  fieldErrorId,
  type ReadinessItem,
  FormSection,
  type FormSummary,
  Watch,
  RHFTagsField,
  RHFTextField,
  RHFTextareaField,
  TemplatePickerField,
  ToggleListField,
  WritingStyleFields,
} from "@components/form"
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
  advancedBlogFormDefaults,
  advancedBlogFormSchema,
  toAdvancedBlogPayload,
  type AdvancedBlogFormValues,
} from "@/forms/advanced/advanced.schema"
import { useTitleGenerator } from "@/forms/advanced/useTitleGenerator"
import {
  estimateGenerationCost,
  getBlogPricing,
  toCostLines,
  useBlogPricing,
} from "@/forms/shared/cost"
import type { BlogPricing } from "@/data/pricingConfig"
import { validateLink } from "@/forms/shared/links"
import {
  countEnabled,
  imagesSummary,
  keywordsSummary,
  modelSummary,
  originalCostOf,
  plural,
} from "@/forms/shared/summary"
import type { CreateFormProps } from "./createForms.registry"

const advancedCost = (values: AdvancedBlogFormValues, pricing: BlogPricing) =>
  estimateGenerationCost(values, pricing, {
    features: values.isCheckedQuick ? ["quickSummary"] : [],
  })

/** Everything the rail shows. Runs in the shell, so the form root never watches its values. */
function useAdvancedSummary(): FormSummary {
  const values = useFormValues<AdvancedBlogFormValues>()
  const pricing = useBlogPricing()
  const cost = useMemo(() => advancedCost(values, pricing), [values, pricing])
  const researching = values.options?.performKeywordResearch
  const topic = values.topic?.trim() ?? ""
  const title = values.title?.trim() ?? ""
  const links = values.referenceLinks?.length ?? 0
  const keywordsDone =
    researching || (values.focusKeywords?.length > 0 && values.keywords?.length > 0 && !!title)
  const uploading = values.imageSource === "upload"
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
    values.isCheckedQuick,
  ])

  // Brand voice, publishing and uploads only become requirements once they're switched on.
  const readiness: ReadinessItem[] = [
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
      label: researching ? "Title & keywords: AI research" : "Title & keywords set",
      done: !!keywordsDone,
      detail: keywordsDone ? keywordsSummary(values, researching) : undefined,
      fields: ["focusKeywords", "keywords", "title"],
    },
    {
      section: "basics",
      label: "Writing style set",
      done: !!values.tone && !!values.languageToWrite,
      detail: values.tone,
      fields: ["tone", "userDefinedLength", "languageToWrite", "brief", "referenceLinks"],
    },
    ...(uploading
      ? [
          {
            section: "ai",
            label: "Images uploaded",
            done: (values.blogImages?.length ?? 0) > 0,
            fields: ["blogImages"],
          },
        ]
      : []),
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
    estimatedCost: cost.total,
    originalCost: originalCostOf(cost),
    costLines: toCostLines(cost),
    sections: {
      template: { summary: values.template ?? "Not selected", complete: !!values.template },
      basics: { summary: topic || "Not completed", complete: sectionDone("basics") },
    },
    readiness,
    summaryRows: [
      { label: "Template", value: values.template ?? "—" },
      { label: "Topic", value: topic || "—" },
      { label: "Title", value: researching ? "AI picks it" : title || "—" },
      { label: "Keywords", value: keywordsSummary(values, researching) },
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

/**
 * Advanced blog as a single page, in the four groups every create form uses: Template,
 * Basics (topic, title, keywords), AI & Images, and Advanced options for everything else —
 * tone/length/brief, reference links, the writing & SEO switches, brand voice and posting,
 * each under its own label.
 */
export default function AdvancedBlogForm({ prefill }: CreateFormProps) {
  const form = useZodForm(advancedBlogFormSchema, {
    ...advancedBlogFormDefaults,
    ...(prefill as Partial<AdvancedBlogFormValues> | undefined),
  })
  const { control, setValue, getValues, clearErrors, handleSubmit } = form
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const goBack = useCancelNavigation()
  const titles = useTitleGenerator(form)

  const send = useCallback(
    (payload: ReturnType<typeof toAdvancedBlogPayload>) =>
      // `createNewBlog` takes the multipart body as-is; `BlogAPI.create` splits out blogImages.
      useBlogStore.getState().createNewBlog({ blogData: payload as never, navigate, queryClient }),
    [navigate, queryClient]
  )

  const getEstimatedCost = useCallback(
    () => advancedCost(getValues() as AdvancedBlogFormValues, getBlogPricing()).total,
    [getValues]
  )

  const { submit, isSubmitting, sentRef } = useFormSubmission({
    loadingMessage: "Creating your blog...",
    debugName: "AdvancedBlog",
    getEstimatedCost,
    send,
  })

  useUnsavedChangesGuard(form.formState.isDirty, sentRef)

  const onSubmit = handleSubmit((data) => submit(toAdvancedBlogPayload(data)), onInvalidSubmit)

  return (
    <FormProvider {...form}>
      <CreateFormShell
        title="Generate Advanced Blog"
        description="Fine-tune every detail of a pro-level blog."
        onCancel={goBack}
        onSubmit={onSubmit}
        submitLabel="Generate blog"
        submittingLabel="Generating blog..."
        isSubmitting={isSubmitting}
        useSummary={useAdvancedSummary}
      >
        <FormSection
          id="template"
          step={1}
          title="Template"
          description="How the blog is structured"
          fields={["template"]}
          defaultOpen
        >
          <TemplatePickerField mode="single" name="template" />
        </FormSection>

        <FormSection
          id="basics"
          step={2}
          title="Basics"
          description="Topic, title, keywords and writing style"
          defaultOpen
          fields={[
            "topic",
            "focusKeywords",
            "keywords",
            "title",
            "referenceLinks",
            "tone",
            "userDefinedLength",
            "languageToWrite",
            "brief",
          ]}
        >
          <RHFTextField
            control={control}
            name="topic"
            label="Topic"
            required
            placeholder="e.g., Tech Blog"
          />

          <ToggleListField
            keys={["performKeywordResearch"]}
            onToggle={{
              performKeywordResearch: (checked) => {
                if (!checked) return
                clearErrors(["focusKeywords", "keywords", "title"])
              },
            }}
            descriptions={{ performKeywordResearch: "AI picks the title and keywords for you." }}
          />

          <Watch<boolean | undefined> name="options.performKeywordResearch">
            {(researching) => (
              <DependentFields
                enabled={!researching}
                hint="Keyword research will pick these for you — turn it off to enter your own."
              >
                <RHFTagsField
                  control={control}
                  name="focusKeywords"
                  label="Focus keywords (max 3)"
                  required
                  max={BLOG_CONFIG.CONSTRAINTS.MAX_FOCUS_KEYWORDS}
                  placeholder="Enter keywords (comma, tab, or newline separated)"
                />
                <RHFTagsField
                  control={control}
                  name="keywords"
                  label="Keywords"
                  required
                  placeholder="Enter keywords (comma, tab, or newline separated)"
                />

                <Controller
                  control={control}
                  name="title"
                  render={({ field, fieldState }) => (
                    <FieldShell
                      htmlFor="title"
                      label="Blog title"
                      required
                      description="The headline of your blog. Type it, or generate ideas with AI."
                      error={fieldState.error?.message}
                    >
                      <div className="flex gap-2">
                        <input
                          id="title"
                          {...field}
                          aria-invalid={!!fieldState.error}
                          aria-describedby={fieldState.error ? fieldErrorId("title") : undefined}
                          placeholder="e.g., How to create a blog"
                          className="input input-bordered h-10 w-full rounded-md text-sm aria-invalid:border-destructive"
                        />
                        <button
                          type="button"
                          onClick={titles.generate}
                          disabled={titles.isGenerating}
                          className="shrink-0 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
                        >
                          {titles.isGenerating ? "Generating..." : "Generate"}
                        </button>
                      </div>
                      {titles.titles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {titles.titles.map((suggestion) => (
                            <button
                              type="button"
                              key={suggestion}
                              onClick={() => {
                                setValue("title", suggestion, { shouldDirty: true })
                                clearErrors("title")
                              }}
                              className={`rounded-md border px-3 py-1 text-xs transition ${
                                field.value === suggestion
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background hover:bg-muted"
                              }`}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </FieldShell>
                  )}
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
            placeholder="Add reference links"
          />

          <WritingStyleFields fields={["tone", "length", "language"]} />
          <RHFTextareaField
            control={control}
            name="brief"
            label="Brief"
            placeholder="Enter the brief info or instructions"
          />
        </FormSection>

        <AiImagesSection step={3} allowUpload />

        <AdvancedConfigSection
          step={4}
          seoExtra={[
            {
              name: "isCheckedQuick",
              label: "Add a quick summary",
              description: "Generate a concise summary for the readers",
            },
          ]}
        />
      </CreateFormShell>
    </FormProvider>
  )
}
