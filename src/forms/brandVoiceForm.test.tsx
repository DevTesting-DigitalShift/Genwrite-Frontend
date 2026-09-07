import { useEffect, useRef, useState } from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useZodForm } from "@/lib/forms"
import { brandVoiceFormDefaults, brandVoiceFormSchema } from "@/forms/brandVoiceForm"

/**
 * Mirrors how the Brand Voice page drives this form: values go in through
 * `setValue`, Save is a plain button wired to `handleSubmit`, and each message is
 * rendered from `errors.<field>?.message`.
 */
function Harness({ resetOnMount = false }: { resetOnMount?: boolean }) {
  const {
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors },
  } = useZodForm(brandVoiceFormSchema, brandVoiceFormDefaults)

  const values = watch()

  // The page clears the form on mount, and again whenever the brand list changes.
  const [brands, setBrands] = useState<unknown[]>([])
  const resetForm = () => reset({ ...brandVoiceFormDefaults, selectedVoice: brands[0] ?? null })
  const resetFormRef = useRef(resetForm)
  resetFormRef.current = resetForm

  useEffect(() => {
    if (resetOnMount && !values._id) resetFormRef.current()
  }, [resetOnMount, values._id])

  return (
    <div>
      <input
        aria-label="postLink"
        value={values.postLink}
        onChange={(e) => setValue("postLink", e.target.value)}
      />
      {errors.postLink?.message && <p>postLink: {errors.postLink.message}</p>}
      {errors.nameOfVoice?.message && <p>nameOfVoice: {errors.nameOfVoice.message}</p>}
      {errors.keywords?.message && <p>keywords: {errors.keywords.message}</p>}
      {errors.sitemapUrl?.message && <p>sitemapUrl: {errors.sitemapUrl.message}</p>}
      {errors.describeBrand?.message && <p>describeBrand: {errors.describeBrand.message}</p>}
      {errors.persona?.message && <p>persona: {errors.persona.message}</p>}
      <button type="button" onClick={handleSubmit(() => {})}>
        Save
      </button>
      <button type="button" onClick={() => setBrands([{ _id: "b1" }])}>
        Load brands
      </button>
    </div>
  )
}

describe("brand voice form in the browser", () => {
  it("shows a message under every empty required field on Save", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByText("nameOfVoice: Name of Voice is required.")).toBeInTheDocument()
    expect(screen.getByText("postLink: Post link is required.")).toBeInTheDocument()
    expect(screen.getByText("sitemapUrl: Sitemap URL is required.")).toBeInTheDocument()
    expect(screen.getByText("describeBrand: Brand description is required.")).toBeInTheDocument()
    expect(screen.getByText("persona: Persona is required.")).toBeInTheDocument()
    expect(screen.getByText("keywords: At least one keyword is required.")).toBeInTheDocument()
  })

  it("still shows messages after the page's mount reset has run", async () => {
    const user = userEvent.setup()
    render(<Harness resetOnMount />)

    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByText("nameOfVoice: Name of Voice is required.")).toBeInTheDocument()
    expect(screen.getByText("persona: Persona is required.")).toBeInTheDocument()
  })

  it("shows the URL message once a link is filled in but malformed", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByLabelText("postLink"), "acme")
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(
      await screen.findByText("postLink: Please enter a valid URL (e.g., https://example.com).")
    ).toBeInTheDocument()
  })
})
