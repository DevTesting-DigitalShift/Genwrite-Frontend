import { Controller, useFormContext } from "react-hook-form"
import type { FieldValues } from "react-hook-form"
import { FieldShell, fieldErrorId } from "../fields"

interface TitleFieldProps {
  /** From `useTitleGenerator`. */
  titles: { titles: string[]; isGenerating: boolean; generate: () => void }
}

/** The `title` input with an AI "Generate" button and the suggestions it returns as chips. */
export function TitleField({ titles }: TitleFieldProps) {
  const { control, setValue, clearErrors } = useFormContext<FieldValues>()

  return (
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
  )
}
