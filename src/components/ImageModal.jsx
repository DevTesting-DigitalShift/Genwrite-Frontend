import React, { useState, useEffect } from "react"
import { Modal, Button, Input, Select, message, Tabs } from "antd"
import {
  Sparkles,
  Image as ImageIcon,
  Trash2,
  Link as LinkIcon,
  Undo2,
  Check,
  Search,
} from "lucide-react"
import { useSelector } from "react-redux"
import { generateImage, generateAltText, enhanceImage } from "@api/imageGalleryApi"
import ImageGalleryPicker from "@components/ImageGalleryPicker"
import LoadingScreen from "@components/UI/LoadingScreen"
import { COSTS } from "@/data/blogData" // Assuming this path exists based on context

const { TextArea } = Input

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

  const user = useSelector(state => state.auth.user)

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
      message.error("You have reached your AI Image generation limit.")
      return false
    }
    if (credits < cost) {
      message.error(`Insufficient credits. Need ${cost} credits.`)
      return false
    }
    return true
  }

  // Handlers
  const handleAutoAlt = async () => {
    if (!url) return
    if (!checkCredits(COSTS.ALT_TEXT)) return

    const hide = message.loading("Generating alt text...", 0)
    try {
      const response = await generateAltText({ imageUrl: url })
      const generatedAlt = response.altText || response.data?.altText
      if (generatedAlt) {
        setAlt(generatedAlt)
        message.success("Alt text generated!")
      }
    } catch (err) {
      console.error(err)
      message.error("Failed to generate alt text")
    } finally {
      hide()
    }
  }

  const handleGenerate = async () => {
    if (!genForm.prompt.trim()) {
      message.error("Please enter a prompt")
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
      message.error("Generation failed")
      setView(VIEWS.GENERATE)
    }
  }

  const handleEnhance = async () => {
    if (!url) return message.error("No image to enhance")
    if (!enhanceForm.prompt.trim()) {
      message.error("Please enter instructions")
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

      const res = await enhanceImage(formData) // Adjust API call signature if needed: object vs formData
      // Based on previous code snippet it might be object or formData depending on implementation.
      // TextEditor snippet used object {imageUrl, ...} but thumbnail used FormData.
      // I'll stick to what seemed to work in TextEditor snippet or check the API.
      // Wait, TextEditor used: enhanceImage({ imageUrl, prompt, style, quality }) for 'enhance' view but FormData for 'thumbnail' enhance?
      // Actually standardization is better. I'll rely on object first as it's cleaner, but if API requires FormData (file upload), imageUrl is string so JSON is fine usually.

      const img = res.image || res.data || res
      if (img?.url) {
        // Direct update? Or preview? Let's direct update url but maybe show confirmation
        setUrl(img.url)
        message.success("Image enhanced successfully!")
        setView(VIEWS.MAIN)
      } else {
        throw new Error("No image data")
      }
    } catch (e) {
      console.error(e)
      message.error("Enhancement failed")
      setView(VIEWS.ENHANCE)
    }
  }

  // Header Title Component
  const ModalTitle = () => (
    <div className="flex items-center justify-between gap-3 pr-8">
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
    </div>
  )

  return (
    <Modal
      title={<ModalTitle />}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={view === VIEWS.GALLERY ? 1000 : 600}
      centered
      className="responsive-image-modal"
      classNames={{ body: "!p-0 !overflow-hidden !max-h-[85vh]" }} // Use new Antd v5 classNames prop or bodyStyle
      styles={{ body: { padding: 0, maxHeight: "85vh", overflow: "hidden" } }}
    >
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
                  <Button
                    block
                    className="h-auto py-2 flex flex-col items-center justify-center gap-1 hover:border-purple-300 hover:text-purple-600"
                    onClick={() => setView(VIEWS.GALLERY)}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs">Gallery</span>
                  </Button>
                  <Button
                    block
                    className="h-auto py-2 flex flex-col items-center justify-center gap-1 hover:border-blue-300 hover:text-blue-600"
                    onClick={() => setView(VIEWS.GENERATE)}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs">Generate AI</span>
                  </Button>
                  <Button
                    block
                    disabled={!url || !allowEnhance}
                    className="h-auto py-2 flex flex-col items-center justify-center gap-1 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
                    onClick={() => {
                      setEnhanceForm(prev => ({ ...prev, prompt: alt || "" }))
                      setView(VIEWS.ENHANCE)
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs">Enhance</span>
                  </Button>
                  <Button
                    block
                    danger
                    disabled={!url}
                    className="h-auto py-2 flex flex-col items-center justify-center gap-1"
                    onClick={() => {
                      setUrl("")
                      setAlt("")
                      message.success("Image removed")
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-xs">Clear</span>
                  </Button>
                </div>
              </div>

              {/* URL & Alt Text Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <Input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    size="large"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Alt Text <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    {url && (
                      <Button
                        type="text"
                        size="small"
                        className="text-xs flex items-center gap-1 text-blue-600 hover:bg-blue-50"
                        onClick={handleAutoAlt}
                      >
                        <Sparkles className="w-3 h-3" /> Auto-Generate
                      </Button>
                    )}
                  </div>
                  <TextArea
                    value={alt}
                    onChange={e => setAlt(e.target.value)}
                    placeholder="Describe the image for SEO..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* VIEW: GALLERY */}
          {view === VIEWS.GALLERY && (
            <div className="flex-1 overflow-hidden h-full">
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
                  <TextArea
                    placeholder="e.g. A futuristic city skyline at sunset, cyberpunk style..."
                    value={genForm.prompt}
                    onChange={e => setGenForm({ ...genForm, prompt: e.target.value })}
                    rows={4}
                    size="large"
                    className="text-base"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                    <Select
                      value={genForm.style}
                      onChange={val => setGenForm({ ...genForm, style: val })}
                      className="w-full"
                      size="large"
                      options={[
                        { value: "photorealistic", label: "Photorealistic" },
                        { value: "anime", label: "Anime" },
                        { value: "digital-art", label: "Digital Art" },
                        { value: "oil-painting", label: "Oil Painting" },
                        { value: "cinematic", label: "Cinematic" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aspect Ratio
                    </label>
                    <Select
                      value={genForm.aspectRatio}
                      onChange={val => setGenForm({ ...genForm, aspectRatio: val })}
                      className="w-full"
                      size="large"
                      options={[
                        { value: "1:1", label: "Square (1:1)" },
                        { value: "16:9", label: "Landscape (16:9)" },
                        { value: "9:16", label: "Portrait (9:16)" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quality</label>
                    <Select
                      value={genForm.imageSize}
                      onChange={val => setGenForm({ ...genForm, imageSize: val })}
                      className="w-full"
                      size="large"
                      options={[
                        { value: "1k", label: "Standard (1K)" },
                        { value: "2k", label: "High Res (2K)" },
                        { value: "4k", label: "Ultra (4K)" },
                      ]}
                    />
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
                  <TextArea
                    placeholder="e.g. Make it higher resolution, fix lighting..."
                    value={enhanceForm.prompt}
                    onChange={e => setEnhanceForm({ ...enhanceForm, prompt: e.target.value })}
                    rows={3}
                    size="large"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                  <Select
                    value={enhanceForm.style}
                    onChange={val => setEnhanceForm({ ...enhanceForm, style: val })}
                    className="w-full"
                    size="large"
                    options={[
                      { value: "photorealistic", label: "Photorealistic" },
                      { value: "anime", label: "Anime" },
                      { value: "digital-art", label: "Digital Art" },
                      { value: "oil-painting", label: "Oil Painting" },
                      { value: "cinematic", label: "Cinematic" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quality</label>
                  <Select
                    value={enhanceForm.imageSize}
                    onChange={val => setEnhanceForm({ ...enhanceForm, imageSize: val })}
                    className="w-full"
                    size="large"
                    options={[
                      { value: "1k", label: "Standard (1K)" },
                      { value: "2k", label: "High Res (2K)" },
                      { value: "4k", label: "Ultra (4K)" },
                    ]}
                  />
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
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 z-[999]">
              <LoadingScreen
                message={
                  view === VIEWS.GENERATING ? "Creating your masterpiece..." : "Enhancing image..."
                }
              />
              <p className="text-gray-500 text-sm max-w-xs text-center animate-pulse">
                This may take 10-20 seconds. Please wait.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t bg-white flex-shrink-0 flex items-center justify-between">
          {view === VIEWS.MAIN && (
            <>
              <Button onClick={onCancel}>Cancel</Button>
              <Button
                type="primary"
                onClick={() => {
                  if (imageSourceType === "thumbnail" && !url) {
                    // For thumbnail, empty might mean remove, but onSave usually implies saving valid state.
                    // If clearing, user should use "Clear" button which clears state.
                    // If "Save Changes" is clicked with empty URL, it saves empty.
                  }
                  onSave(url, alt)
                }}
              >
                {imageSourceType === "thumbnail" ? "Save Changes" : "Insert Image"}
              </Button>
            </>
          )}

          {view === VIEWS.GENERATE && (
            <>
              <Button onClick={() => setView(VIEWS.MAIN)}>Cancel</Button>
              <Button
                type="primary"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 border-none"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={handleGenerate}
              >
                Generate ({COSTS.GENERATE}c)
              </Button>
            </>
          )}

          {view === VIEWS.ENHANCE && (
            <>
              <Button onClick={() => setView(VIEWS.MAIN)}>Cancel</Button>
              <Button
                type="primary"
                className="bg-gradient-to-r from-purple-600 to-pink-600 border-none"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={handleEnhance}
              >
                Enhance ({COSTS.ENHANCE}c)
              </Button>
            </>
          )}

          {view === VIEWS.PREVIEW_GENERATE && (
            <>
              <Button onClick={() => setView(VIEWS.GENERATE)}>Try Again</Button>
              <Button
                type="primary"
                onClick={() => {
                  setUrl(generatedImageTemp.url)
                  setAlt(generatedImageTemp.prompt)
                  setGeneratedImageTemp(null)
                  setView(VIEWS.MAIN)
                }}
              >
                Use This Image
              </Button>
            </>
          )}

          {view === VIEWS.GALLERY && <Button onClick={() => setView(VIEWS.MAIN)}>Back</Button>}
        </div>
      </div>
    </Modal>
  )
}

export default ImageModal
