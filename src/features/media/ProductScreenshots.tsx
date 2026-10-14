import { useRef } from "react"
import { ImagePlus, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { imageGalleryQuery } from "@api/ImageGallery/ImageGallery.query"

export const MAX_PRODUCT_SCREENSHOTS = 3
const MAX_FILE_BYTES = 10 * 1024 * 1024

/**
 * UGC ads: up to three real screenshots of the product/app. They're uploaded straight away
 * (to the user's own storage) and the video then shows that exact screen on the phone the
 * presenter holds, instead of an invented one.
 */
export function ProductScreenshots({
  urls,
  onChange,
  onUploadingChange,
}: {
  urls: string[]
  onChange: (urls: string[]) => void
  onUploadingChange?: (uploading: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = imageGalleryQuery.useUpload()
  const remaining = MAX_PRODUCT_SCREENSHOTS - urls.length

  const handleFiles = async (files: FileList | null) => {
    const picked = Array.from(files ?? []).slice(0, remaining)
    if (inputRef.current) inputRef.current.value = ""
    if (picked.length === 0) return

    const bad = picked.find((f) => !f.type.startsWith("image/") || f.size > MAX_FILE_BYTES)
    if (bad) {
      toast.error("Screenshots must be images under 10 MB")
      return
    }

    onUploadingChange?.(true)
    try {
      const uploaded: string[] = []
      for (const file of picked) {
        const formData = new FormData()
        formData.append("image", file)
        const res = await upload.mutateAsync({ formData })
        if (res?.url) uploaded.push(res.url.split("?")[0])
      }
      onChange([...urls, ...uploaded])
    } catch {
      toast.error("Failed to upload a screenshot")
    } finally {
      onUploadingChange?.(false)
    }
  }

  return (
    <div className="mb-5 sm:mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
      <div className="mb-2">
        <p className="text-sm font-semibold text-slate-800">Product screenshots</p>
        <p className="text-xs text-slate-500">
          Add up to {MAX_PRODUCT_SCREENSHOTS} real screens of your app or product. The presenter
          will show exactly this screen on a device, instead of an invented one: the one you name in
          the description (laptop, phone…), otherwise the best fit for your screens. The first one
          is the main screen.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {urls.map((url, i) => (
          <div key={url} className="relative w-20 sm:w-24">
            <img
              src={url}
              alt={`Screenshot ${i + 1}`}
              className="aspect-[9/16] w-full rounded-lg border border-slate-200 bg-white object-cover"
            />
            <button
              type="button"
              aria-label={`Remove screenshot ${i + 1}`}
              onClick={() => onChange(urls.filter((u) => u !== url))}
              className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-slate-900 text-white shadow"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="flex aspect-[9/16] w-20 sm:w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-white text-xs font-medium text-slate-500 hover:border-[#4C5BD6] hover:text-[#4C5BD6] disabled:opacity-60"
          >
            {upload.isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ImagePlus size={20} />
            )}
            {upload.isPending ? "Uploading" : "Add"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </div>
  )
}
