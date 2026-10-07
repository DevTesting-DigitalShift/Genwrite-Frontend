import { useCallback } from "react"
import { get, useFormContext, useFormState, useWatch } from "react-hook-form"
import type { FieldValues } from "react-hook-form"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import type { BlogTemplate } from "@components/multipleStepModal/TemplateSelection"
import useAuthStore from "@store/useAuthStore"

interface TemplatePickerFieldProps {
  /** Single-template forms store a string; multi-template forms (bulk, job) an array. */
  mode: "single" | "multiple"
  /** Form field holding the template name(s): `template` or `templates`. */
  name: "template" | "templates"
  /** How many may be picked in `multiple` mode. */
  max?: number
}

const sameList = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Template grid bound to the form. The grid tracks selection by numeric id, so the ids live
 * in a form-only `templateIds` field next to the name(s) the API actually receives.
 *
 * `TemplateSelection` re-runs its `onClick` effect whenever the callback's identity changes
 * and once on mount, so `handleSelect` must be stable and must not write (or re-validate)
 * when nothing changed — otherwise showing an error would loop through validation forever.
 */
export function TemplatePickerField({ mode, name, max = 1 }: TemplatePickerFieldProps) {
  const { control, setValue, getValues, getFieldState } = useFormContext<FieldValues>()
  const plan = useAuthStore((s) => s.user?.subscription?.plan) ?? "free"
  const templateIds = useWatch({ control, name: "templateIds" }) as number[] | undefined
  const { errors } = useFormState({ control })
  const error = (get(errors, name)?.message ?? get(errors, "templateIds")?.message) as
    | string
    | undefined

  const handleSelect = useCallback(
    (templates: BlogTemplate[]) => {
      const names = templates.map((t) => t.name)
      const nextName = mode === "single" ? (names[0] ?? null) : names
      const nextIds = templates.map((t) => t.id)

      if (!sameList(getValues(name), nextName)) {
        setValue(name, nextName, {
          shouldDirty: true,
          // Only re-check once the user is already looking at an error for this field.
          shouldValidate: !!getFieldState(name).error,
        })
      }
      if (!sameList(getValues("templateIds"), nextIds)) {
        setValue("templateIds", nextIds, { shouldDirty: true })
      }
    },
    [mode, name, getValues, setValue, getFieldState]
  )

  return (
    <TemplateSelection
      userSubscriptionPlan={plan}
      numberOfSelection={mode === "single" ? 1 : max}
      preSelectedIds={templateIds ?? []}
      error={error}
      onClick={handleSelect}
    />
  )
}
