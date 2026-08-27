import { useState } from "react"
import type { ChangeEvent, KeyboardEvent } from "react"
import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { Controller } from "react-hook-form"
import { X } from "lucide-react"
import { Input } from "@components/ui/input"
import { Badge } from "@components/ui/badge"
import { FieldShell } from "./FieldShell"

interface RHFTagsFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label?: string
  required?: boolean
  description?: string
  placeholder?: string
  className?: string
}

/**
 * Generic string[] chip input (type + Enter/comma to add) wired to react-hook-form —
 * the keyword/tag entry pattern used by brand keywords, blog keywords, and campaign
 * target keywords alike, consolidated into one reusable field.
 */
export function RHFTagsField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  placeholder = "Type and press Enter",
  className,
}: RHFTagsFieldProps<TFieldValues>) {
  const [draft, setDraft] = useState("")

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const tags: string[] = field.value ?? []

        const commit = () => {
          const next = draft
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t && !tags.some((existing) => existing.toLowerCase() === t.toLowerCase()))
          if (next.length) field.onChange([...tags, ...next])
          setDraft("")
        }

        const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            commit()
          }
        }

        const removeTag = (tag: string) => field.onChange(tags.filter((t) => t !== tag))

        return (
          <FieldShell
            htmlFor={name}
            label={label}
            required={required}
            description={description}
            error={fieldState.error?.message}
            className={className}
          >
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-transparent p-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 rounded-full hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <Input
                id={name}
                value={draft}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={commit}
                placeholder={tags.length ? "" : placeholder}
                className="h-7 flex-1 min-w-24 border-none shadow-none focus-visible:ring-0 px-1"
              />
            </div>
          </FieldShell>
        )
      }}
    />
  )
}
