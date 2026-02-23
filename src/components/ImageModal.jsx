import React, { useState, useEffect } from "react"
import toast from "@utils/toast"
import { Sparkles, Image as ImageIcon, Trash2, X } from "lucide-react"
import useAuthStore from "@store/useAuthStore"
import { generateImage, generateAltText, enhanceImage } from "@api/imageGalleryApi"
import ImageGalleryPicker from "@components/ImageGalleryPicker"
import LoadingScreen from "@components/ui/LoadingScreen"
import { COSTS } from "@/data/blogData"

// View Constants
const VIEWS = {
  MAIN: "main",
  GALLERY: "gallery",
  GENERATE: "generate",
  ENHANCE: "enhance",
  PREVIEW_GENERATE: "preview_generate",
  PREVIEW_ENHANCE: "preview_enhance",
  GENERATING: "generating",
  ENHANCING: "enhancing",
}

const ImageModal = ({
  open,
  onCancel,
  onSave, // (url, alt) => void
  initialUrl = "",
  initialAlt = "",
  title = "Add Image",
  allowEnhance = true, // To optionally disable enhance feature if not desired
  imageSourceType = "url", // 'url' | 'data' - context if needed
}) => {
  // Internal State
  const [view, setView] = useState(VIEWS.MAIN)
  const [url, setUrl] = useState("")
  const [alt, setAlt] = useState("")
  const [generatedImageTemp, setGeneratedImageTemp] = useState(null)

  // Forms
  const [genForm, setGenForm] = useState({
    prompt: "",
    style: "photorealistic",
    aspectRatio: "16:9",
    imageSize: "1k",
  })

  const [enhanceForm, setEnhanceForm] = useState({
    prompt: "",
    style: "photorealistic",
    imageSize: "1k",
  })

  const { user } = useAuthStore()

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setUrl(initialUrl || "")
      setAlt(initialAlt || "")
      setView(VIEWS.MAIN)
      setGenForm({ prompt: "", style: "photorealistic", aspectRatio: "16:9", imageSize: "1k" })
      setEnhanceForm({
        prompt: initialAlt || "", // Pre-fill analyze/enhance prompt with alt text if available
        style: "photorealistic",
        imageSize: "1k",
      })
    }
  }, [open, initialUrl, initialAlt])

  // Helper: Check Credits
  const checkCredits = cost => {
    const credits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
    // Also check limits if applicable
    if (user?.usage?.aiImages >= user?.usageLimits?.aiImages) {
      toast.error("You have reached your AI Image generation limit.")
      return false
    }
    if (credits < cost) {
      toast.error(`Insufficient credits. Need ${cost} credits.`)
      return false
    }
    return true
  }

  // Handlers
  const handleAutoAlt = async () => {
    if (!url) return
    if (!checkCredits(COSTS.ALT_TEXT)) return

    try {
      // Manual loading handling since message.loading isn't in toast utils usually
      toast.loading("Generating alt text...")

      const response = await generateAltText({ imageUrl: url })
      const generatedAlt = response.altText || response.data?.altText
      if (generatedAlt) {
        setAlt(generatedAlt)
        toast.dismiss()
        toast.success("Alt text generated!")
      }
    } catch (err) {
      console.error(err)
      toast.dismiss()
      toast.error("Failed to generate alt text")
    }
  }

  const handleGenerate = async () => {
    if (!genForm.prompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }
    if (!checkCredits(COSTS.GENERATE)) return

    setView(VIEWS.GENERATING)
    try {
      const res = await generateImage(genForm)
      const img = res.image || res.data || res
      if (img?.url) {
        setGeneratedImageTemp({ ...img, prompt: genForm.prompt })
        setView(VIEWS.PREVIEW_GENERATE)
      } else {
        throw new Error("No image data returned")
      }
    } catch (e) {
      console.error(e)
      toast.error("Generation failed")
      setView(VIEWS.GENERATE)
    }
  }

  const handleEnhance = async () => {
    if (!url) return toast.error("No image to enhance")
    if (!enhanceForm.prompt.trim()) {
      toast.error("Please enter instructions")
      return
    }
    if (!checkCredits(COSTS.ENHANCE)) return

    setView(VIEWS.ENHANCING)
    try {
      const formData = new FormData()
      formData.append("prompt", enhanceForm.prompt)
      formData.append("style", enhanceForm.style)
      formData.append("quality", enhanceForm.imageSize)
      formData.append("imageUrl", url)

      const res = await enhanceImage(formData)
      const img = res.image || res.data || res
      if (img?.url) {
        setUrl(img.url)
        toast.success("Image enhanced successfully!")
        setView(VIEWS.MAIN)
      } else {
        throw new Error("No image data")
      }
    } catch (e) {
      console.error(e)
      toast.error("Enhancement failed")
      setView(VIEWS.ENHANCE)
    }
  }

  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div
        className={`modal-box p-0 overflow-hidden max-h-[85vh] ${view === VIEWS.GALLERY ? "w-11/12 max-w-5xl" : "w-full max-w-2xl"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-base-100">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-800">
              {view === VIEWS.GENERATE
                ? "Generate Image"
                : view === VIEWS.GALLERY
                  ? "Select from Gallery"
                  : view === VIEWS.ENHANCE
                    ? "Enhance Image"
                    : title}
            </span>
          </div>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onCancel}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[65vh] md:max-h-[600px]">
          <div className="flex-1 overflow-auto bg-gray-50/50 custom-scroll">
            {/* VIEW: MAIN */}
            {view === VIEWS.MAIN && (
              <div className="p-3 space-y-6">
                {/* Image Preview & Actions */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="relative group min-h-[200px] flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden border border-dashed border-gray-300">
                    {url ? (
                      <img
                        src={url}
                        alt="Preview"
                        className="w-full h-full max-h-[300px] object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center gap-2">
                        <ImageIcon className="w-10 h-10 opacity-50" />
                        <span className="text-sm">No image selected</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <button
                      className="btn btn-outline h-auto py-2 flex flex-col items-center justify-center gap-1 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50"
                      onClick={() => setView(VIEWS.GALLERY)}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-xs font-normal">Gallery</span>
                    </button>
                    <button
                      className="btn btn-outline h-auto py-2 flex flex-col items-center justify-center gap-1 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => setView(VIEWS.GENERATE)}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-normal">Generate AI</span>
                    </button>
                    <button
                      disabled={!url || !allowEnhance}
                      className="btn btn-outline h-auto py-2 flex flex-col items-center justify-center gap-1 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 disabled:bg-gray-100"
                      onClick={() => {
                        setEnhanceForm(prev => ({ ...prev, prompt: alt || "" }))
                        setView(VIEWS.ENHANCE)
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-normal">Enhance</span>
                    </button>
                    <button
                      disabled={!url}
                      className="btn btn-outline btn-error h-auto py-2 flex flex-col items-center justify-center gap-1 disabled:bg-gray-100"
                      onClick={() => {
                        setUrl("")
                        setAlt("")
                        toast.success("Image removed")
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs font-normal">Clear</span>
                    </button>
                  </div>
                </div>

                {/* URL & Alt Text Inputs */}
                <div className="space-y-4 px-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Alt Text <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      {url && (
                        <button
                          className="btn btn-ghost btn-xs text-xs flex items-center gap-1 text-blue-600"
                          onClick={handleAutoAlt}
                        >
                          <Sparkles className="w-3 h-3" /> Auto-Generate
                        </button>
                      )}
                    </div>
                    <textarea
                      value={alt}
                      onChange={e => setAlt(e.target.value)}
                      placeholder="Describe the image for SEO..."
                      rows={4}
                      className="textarea textarea-bordered w-full resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: GALLERY */}
            {view === VIEWS.GALLERY && (
              <div className="flex-1 overflow-hidden h-full p-2">
                <ImageGalleryPicker
                  onSelect={(selectedUrl, selectedAlt) => {
                    setUrl(selectedUrl)
                    setAlt(selectedAlt || "")
                    setView(VIEWS.MAIN)
                  }}
                  selectedImageUrl={url}
                />
              </div>
            )}

            {/* VIEW: GENERATE */}
            {view === VIEWS.GENERATE && (
              <div className="flex-1 p-6 flex flex-col">
                <div className="flex-1 max-w-lg mx-auto w-full space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Generate New Image</h3>
                    <p className="text-sm text-gray-500">
                      Describe your vision and AI will create it.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                    <textarea
                      placeholder="e.g. A futuristic city skyline at sunset, cyberpunk style..."
                      value={genForm.prompt}
                      onChange={e => setGenForm({ ...genForm, prompt: e.target.value })}
                      rows={4}
                      className="textarea textarea-bordered w-full text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                      <select
                        value={genForm.style}
                        onChange={e => setGenForm({ ...genForm, style: e.target.value })}
                        className="select select-bordered w-full"
                      >
                        <option value="photorealistic">Photorealistic</option>
                        <option value="anime">Anime</option>
                        <option value="digital-art">Digital Art</option>
                        <option value="oil-painting">Oil Painting</option>
                        <option value="cinematic">Cinematic</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aspect Ratio
                      </label>
                      <select
                        value={genForm.aspectRatio}
                        onChange={e => setGenForm({ ...genForm, aspectRatio: e.target.value })}
                        className="select select-bordered w-full"
                      >
                        <option value="1:1">Square (1:1)</option>
                        <option value="16:9">Landscape (16:9)</option>
                        <option value="9:16">Portrait (9:16)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quality
                      </label>
                      <select
                        value={genForm.imageSize}
                        onChange={e => setGenForm({ ...genForm, imageSize: e.target.value })}
                        className="select select-bordered w-full"
                      >
                        <option value="1k">Standard (1K)</option>
                        <option value="2k">High Res (2K)</option>
                        <option value="4k">Ultra (4K)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: ENHANCE */}
            {view === VIEWS.ENHANCE && (
              <div className="flex-1 p-6 flex flex-col">
                <div className="flex-1 max-w-lg mx-auto w-full space-y-6">
                  <div className="flex justify-center mb-4">
                    <img
                      src={url}
                      alt="Source"
                      className="h-full max-h-[200px] object-contain rounded border bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instruction
                    </label>
                    <textarea
                      placeholder="e.g. Make it higher resolution, fix lighting..."
                      value={enhanceForm.prompt}
                      onChange={e => setEnhanceForm({ ...enhanceForm, prompt: e.target.value })}
                      rows={3}
                      className="textarea textarea-bordered w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                    <select
                      value={enhanceForm.style}
                      onChange={e => setEnhanceForm({ ...enhanceForm, style: e.target.value })}
                      className="select select-bordered w-full"
                    >
                      <option value="photorealistic">Photorealistic</option>
                      <option value="anime">Anime</option>
                      <option value="digital-art">Digital Art</option>
                      <option value="oil-painting">Oil Painting</option>
                      <option value="cinematic">Cinematic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quality</label>
                    <select
                      value={enhanceForm.imageSize}
                      onChange={e => setEnhanceForm({ ...enhanceForm, imageSize: e.target.value })}
                      className="select select-bordered w-full"
                    >
                      <option value="1k">Standard (1K)</option>
                      <option value="2k">High Res (2K)</option>
                      <option value="4k">Ultra (4K)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: PREVIEW GENERATE */}
            {view === VIEWS.PREVIEW_GENERATE && (
              <div className="flex-1 p-6 flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200 overflow-hidden relative">
                  <img
                    src={generatedImageTemp?.url}
                    alt="Generated Result"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-gray-600 font-medium">{generatedImageTemp?.prompt}</p>
                  <p className="text-xs text-gray-400 mt-1">Generated by AI</p>
                </div>
              </div>
            )}

            {/* LOADING SCREENS */}
            {(view === VIEWS.GENERATING || view === VIEWS.ENHANCING) && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 z-999">
                <LoadingScreen
                  message={
                    view === VIEWS.GENERATING
                      ? "Creating your masterpiece..."
                      : "Enhancing image..."
                  }
                />
                <p className="text-gray-500 text-sm max-w-xs text-center animate-pulse">
                  This may take 10-20 seconds. Please wait.
                </p>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="p-4 border-t bg-white shrink-0 flex items-center justify-between">
            {view === VIEWS.MAIN && (
              <>
                <button className="btn btn-ghost" onClick={onCancel}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onSave(url, alt)
                  }}
                >
                  {imageSourceType === "thumbnail" ? "Save Changes" : "Insert Image"}
                </button>
              </>
            )}

            {view === VIEWS.GENERATE && (
              <>
                <button className="btn btn-ghost" onClick={() => setView(VIEWS.MAIN)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary bg-linear-to-r from-blue-600 to-indigo-600 border-none"
                  onClick={handleGenerate}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate ({COSTS.GENERATE}c)
                </button>
              </>
            )}

            {view === VIEWS.ENHANCE && (
              <>
                <button className="btn btn-ghost" onClick={() => setView(VIEWS.MAIN)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary bg-linear-to-r from-purple-600 to-pink-600 border-none"
                  onClick={handleEnhance}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enhance ({COSTS.ENHANCE}c)
                </button>
              </>
            )}

            {view === VIEWS.PREVIEW_GENERATE && (
              <>
                <button className="btn btn-ghost" onClick={() => setView(VIEWS.GENERATE)}>
                  Try Again
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setUrl(generatedImageTemp.url)
                    setAlt(generatedImageTemp.prompt)
                    setGeneratedImageTemp(null)
                    setView(VIEWS.MAIN)
                  }}
                >
                  Use This Image
                </button>
              </>
            )}

            {view === VIEWS.GALLERY && (
              <button className="btn btn-ghost" onClick={() => setView(VIEWS.MAIN)}>
                Back
              </button>
            )}
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCancel}>close</button>
      </form>
    </dialog>
  )
}

export default ImageModal
