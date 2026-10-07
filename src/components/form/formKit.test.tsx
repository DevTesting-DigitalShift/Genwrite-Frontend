import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { FormProvider, useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { FormSection } from "./FormSection"
import { ToggleListField } from "./ToggleListField"
import { RHFTagsField } from "./fields"

// Radix switches measure themselves; jsdom has no ResizeObserver.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)

vi.mock("sonner", () => ({ toast: { error: vi.fn(), warning: vi.fn() } }))

function Harness({
  onSubmit = () => {},
  max,
}: {
  onSubmit?: (values: unknown) => void
  max?: number
}) {
  const form = useForm({
    defaultValues: { keywords: [] as string[], options: { includeFaqs: false } },
  })
  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () => {})}
        // Simulates a schema failing on a field that lives in a closed section.
        data-testid="form"
      >
        <button type="button" onClick={() => form.setError("keywords", { message: "Need one" })}>
          fail
        </button>
        <FormSection title="Hidden section" fields={["keywords"]}>
          <RHFTagsField control={form.control} name="keywords" label="Keywords" max={max} />
          <ToggleListField keys={["includeFaqs"]} />
        </FormSection>
        <button type="submit">save</button>
      </form>
    </FormProvider>
  )
}

describe("FormSection", () => {
  it("starts closed, stays mounted, and opens itself when a field inside has an error", async () => {
    const { container } = render(<Harness />)
    const details = container.querySelector("details") as HTMLDetailsElement
    expect(details.open).toBe(false)
    // Body is mounted even while closed, so its fields stay registered with the form.
    expect(screen.getByLabelText("Keywords")).toBeTruthy()

    fireEvent.click(screen.getByText("fail"))
    await waitFor(() => expect(details.open).toBe(true))
    expect(screen.getByText("1 to fix")).toBeTruthy()
  })
})

describe("RHFTagsField", () => {
  it("commits typed, pasted and half-typed text, de-duplicated", async () => {
    const submit = vi.fn()
    render(<Harness onSubmit={submit} />)
    const input = screen.getByLabelText("Keywords")

    fireEvent.change(input, { target: { value: "seo" } })
    fireEvent.keyDown(input, { key: "Enter" })
    fireEvent.paste(input, { clipboardData: { getData: () => "blogs, SEO\nai" } })
    fireEvent.change(input, { target: { value: "unsent" } })
    fireEvent.blur(input)

    await waitFor(() => expect(screen.getByText("unsent")).toBeTruthy())
    expect(screen.getByText("seo")).toBeTruthy()
    expect(screen.getByText("blogs")).toBeTruthy()
    expect(screen.getByText("ai")).toBeTruthy()
    expect(screen.queryAllByText(/^seo$/i)).toHaveLength(1)

    await act(async () => {
      fireEvent.click(screen.getByText("save"))
    })
    await waitFor(() => expect(submit).toHaveBeenCalled())
    expect(submit.mock.calls[0][0]).toMatchObject({ keywords: ["seo", "blogs", "ai", "unsent"] })
  })

  it("stops at max and says so", async () => {
    render(<Harness max={2} />)
    const input = screen.getByLabelText("Keywords")
    fireEvent.paste(input, { clipboardData: { getData: () => "a,b,c" } })
    await waitFor(() => expect(screen.getByText(/only add up to 2/i)).toBeTruthy())
    expect(screen.queryByText("c")).toBeNull()
  })
})

describe("ToggleListField", () => {
  it("renders the shared copy for each key", () => {
    render(<Harness />)
    expect(screen.getByText("Include FAQs")).toBeTruthy()
  })
})
