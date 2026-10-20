import { useCallback } from "react"
import { FormProvider } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { blogsQuery } from "@api/Blog/Blog.query"
import {
  CreateFormShell,
  FormSection,
  RHFTagsField,
  RHFTextField,
  TemplatePickerField,
  TitleField,
  WritingStyleFields,
  type FormSummary,
  type ReadinessItem,
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
  simpleBlogFormDefaults,
  simpleBlogFormSchema,
  toSimpleBlogPayload,
  type SimpleBlogFormValues,
} from "@/forms/simple/simple.schema"
import { useTitleGenerator } from "@/forms/advanced/useTitleGenerator"
import { keywordsSummary, plural } from "@/forms/shared/summary"

/** Everything the rail shows. Runs in the shell, so the form root never watches its values. */
function useSimpleSummary(): FormSummary {
  const values = useFormValues<SimpleBlogFormValues>()
  const topic = values.topic?.trim() ?? ""
  const title = values.title?.trim() ?? ""
  const keywordsDone = values.focusKeywords?.length > 0 && values.keywords?.length > 0

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
      label: "Keywords added",
      done: keywordsDone,
      detail: keywordsDone ? keywordsSummary(values, false) : undefined,
      fields: ["focusKeywords", "keywords"],
    },
    {
      section: "basics",
      label: "Title set",
      done: !!title,
      detail: title || undefined,
      fields: ["title"],
    },
  ]
  const sectionDone = (id: string) =>
    readiness.filter((item) => item.section === id).every((item) => item.done)

  return {
    readiness,
    sections: {
      template: { summary: values.template ?? "Not selected", complete: !!values.template },
      basics: { summary: topic || "Not completed", complete: sectionDone("basics") },
    },
    summaryRows: [
      { label: "Template", value: values.template ?? "—" },
      { label: "Topic", value: topic || "—" },
      { label: "Title", value: title || "—" },
      { label: "Keywords", value: keywordsSummary(values, false) },
      { label: "Tone · length", value: `${values.tone} · ~${values.userDefinedLength} words` },
    ],
  }
}

/**
 * Simple blog as a single page, in the groups every create form uses: Template, then Basics
 * (topic, keywords, title, tone and length). It is free — the blog is opened in the editor
 * for the user to write — so the rail shows no cost and the submit does no balance check.
 */
export default function SimpleBlogForm() {
  const form = useZodForm(simpleBlogFormSchema, simpleBlogFormDefaults)
  const { control, handleSubmit } = form
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const goBack = useCancelNavigation()
  const titles = useTitleGenerator(form)

  const send = useCallback(
    async (payload: ReturnType<typeof toSimpleBlogPayload>) => {
      const created = await blogsQuery.createSimple(payload)
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
      toast.success("Blog created successfully")
      navigate(`/blog-editor/${created._id}`)
    },
    [navigate, queryClient]
  )

  const { submit, isSubmitting, sentRef } = useFormSubmission({
    loadingMessage: "Creating your blog...",
    debugName: "ManualBlog",
    send,
  })

  useUnsavedChangesGuard(form.formState.isDirty, sentRef)

  const onSubmit = handleSubmit((data) => submit(toSimpleBlogPayload(data)), onInvalidSubmit)

  return (
    <FormProvider {...form}>
      <CreateFormShell
        title="Create Simple Blog"
        description="Set up a blog and write it yourself in the editor."
        onCancel={goBack}
        onSubmit={onSubmit}
        submitLabel="Create blog"
        submittingLabel="Creating blog..."
        isSubmitting={isSubmitting}
        useSummary={useSimpleSummary}
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
          description="Topic, keywords, title and writing style"
          defaultOpen
          fields={["topic", "focusKeywords", "keywords", "title", "tone", "userDefinedLength"]}
        >
          <RHFTextField
            control={control}
            name="topic"
            label="Topic"
            required
            placeholder="Enter blog topic..."
          />
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
          <TitleField titles={titles} />
          <WritingStyleFields fields={["tone", "length"]} />
        </FormSection>
      </CreateFormShell>
    </FormProvider>
  )
}
