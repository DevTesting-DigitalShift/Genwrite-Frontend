import type { FieldValues } from "react-hook-form"
import { useFormContext } from "react-hook-form"
import { RHFSwitchField } from "./fields"
import { GENERATION_TOGGLE_BY_KEY, type GenerationOptionKey } from "@/forms/shared/options"

/** A toggle that isn't one of the shared `options.*` keys — e.g. a form-specific switch like
 * the advanced blog's "quick summary" — rendered in the same row style as the rest. */
export interface ExtraToggle {
  /** Full form path, since it may not live under `options`. */
  name: string
  label: string
  description?: string
  onValueChange?: (checked: boolean) => void
}

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
  /** Toggles outside the `options` registry, appended to the same list in the same style. */
  extra?: ExtraToggle[]
}

/**
 * The boolean-toggle list shared by every generation form (previously `AdvancedOptions`,
 * which each modal drove through its own `formData` / `updateFormData` plumbing). Reads and
 * writes through the surrounding `FormProvider`, so adding a toggle to a form is one key in
 * the `keys` array. Every switch in a form — whether it lives under `options` or not — renders
 * through this one row style, so nothing reads as a one-off.
 */
export function ToggleListField({
  keys,
  basePath = "options",
  onToggle,
  labels,
  descriptions,
  extra,
}: ToggleListFieldProps) {
  const { control } = useFormContext<FieldValues>()
  const rowClassName =
    "px-3.5 py-3 transition-colors hover:bg-muted/40 first:rounded-t-xl last:rounded-b-xl"

  return (
    <div className="divide-y divide-border/70 rounded-xl border border-border/70">
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
            className={rowClassName}
          />
        )
      })}
      {extra?.map((toggle) => (
        <RHFSwitchField
          key={toggle.name}
          control={control}
          name={toggle.name}
          label={toggle.label}
          description={toggle.description}
          onValueChange={toggle.onValueChange}
          className={rowClassName}
        />
      ))}
    </div>
  )
}
