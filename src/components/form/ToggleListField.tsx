import type { FieldValues } from "react-hook-form"
import { useFormContext } from "react-hook-form"
import { RHFSwitchField } from "./fields"
import {
  GENERATION_TOGGLE_BY_KEY,
  type GenerationOptionKey,
} from "@/forms/shared/options"

interface ToggleListFieldProps {
  /** Which toggles this form offers, in display order. Copy comes from `GENERATION_TOGGLES`. */
  keys: readonly GenerationOptionKey[]
  /** Form path of the options object. */
  basePath?: string
  /** Per-key side effects, e.g. keyword research clearing the manual keyword lists. */
  onToggle?: Partial<Record<GenerationOptionKey, (checked: boolean) => void>>
  /** Per-key copy overrides for the odd form that words a toggle differently. */
  labels?: Partial<Record<GenerationOptionKey, string>>
  descriptions?: Partial<Record<GenerationOptionKey, string>>
}

/**
 * The boolean-toggle list shared by every generation form (previously `AdvancedOptions`,
 * which each modal drove through its own `formData` / `updateFormData` plumbing). Reads and
 * writes through the surrounding `FormProvider`, so adding a toggle to a form is one key in
 * the `keys` array.
 */
export function ToggleListField({
  keys,
  basePath = "options",
  onToggle,
  labels,
  descriptions,
}: ToggleListFieldProps) {
  const { control } = useFormContext<FieldValues>()

  return (
    <div className="space-y-3">
      {keys.map((key) => {
        const def = GENERATION_TOGGLE_BY_KEY[key]
        if (!def) return null
        return (
          <RHFSwitchField
            key={key}
            control={control}
            name={`${basePath}.${key}`}
            label={labels?.[key] ?? def.label}
            description={descriptions?.[key] ?? def.description}
            onValueChange={onToggle?.[key]}
          />
        )
      })}
    </div>
  )
}
