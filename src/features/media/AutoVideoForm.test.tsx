import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Only the network- and context-backed edges are stubbed; the form renders for real.
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock("@/context/ConfirmPopupContext", () => ({
  useConfirmPopup: () => ({ handlePopup: vi.fn() }),
}))
const stubs = vi.hoisted(() => ({ create: vi.fn(), upload: vi.fn() }))
vi.mock("@api/Media/MediaPipeline.query", () => ({
  mediaPipelineQuery: { useCreate: () => ({ mutate: stubs.create, isPending: false }) },
}))
vi.mock("@api/ImageGallery/ImageGallery.query", () => ({
  imageGalleryQuery: { useUpload: () => ({ mutateAsync: stubs.upload, isPending: false }) },
}))
vi.mock("@api/Media/Media.query", () => ({
  mediaQuery: { useRefinePrompt: () => ({ mutate: vi.fn(), isPending: false }) },
}))

const { AutoVideoForm } = await import("./AutoVideoForm")
const { default: usePricingStore } = await import("@store/usePricingStore")
const { default: useAuthStore } = await import("@store/useAuthStore")

const frameConfig = {
  durations: [4, 5, 6, 8, 10],
  durationFormat: "number",
  seed: true,
  aspectRatio: true,
  negativePrompt: false,
  audioField: "audio",
  extra: {},
  first: "start_image_url",
  last: "end_image_url",
}
// What GET /user/pricing serves: two image-to-video models (one with a closing frame, one without),
// a reference model, and the frame model whose price a run pays for.
const media = {
  "alibaba/wan-3.0/image-to-video": {
    mode: "image_to_video",
    family: "wan",
    kind: "video",
    unit: "second",
    usdPerUnit: 0.1,
    label: "Wan 3.0",
    resolutionPricing: { "480p": 0.05, "720p": 0.1, "1080p": 0.2 },
    frameVideo: { ...frameConfig, endFrame: "optional" },
  },
  "example/no-end-frame": {
    mode: "image_to_video",
    family: "example",
    kind: "video",
    unit: "second",
    usdPerUnit: 0.2,
    label: "No End Frame",
    frameVideo: { ...frameConfig, endFrame: "none" },
  },
  "fal-ai/vidu/q4/reference-to-video": {
    mode: "reference_to_video",
    family: "vidu",
    kind: "video",
    unit: "second",
    usdPerUnit: 0.095,
    label: "Vidu Q4 (product refs)",
    frameVideo: {
      ...frameConfig,
      first: null,
      last: null,
      endFrame: "none",
      referenceImages: {
        field: "reference_image_urls",
        max: 3,
        firstFrameAsReference: true,
        syntax: "x",
      },
    },
  },
  "bytedance/seedream/v5/pro/edit": {
    mode: "image_to_image",
    family: "seedream",
    kind: "image",
    unit: "image",
    usdPerUnit: 0.0675,
    label: "Seedream Edit",
  },
}

const UPLOADED = "https://res.cloudinary.com/demo/image/upload/v1/genwrite/users/u1/frame.png"

