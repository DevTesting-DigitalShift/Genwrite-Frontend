import type { z } from "zod"

/**
 * Payload plumbing shared by every form that talks to the API.
 *
 * The rule this file exists to enforce: **a form's state is not its payload.**
 * Forms carry UI-only state (raw tag inputs, step flags, template ids, "enable
 * advanced" switches) that must never reach the backend, and they carry fields
 * that are only meaningful when some other field is on (a brandId only matters
 * when brand voice is enabled). Every form therefore declares two things:
 *
 *   1. a *form schema* — what react-hook-form validates, UI-only fields included;
 *   2. a *payload schema* + a `to<Form>Payload()` mapper — the wire contract.
 *
 * `buildPayload` is the single door between the two. Anything the payload schema
 * does not declare is dropped, and any key the mapper resolves to `undefined` is
 * removed rather than sent as `null`/`""`. So dropping a field from the request
 * is a one-line change (return `undefined` for it, or delete it from the payload
 * schema) and adding one cannot be forgotten halfway.
 */

/** Values that a mapper may produce for a payload key. */
type Json = unknown

/**
 * Recursively removes keys whose value is `undefined`, so an omitted optional
 * field is simply absent from the request body instead of arriving as `null`.
 * Arrays keep their positions; `File`/`Blob` and other class instances are left
 * untouched so multipart uploads survive the trip.
 */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T
  }

  if (value && typeof value === "object" && (value as object).constructor === Object) {
    const out: Record<string, Json> = {}
    for (const [key, item] of Object.entries(value as Record<string, Json>)) {
      if (item === undefined) continue
      out[key] = stripUndefined(item)
    }
    return out as unknown as T
  }

  return value
}

/** Thrown when a mapped payload does not satisfy its own payload schema. */
export class PayloadValidationError extends Error {
  readonly issues: z.core.$ZodIssue[]

  constructor(formName: string, issues: z.core.$ZodIssue[]) {
    const detail = issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ")
    super(`${formName} payload is invalid — ${detail}`)
    this.name = "PayloadValidationError"
    this.issues = issues
  }
}

export type PayloadResult<T> =
  | { success: true; data: T }
  | { success: false; error: PayloadValidationError }

/**
 * Validates a mapped payload against its schema and returns the wire object.
 *
 * Unknown keys are stripped by zod, `undefined` keys are stripped by
 * {@link stripUndefined}, and defaults declared on the payload schema are filled
 * in — so the returned object is exactly what the API should receive.
 */
export function safeBuildPayload<S extends z.ZodType>(
  formName: string,
  schema: S,
  values: unknown
): PayloadResult<z.output<S>> {
  const result = schema.safeParse(values)

  if (!result.success) {
    const error = new PayloadValidationError(formName, result.error.issues)
    console.error(`[payload] ${formName} failed validation`, result.error.issues)
    return { success: false, error }
  }

  return { success: true, data: stripUndefined(result.data) }
}

/** {@link safeBuildPayload}, but throws instead of returning a result object. */
export function buildPayload<S extends z.ZodType>(
  formName: string,
  schema: S,
  values: unknown
): z.output<S> {
  const result = safeBuildPayload(formName, schema, values)
  if (!result.success) throw result.error
  return result.data
}

/**
 * Include a value only when a condition holds. Reads better than a ternary in a
 * payload mapper and pairs with {@link stripUndefined}: the key disappears when
 * the condition is false.
 *
 * ```ts
 * brandId: includeIf(values.isCheckedBrand, values.brandId),
 * ```
 */
export function includeIf<T>(condition: unknown, value: T): T | undefined {
  return condition ? value : undefined
}
