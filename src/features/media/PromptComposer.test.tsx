import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { PromptComposer } from "./PromptComposer"
import type { MediaComposer } from "./useMediaComposer"

// Only the network- and context-backed edges are stubbed; the composer renders for real.
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
// The pipeline form needs the router, auth and pricing stores; here only its wiring matters.
vi.mock("./AutoVideoForm", () => ({
  AutoVideoForm: ({ mode }: { mode: string }) => <div data-testid="pipeline-form">{mode}</div>,
}))

const model = {
  id: "fal-ai/hidream-o1-image",
  label: "HiDream (Text-to-Image)",
  kind: "image",
  mode: "text_to_image",
  family: "hidream",
  unit: "megapixel",
  usdPerUnit: 0.01,
}

/** The composer state a page would pass in, with the pricing flags under test. */
const composerWith = (overrides: Partial<MediaComposer>): MediaComposer =>
  ({
    tab: "image",
    setTab: vi.fn(),
    prompt: "",
    setPrompt: vi.fn(),
    mode: "text_to_image",
    setMode: vi.fn(),
    usesPipeline: false,
    tabModels: [model],
    currentModel: model,
    setModel: vi.fn(),
    megapixels: 1,
    setMegapixels: vi.fn(),
    videoDuration: 5,
    videoDurations: [],
    setDurationSeconds: vi.fn(),
    videoResolution: null,
    videoResolutions: [],
    setResolution: vi.fn(),
    estimatedCredits: 1,
    userCredits: 500,
    isSubmitting: false,
    handleGenerate: vi.fn(),
    pricingReady: true,
    pricingFailed: false,
    retryPricing: vi.fn(),
    mediaCatalogue: {},
    ...overrides,
  }) as MediaComposer

const renderComposer = (composer: MediaComposer) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PromptComposer composer={composer} />
    </QueryClientProvider>
  )

describe("PromptComposer pricing states", () => {
  it("while prices load: no model controls, no cost, and Generate is disabled", () => {
    renderComposer(composerWith({ pricingReady: false, tabModels: [], currentModel: undefined }))

    expect(screen.getByText("Loading models and prices…")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Model:/ })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Generate Image" })).toBeDisabled()
    // the cost is unknown, not zero
    expect(screen.getByText(/Estimated cost/)).toHaveTextContent("Estimated cost —")
    expect(screen.queryByText(/\d+ credits?/)).not.toBeInTheDocument()
  })

  it("when prices can't be loaded: says so, offers a retry, and keeps Generate disabled", () => {
    const retryPricing = vi.fn()
    renderComposer(
      composerWith({
        pricingReady: false,
        pricingFailed: true,
        tabModels: [],
        currentModel: undefined,
        retryPricing,
      })
    )

    expect(screen.getByRole("alert")).toHaveTextContent("Prices couldn't be loaded")
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(retryPricing).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: "Generate Image" })).toBeDisabled()
  })

  it("with prices: shows the model, its cost, and lets the user generate", () => {
    const handleGenerate = vi.fn()
    renderComposer(composerWith({ handleGenerate }))

    expect(screen.getByRole("button", { name: /^Model: HiDream/ })).toBeInTheDocument()
    expect(screen.getByText("1 credit")).toBeInTheDocument()
    const generate = screen.getByRole("button", { name: "Generate Image" })
    expect(generate).toBeEnabled()
    fireEvent.click(generate)
    expect(handleGenerate).toHaveBeenCalledTimes(1)
  })
})

describe("PromptComposer modes", () => {
  it("has no Purpose control — what you make comes from the tab and the mode", () => {
    renderComposer(composerWith({}))
    expect(screen.queryByText("Purpose")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Purpose:/ })).not.toBeInTheDocument()
  })

  it("the image tab has a single mode, so it shows the hint but no switch", () => {
    renderComposer(composerWith({}))
    expect(screen.getByText("Describe the image you want.")).toBeInTheDocument()
    expect(screen.queryByRole("tablist", { name: "Start from" })).not.toBeInTheDocument()
  })

  it("the video tab offers text, image and reference modes, and switching calls setMode", () => {
    const setMode = vi.fn()
    renderComposer(composerWith({ tab: "video", mode: "text_to_video", setMode }))

    const modes = screen.getByRole("tablist", { name: "Start from" })
    expect(modes).toHaveTextContent("Text to video")
    expect(modes).toHaveTextContent("Image to video")
    expect(modes).toHaveTextContent("Reference to video")
    expect(screen.getByRole("tab", { name: "Text to video" })).toHaveAttribute(
      "aria-selected",
      "true"
    )

    fireEvent.click(screen.getByRole("tab", { name: "Reference to video" }))
    expect(setMode).toHaveBeenCalledWith("reference_to_video")
  })

  it("there is no separate Auto Video tab any more", () => {
    renderComposer(composerWith({ tab: "video", mode: "text_to_video" }))
    expect(screen.queryByRole("tab", { name: "Auto Video" })).not.toBeInTheDocument()
    expect(screen.getAllByRole("tab", { name: /^(Image|Video)$/ })).toHaveLength(2)
  })

  it.each(["image_to_video", "reference_to_video"] as const)(
    "%s runs through the pipeline form instead of the text prompt box",
    (mode) => {
      renderComposer(composerWith({ tab: "video", mode, usesPipeline: true }))
      expect(screen.getByTestId("pipeline-form")).toHaveTextContent(mode)
      expect(screen.queryByRole("button", { name: "Generate Video" })).not.toBeInTheDocument()
      expect(screen.queryByLabelText("Prompt")).not.toBeInTheDocument()
    }
  )
})