beforeEach(() => {
  stubs.create.mockReset()
  stubs.upload.mockReset().mockResolvedValue({ url: `${UPLOADED}?v=2` })
  usePricingStore.setState({
    catalogue: { ...usePricingStore.getState().catalogue, media } as never,
    status: "ready",
  })
  useAuthStore.setState({ user: { credits: { base: 1000, extra: 0 } } as never })
  vi.stubGlobal(
    "Image",
    class {
      naturalWidth = 1080
      naturalHeight = 1920
      onload: (() => void) | null = null
      set src(_: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
  )
})

const renderForm = (mode: "image_to_video" | "reference_to_video" = "image_to_video") =>
  render(
    <MemoryRouter>
      <AutoVideoForm mode={mode} />
    </MemoryRouter>
  )

const type = (text: string) =>
  fireEvent.change(screen.getByLabelText("Describe your video"), { target: { value: text } })
const generate = () => screen.getByRole("button", { name: "Generate Video" })
const uploadTo = async (label: RegExp, name = "frame.png") => {
  const input = screen.getByLabelText(label) as HTMLInputElement
  await act(async () => {
    fireEvent.change(input, { target: { files: [new File(["x"], name, { type: "image/png" })] } })
  })
}

describe("Auto frames", () => {
  it("is on by default: the frames are generated and priced in, with no uploaders", () => {
    renderForm()
    expect(screen.getByRole("checkbox", { name: /Auto frames/ })).toBeChecked()
    expect(screen.queryByText("Opening frame")).not.toBeInTheDocument()
    // 2 frame candidates × $0.0675 + 5s × $0.10 × 1.5 = $0.885
    expect(screen.getByText("89 credits")).toBeInTheDocument()
  })

  it("switched off: asks for the opening frame (required) and a closing frame (optional), and drops the frame cost", () => {
    renderForm()
    fireEvent.click(screen.getByRole("checkbox", { name: /Auto frames/ }))

    expect(screen.getByText("Opening frame")).toBeInTheDocument()
    expect(screen.getByText("Closing frame")).toBeInTheDocument()
    expect(screen.getByText("(optional)")).toBeInTheDocument()
    expect(screen.getByText("75 credits")).toBeInTheDocument() // video only: 5s × $0.10 × 1.5
    expect(
      screen.getByText(/nothing is generated for them, so they cost nothing/)
    ).toBeInTheDocument()
  })

  it("a model that can't take an end frame gets no closing-frame upload", () => {
    renderForm("reference_to_video")
    fireEvent.click(screen.getByRole("checkbox", { name: /Auto frames/ }))
    expect(screen.getByText("Opening frame")).toBeInTheDocument()
    expect(screen.queryByText("Closing frame")).not.toBeInTheDocument()
    expect(screen.getByText(/no closing frame to add/)).toBeInTheDocument()
  })

  it("Generate stays off until the opening frame is uploaded", async () => {
    renderForm()
    type("A barista pours latte art")
    fireEvent.click(screen.getByRole("checkbox", { name: /Auto frames/ }))
    expect(generate()).toBeDisabled()

    await uploadTo(/choose opening frame/i)
    await waitFor(() => expect(generate()).toBeEnabled())
  })

  it("sends the opening frame (and no generated-frame options) when you use your own", async () => {
    renderForm()
    type("A barista pours latte art")
    fireEvent.click(screen.getByRole("checkbox", { name: /Auto frames/ }))
    await uploadTo(/choose opening frame/i)
    await waitFor(() => expect(generate()).toBeEnabled())
    fireEvent.click(generate())

    expect(stubs.create).toHaveBeenCalledTimes(1)
    const body = stubs.create.mock.calls[0][0]
    expect(body).toMatchObject({
      videoModel: "alibaba/wan-3.0/image-to-video",
      firstFrameUrl: UPLOADED,
      useEndFrame: false,
    })
    expect(body).not.toHaveProperty("lastFrameUrl")
  })

  it("sends the closing frame too when one is added, and locks the end frame", async () => {
    renderForm()
    type("A barista pours latte art")
    fireEvent.click(screen.getByRole("checkbox", { name: /Auto frames/ }))
    await uploadTo(/choose opening frame/i)
    await uploadTo(/choose closing frame/i)
    await waitFor(() => expect(generate()).toBeEnabled())
    fireEvent.click(generate())

    expect(stubs.create.mock.calls[0][0]).toMatchObject({
      firstFrameUrl: UPLOADED,
      lastFrameUrl: UPLOADED,
      useEndFrame: true,
    })
  })

  it("picks the format from the frame's own orientation (a portrait frame → 9:16)", async () => {
    renderForm()
    type("A barista pours latte art")
    fireEvent.click(screen.getByRole("checkbox", { name: /Auto frames/ }))
    await uploadTo(/choose opening frame/i)
    await waitFor(() => expect(generate()).toBeEnabled())
    fireEvent.click(generate())
    expect(stubs.create.mock.calls[0][0]).toMatchObject({ aspectRatio: "9:16" })
  })

  it("with Auto frames on it sends no frames, as before", () => {
    renderForm()
    type("A barista pours latte art")
    fireEvent.click(generate())
    const body = stubs.create.mock.calls[0][0]
    expect(body).not.toHaveProperty("firstFrameUrl")
    expect(body).not.toHaveProperty("lastFrameUrl")
  })
})

describe("Reference to video", () => {
  it("needs at least one reference image even with Auto frames on", () => {
    renderForm("reference_to_video")
    type("A creator shows the app")
    expect(screen.getByText("Reference images")).toBeInTheDocument()
    expect(generate()).toBeDisabled()
  })
})
