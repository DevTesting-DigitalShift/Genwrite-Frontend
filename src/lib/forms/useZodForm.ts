import { useMemo } from "react"
import { useForm } from "react-hook-form"
import type {
  DefaultValues,
  FieldValues,
  Resolver,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"

/**
 * `useForm` wired to a zod schema, with the defaults these forms all want:
 * validate on submit, then keep re-validating a field once it has an error so a
 * fix clears the message as the user types.
 *
 * The generic is the schema's *input* type — the shape react-hook-form actually
 * holds — which is what lets a form schema carry UI-only fields (tag inputs,
 * step flags) that the payload never sees.
 */
export function useZodForm<TSchema extends z.ZodType<FieldValues, FieldValues>>(
  schema: TSchema,
  defaultValues: DefaultValues<z.input<TSchema>>,
  options?: Omit<UseFormProps<z.input<TSchema>>, "resolver" | "defaultValues">
): UseFormReturn<z.input<TSchema>> {
  // `zodResolver` builds a closure per call; memoising keeps the resolver stable
  // across renders so RHF doesn't re-run validation for a new function identity.
  const resolver = useMemo(
    () => zodResolver(schema) as unknown as Resolver<z.input<TSchema>>,
    [schema]
  )

  return useForm<z.input<TSchema>>({
    resolver,
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    ...options,
  })
}
