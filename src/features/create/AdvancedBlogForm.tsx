import { useCallback } from "react"
import { Controller, FormProvider, useWatch } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import useBlogStore from "@store/useBlogStore"
import {
  AiModelFields,
  BrandVoiceField,
  CreateFormShell,
  FieldShell,
  FormSection,
  ImageSettingsFields,
  PostingFields,
  RHFTagsField,
  RHFTextField,
  RHFTextareaField,
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
  advancedBlogFormDefaults,
  advancedBlogFormSchema,
  toAdvancedBlogPayload,
  type AdvancedBlogFormValues,
} from "@/forms/advanced/advanced.schema"
import { useTitleGenerator } from "@/forms/advanced/useTitleGenerator"
import { toCostLines, useGenerationCostBreakdown } from "@/forms/shared/cost"
import { validateLink } from "@/forms/shared/links"
import type { CreateFormProps } from "./createForms.registry"

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
  const { control, setValue, clearErrors, handleSubmit } = form
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const goBack = useCancelNavigation()
  const titles = useTitleGenerator(form)

  const values = useWatch({ control }) as AdvancedBlogFormValues
  const researching = values.options?.performKeywordResearch
  const cost = useGenerationCostBreakdown(values, {
    features: values.isCheckedQuick ? ["quickSummary"] : [],
  })

  const send = useCallback(
    (payload: ReturnType<typeof toAdvancedBlogPayload>) =>
      // `createNewBlog` takes the multipart body as-is; `BlogAPI.create` splits out blogImages.
      useBlogStore.getState().createNewBlog({ blogData: payload as never, navigate, queryClient }),
    [navigate, queryClient]
  )

  const { submit, isSubmitting, sentRef } = useFormSubmission({
    loadingMessage: "Creating your blog...",
    debugName: "AdvancedBlog",
    estimatedCost: cost.total,
    send,
  })

  useUnsavedChangesGuard(form.formState.isDirty, sentRef)

  const onSubmit = handleSubmit(
    (data) => submit(toAdvancedBlogPayload(data)),
    () => toast.error("Please fill all required fields correctly.")
  )

  return (
    <FormProvider {...form}>
      <CreateFormShell
        title="Generate Advanced Blog"
        description="Fine-tune every detail of a pro-level blog."
        onCancel={goBack}
        onSubmit={onSubmit}
        submitLabel="Generate blog"
        isSubmitting={isSubmitting}
        estimatedCost={cost.total}
        costNote={values.costCutter ? "(-50% off)" : undefined}
        costLines={toCostLines(cost)}
        selectionSummary={values.template ?? undefined}
      >
        <FormSection title="Template" fields={["template"]} defaultOpen>
          <TemplatePickerField mode="single" name="template" />
        </FormSection>

        <FormSection
          title="Basics"
          defaultOpen
          fields={["topic", "focusKeywords", "keywords", "title", "referenceLinks"]}
        >
          <RHFTextField control={control} name="topic" label="Topic" required placeholder="e.g., Tech Blog" />

          <ToggleListField
            keys={["exactTitle", "performKeywordResearch"]}
            onToggle={{
              performKeywordResearch: (checked) => {
                if (checked) clearErrors(["focusKeywords", "keywords", "title"])
              },
            }}
            descriptions={{
              performKeywordResearch: "AI picks the title and keywords for you.",
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
                        placeholder="e.g., How to create a blog"
                        className="input input-bordered h-10 w-full rounded-md text-sm"
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
            </>
          )}

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

        <FormSection
          title="AI & images"
          description="Model, cost cutter and image source"
          fields={["aiModel", "imageSource", "numberOfImages", "blogImages"]}
        >
          <AiModelFields />
          <ImageSettingsFields allowUpload />
        </FormSection>

        <FormSection
          title="Advanced options"
          description="Content switches, brand voice and posting"
          fields={["brandId", "postingDefaultType"]}
        >
          <SubGroup label="Writing style">
            <ToggleListField keys={["easyToUnderstand", "humanisation", "extendedThinking", "deepResearch"]} />
          </SubGroup>

          <SubGroup label="Content">
            <ToggleListField
              keys={["includeFaqs", "includeTableOfContents", "embedYouTubeVideos"]}
              extra={[
                {
                  name: "isCheckedQuick",
                  label: "Add a quick summary",
                  description: "Generate a concise summary for the readers",
                },
              ]}
            />
          </SubGroup>

          <SubGroup label="SEO & research">
            <ToggleListField keys={["includeInterlinks", "addOutBoundLinks", "includeCompetitorResearch"]} />
          </SubGroup>

          <SubGroup label="Brand voice">
            <BrandVoiceField />
          </SubGroup>

          <SubGroup label="Posting">
            <PostingFields />
          </SubGroup>
        </FormSection>
      </CreateFormShell>
    </FormProvider>
  )
}
