import { useDeferredValue } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import type { FieldValues } from "react-hook-form"

/**
 * Every field value of the enclosing form, deferred so typing stays instant while the summary
 * rail, checklist and cost catch up a frame later. Call it from the leaf that renders those
 * (the shell's summary hook) — never from the form root, which would re-render all sections.
 */
export function useFormValues<TValues extends FieldValues>(): TValues {
  const { control } = useFormContext<TValues>()
  return useDeferredValue(useWatch({ control }) as TValues)
}
