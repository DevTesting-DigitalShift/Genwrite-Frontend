import { useRef } from "react"
import { ImagePlus, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { imageGalleryQuery } from "@api/ImageGallery/ImageGallery.query"

const MAX_FILE_BYTES = 10 * 1024 * 1024

/**
 * Image-to-image: the one picture to change. It's uploaded straight away to the user's own
 * storage (the backend only accepts images from there), and shown as a preview with a remove
 * button until it's used.
 */
export function SourceImageUpload({
  url,
  onChange,
  onUploadingChange,
  label = "Image to edit",
  hint,
  required = true,
  compact = false,
}: {
  url: string | null
  onChange: (url: string | null) => void
  onUploadingChange?: (uploading: boolean) => void
  /** What the image is for, shown above the picker. */
  label?: string
  /** One line of guidance under the label. */
  hint?: string
  required?: boolean
  /** A smaller picker, for putting two side by side. */
  compact?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = imageGalleryQuery.useUpload()

  const handleFile = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = ""
    if (!file) return
    if (!file.type.startsWith("image/") || file.size > MAX_FILE_BYTES) {
      toast.error("Choose an image under 10 MB")
      return
    }

    onUploadingChange?.(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      const res = await upload.mutateAsync({ formData })
      if (res?.url) onChange(res.url.split("?")[0])
    } catch {
      toast.error("Failed to upload the image")
    } finally {
      onUploadingChange?.(false)
    }
  }

  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-slate-800">
        {label}{" "}
        {required ? (
          <span className="text-rose-500">*</span>
        ) : (
          <span className="text-xs font-normal text-slate-400">(optional)</span>
        )}
      </p>
      {hint ? <p className="mb-2 text-xs text-slate-500">{hint}</p> : <div className="mb-2" />}
      {url ? (
        <div className="relative inline-block">
          <img
            src={url}
            alt="What you're editing"
            className={`rounded-lg border border-slate-200 bg-white object-contain ${compact ? "max-h-36" : "max-h-48"}`}
          />
          <button
            type="button"
            aria-label="Remove the image"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-slate-900 text-white shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/30"
          >
            <X size={12} aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className={`flex w-full max-w-sm flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-white text-sm font-medium text-slate-500 ${compact ? "h-24" : "h-28"} transition-colors hover:border-[#4C5BD6] hover:text-[#4C5BD6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/20 disabled:opacity-60`}
        >
          {upload.isPending ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <ImagePlus size={20} aria-hidden />
          )}
          {upload.isPending ? "Uploading…" : "Upload an image"}
          <span className="text-xs font-normal text-slate-400">PNG, JPG or WebP, up to 10 MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={`Choose ${label.toLowerCase()}`}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
