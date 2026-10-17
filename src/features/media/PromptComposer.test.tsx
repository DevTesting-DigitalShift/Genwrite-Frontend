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

const imageOptions = {
  aspectRatios: ["1:1", "16:9"],
  resolutions: ["1k", "2k"],
  qualities: null,
  defaults: { aspectRatio: "1:1", resolution: "1k", quality: null },
  usd: { "1:1|1k|": 0.0105, "1:1|2k|": 0.042, "16:9|1k|": 0.0059, "16:9|2k|": 0.0236 },
}
const model = {
  id: "fal-ai/hidream-o1-image",
  label: "HiDream (Text-to-Image)",
  kind: "image",
  mode: "text_to_image",
  family: "hidream",
  unit: "image",
  usdPerUnit: 0.0105,
  imageOptions,
}
const gptOptions = {
  aspectRatios: ["1:1"],
  resolutions: ["1k"],
  qualities: ["low", "medium", "high"],
  defaults: { aspectRatio: "1:1", resolution: "1k", quality: "medium" },
  usd: { "1:1|1k|low": 0.006, "1:1|1k|medium": 0.053, "1:1|1k|high": 0.211 },
}
const gpt = {
  ...model,
  id: "openai/gpt-image-2",
  label: "GPT Image 2",
  usdPerUnit: 0.053,
  imageOptions: gptOptions,
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
    isEdit: false,
    imageOptions,
    imageChoice: { aspectRatio: "1:1", resolution: "1k", quality: null },
    setImageChoice: vi.fn(),
    sourceImageUrl: null,
    setSourceImageUrl: vi.fn(),
    uploadingSource: false,
    setUploadingSource: vi.fn(),
    canGenerate: true,
    videoDuration: 5,
    videoDurations: [],
    videoAspects: [],
    videoAspectRatio: null,
    setVideoAspectRatio: vi.fn(),
    setDurationSeconds: vi.fn(),
    videoResolution: null,
    videoResolutions: [],
    setResolution: vi.fn(),
    estimatedCredits: 2,
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
    renderComposer(
      composerWith({
        pricingReady: false,
        canGenerate: false,
        tabModels: [],
        currentModel: undefined,
        estimatedCredits: null,
      })
    )

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
        canGenerate: false,
        tabModels: [],
        currentModel: undefined,
        estimatedCredits: null,
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
    expect(screen.getByText("2 credits")).toBeInTheDocument()
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

  it("the image tab offers text-to-image and image-to-image", () => {
    const setMode = vi.fn()
    renderComposer(composerWith({ setMode }))
    expect(screen.getByText("Describe the image you want.")).toBeInTheDocument()
    const modes = screen.getByRole("tablist", { name: "Start from" })
    expect(modes).toHaveTextContent("Text to image")
    expect(modes).toHaveTextContent("Image to image")
    fireEvent.click(screen.getByRole("tab", { name: "Image to image" }))
    expect(setMode).toHaveBeenCalledWith("image_to_image")
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

describe("PromptComposer image options", () => {
  it("shows Aspect and Resolution for an image model and changing one calls setImageChoice", () => {
    const setImageChoice = vi.fn()
    renderComposer(composerWith({ setImageChoice }))

    expect(screen.getByRole("button", { name: "Aspect: 1:1" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Resolution: 1K" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Quality:/ })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Aspect: 1:1" }))
    fireEvent.click(screen.getByRole("option", { name: /16:9/ }))
    expect(setImageChoice).toHaveBeenCalledWith({ aspectRatio: "16:9" })
  })

  it("the resolution list shows what each choice costs", () => {
    renderComposer(composerWith({}))
    fireEvent.click(screen.getByRole("button", { name: "Resolution: 1K" }))
    expect(screen.getByRole("option", { name: /1K.*2 credits/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /2K.*5 credits/ })).toBeInTheDocument()
  })

  it("a model with a quality setting (GPT Image 2) shows a Quality chip with the default and each price", () => {
    const setImageChoice = vi.fn()
    renderComposer(
      composerWith({
        currentModel: gpt as never,
        tabModels: [gpt] as never,
        imageOptions: gptOptions as never,
        imageChoice: { aspectRatio: "1:1", resolution: "1k", quality: "medium" },
        setImageChoice,
      })
    )
    // one resolution only → no Resolution chip
    expect(screen.queryByRole("button", { name: /^Resolution:/ })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Quality: Medium" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Quality: Medium" }))
    expect(screen.getByRole("option", { name: /Low.*1 credit/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /High.*22 credits/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("option", { name: /High/ }))
    expect(setImageChoice).toHaveBeenCalledWith({ quality: "high" })
  })

  it("lists each model by what it costs from, not a per-megapixel rate", () => {
    renderComposer(composerWith({ tabModels: [model, gpt] as never }))
    fireEvent.click(screen.getByRole("button", { name: /^Model:/ }))
    expect(screen.getByRole("option", { name: /HiDream.*from 1 credit/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /GPT Image 2.*from 1 credit/ })).toBeInTheDocument()
  })
})

describe("PromptComposer image-to-image", () => {
  const editing = (over: Partial<MediaComposer> = {}) =>
    composerWith({ mode: "image_to_image", isEdit: true, ...over })

  it("asks for the image to edit, and has no Refine button (refining rewrites a scene, not an instruction)", () => {
    renderComposer(editing())
    expect(screen.getByText("Image to edit")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Upload an image/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Refine prompt/ })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Edit Image" })).toBeInTheDocument()
  })

  it("Edit Image is off until an image is uploaded (the composer says so via canGenerate)", () => {
    renderComposer(editing({ canGenerate: false }))
    expect(screen.getByRole("button", { name: "Edit Image" })).toBeDisabled()
  })

  it("shows the uploaded image and lets the user remove it", () => {
    const setSourceImageUrl = vi.fn()
    renderComposer(
      editing({
        sourceImageUrl: "https://res.cloudinary.com/x/image/upload/a.png",
        setSourceImageUrl,
      })
    )
    expect(screen.getByAltText("What you're editing")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Remove the image" }))
    expect(setSourceImageUrl).toHaveBeenCalledWith(null)
  })
})

describe("PromptComposer video aspect ratio", () => {
  const video = (over: Partial<MediaComposer> = {}) =>
    composerWith({
      tab: "video",
      mode: "text_to_video",
      videoAspects: ["16:9", "9:16", "1:1"],
      videoAspectRatio: "16:9",
      videoDurations: [4, 5, 6],
      ...over,
    })

  it("offers the ratios the model supports, and picking one calls setVideoAspectRatio", () => {
    const setVideoAspectRatio = vi.fn()
    renderComposer(video({ setVideoAspectRatio }))

    expect(screen.getByRole("button", { name: "Aspect: 16:9" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Aspect: 16:9" }))
    expect(screen.getByRole("option", { name: /9:16.*Vertical/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("option", { name: /9:16/ }))
    expect(setVideoAspectRatio).toHaveBeenCalledWith("9:16")
  })

  it("shows no Aspect chip for a model that lists none", () => {
    renderComposer(
      video({
        videoAspects: [],
        videoAspectRatio: null,
        imageOptions: undefined,
        imageChoice: null,
      })
    )
    expect(screen.queryByRole("button", { name: /^Aspect:/ })).not.toBeInTheDocument()
  })

  it("text-to-video has no image options (aspect/resolution/quality belong to image models)", () => {
    renderComposer(video({ imageOptions: undefined, imageChoice: null }))
    expect(screen.queryByRole("button", { name: /^Quality:/ })).not.toBeInTheDocument()
  })
})
