import { describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { z } from "zod"
import { useZodForm } from "./useZodForm"

/**
 * These forms drive every input through `setValue` rather than `register`, because
 * the markup predates react-hook-form and had to stay byte-for-byte the same. That
 * only works if unregistered fields still take part in `watch`, `trigger` and
 * `handleSubmit` — which is what this pins down.
 */
const schema = z
  .object({
    topic: z.string().min(1, "Topic is required"),
    tags: z.array(z.string()),
    nested: z.object({ flag: z.boolean() }),
    uiOnly: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.nested.flag && values.tags.length === 0) {
      ctx.addIssue({ path: ["tags"], code: "custom", message: "Add a tag" })
    }
  })

const defaults = { topic: "", tags: [], nested: { flag: false }, uiOnly: "" }

/**
 * `formState` is a proxy that only starts re-rendering for the parts a component
 * actually reads, so the hook under test has to read `errors` during render the
 * same way the modals do.
 */
const renderForm = () =>
  renderHook(() => {
    const form = useZodForm(schema, defaults)
    void form.formState.errors
    return form
  })

describe("useZodForm", () => {
  it("reflects setValue on fields that were never registered", () => {
    const { result } = renderForm()

    act(() => {
      result.current.setValue("topic", "Cold brew")
      result.current.setValue("nested.flag", true)
    })

    expect(result.current.watch().topic).toBe("Cold brew")
    expect(result.current.watch().nested.flag).toBe(true)
  })

  it("validates only the fields passed to trigger", async () => {
    const { result } = renderForm()

    let valid: boolean | undefined
    await act(async () => {
      valid = await result.current.trigger(["tags"])
    })
    expect(valid).toBe(true)
    expect(result.current.formState.errors.topic).toBeUndefined()

    await act(async () => {
      valid = await result.current.trigger(["topic"])
    })
    expect(valid).toBe(false)
    expect(result.current.formState.errors.topic?.message).toBe("Topic is required")
  })

  it("applies cross-field rules and clears them when the cause is fixed", async () => {
    const { result } = renderForm()

    await act(async () => {
      result.current.setValue("nested.flag", true)
      await result.current.trigger(["tags"])
    })
    expect(result.current.formState.errors.tags?.message).toBe("Add a tag")

    await act(async () => {
      result.current.setValue("tags", ["seo"], { shouldValidate: true })
    })
    expect(result.current.formState.errors.tags).toBeUndefined()
  })

  it("reports a field's error state by name, registered or not", async () => {
    const { result } = renderForm()

    expect(result.current.getFieldState("topic").error).toBeUndefined()

    await act(async () => {
      await result.current.trigger(["topic"])
    })
    expect(result.current.getFieldState("topic").error?.message).toBe("Topic is required")
  })

  it("writing a field does not raise an error until something asks for validation", () => {
    // A child component can write a default on mount (the template grid does); that
    // must not light the field up red before the user has done anything.
    const { result } = renderForm()

    act(() => {
      result.current.setValue("topic", "", { shouldValidate: false })
    })

    expect(result.current.formState.errors.topic).toBeUndefined()
  })

  it("hands the submit handler the complete values, UI-only fields included", async () => {
    const { result } = renderForm()
    const seen: unknown[] = []

    act(() => {
      result.current.setValue("topic", "Cold brew")
      result.current.setValue("uiOnly", "half typed")
    })

    await act(async () => {
      await result.current.handleSubmit((values: any) => {
        seen.push(values)
      })()
    })

    expect(seen).toEqual([
      { topic: "Cold brew", tags: [], nested: { flag: false }, uiOnly: "half typed" },
    ])
  })

  it("does not call the submit handler when the schema rejects the values", async () => {
    const { result } = renderForm()
    let called = false

    await act(async () => {
      await result.current.handleSubmit(() => {
        called = true
      })()
    })

    expect(called).toBe(false)
    expect(result.current.formState.errors.topic?.message).toBe("Topic is required")
  })
})
