import { Controller, useFormContext } from "react-hook-form"
import type { FieldValues } from "react-hook-form"
import { Slider } from "@components/ui/slider"
import { FieldShell } from "../fields"
import { BLOG_CONFIG } from "@/data/blogConfig"
import { LANGUAGES, TONES } from "@/data/blogData"

type WritingField = "language" | "tone" | "length"

/** Language, tone and word-count controls; each form lists the ones it offers. */
export function WritingStyleFields({
  fields = ["language", "tone", "length"],
}: {
  fields?: readonly WritingField[]
}) {
  const { control } = useFormContext<FieldValues>()

  return (
    <div className="space-y-4">
      {fields.includes("language") && (
        <Controller
          control={control}
          name="languageToWrite"
          render={({ field, fieldState }) => (
            <FieldShell
              htmlFor="languageToWrite"
              label="Language"
              required
              error={fieldState.error?.message}
            >
              <select
                id="languageToWrite"
                {...field}
                aria-invalid={!!fieldState.error}
                className="select select-bordered h-10 min-h-0 w-full rounded-lg text-sm"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </FieldShell>
          )}
        />
      )}

      {fields.includes("tone") && (
        <Controller
          control={control}
          name="tone"
          render={({ field, fieldState }) => (
            <FieldShell
              htmlFor="tone"
              label="Tone of voice"
              required
              description="Primary communication style"
              error={fieldState.error?.message}
            >
              <select
                id="tone"
                {...field}
                aria-invalid={!!fieldState.error}
                className="select select-bordered h-10 min-h-0 w-full rounded-lg text-sm"
              >
                {TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </FieldShell>
          )}
        />
      )}

      {fields.includes("length") && (
        <Controller
          control={control}
          name="userDefinedLength"
          render={({ field }) => (
            <FieldShell
              label="Blog length"
              description="Approximate target word count"
              error={undefined}
            >
              <div className="flex items-center gap-4">
                <Slider
                  aria-label="Blog length in words"
                  min={BLOG_CONFIG.LENGTH.MIN}
                  max={BLOG_CONFIG.LENGTH.MAX}
                  step={BLOG_CONFIG.LENGTH.STEP}
                  value={[field.value ?? BLOG_CONFIG.LENGTH.DEFAULT]}
                  onValueChange={(v) => field.onChange(v[0])}
                  className="w-full"
                />
                <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                  {field.value} words
                </span>
              </div>
            </FieldShell>
          )}
        />
      )}
    </div>
  )
}
