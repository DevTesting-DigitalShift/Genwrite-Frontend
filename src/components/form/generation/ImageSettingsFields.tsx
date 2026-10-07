import { useCallback } from "react"
import { Controller, useFormContext } from "react-hook-form"
import type { FieldValues } from "react-hook-form"
import { toast } from "sonner"
import ImageSourceSelector from "@components/ImageSourceSelector"
import { Switch } from "@components/ui/switch"
import { BLOG_CONFIG } from "@/data/blogConfig"
import { IMAGE_SOURCE } from "@/data/blogData"

interface UploadedImage {
  originFileObj: File
  name: string
  type: string
  src: string
}

const readAsImage = (file: File) =>
  new Promise<UploadedImage>((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) =>
      resolve({
        originFileObj: file,
        name: file.name,
        type: file.type,
        src: event.target?.result as string,
      })
    reader.readAsDataURL(file)
  })

/**
 * "Add images" switch → source cards → (optionally) the upload dropzone. The switch is not
 * stored: images are on exactly when `imageSource` is not "none", which is what the backend
 * keeps on the Blog, so there is no second flag to fall out of sync with it.
 * Fields: `imageSource`, `numberOfImages`, and `blogImages` when `allowUpload`.
 */
export function ImageSettingsFields({ allowUpload = false }: { allowUpload?: boolean }) {
  const { control, setValue, getValues, clearErrors } = useFormContext<FieldValues>()

  const addFiles = useCallback(
    async (incoming: File[]) => {
      const current: UploadedImage[] = getValues("blogImages") ?? []
      const max = BLOG_CONFIG.IMAGES.MAX_UPLOAD_COUNT
      if (current.length + incoming.length > max) {
        toast.error(`You can upload a maximum of ${max} images.`)
        return
      }
      const maxBytes = BLOG_CONFIG.IMAGES.MAX_FILE_SIZE_MB * 1024 * 1024
      if (incoming.some((file) => file.size > maxBytes)) {
        toast.error(`Each image must be ${BLOG_CONFIG.IMAGES.MAX_FILE_SIZE_MB}MB or less.`)
        return
      }
      const images = await Promise.all(incoming.map(readAsImage))
      setValue("blogImages", [...current, ...images], { shouldDirty: true })
      clearErrors("blogImages")
    },
    [getValues, setValue, clearErrors]
  )

  return (
    <Controller
      control={control}
      name="imageSource"
      render={({ field, fieldState }) => {
        const enabled = field.value && field.value !== IMAGE_SOURCE.NONE
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Add images</p>
                <p className="text-xs text-muted-foreground">
                  Search and add relevant images to your blog
                </p>
              </div>
              <Switch
                size="large"
                checked={!!enabled}
                onCheckedChange={(checked) => {
                  field.onChange(checked ? IMAGE_SOURCE.STOCK : IMAGE_SOURCE.NONE)
                  clearErrors(["numberOfImages", "blogImages"])
                }}
              />
            </div>

            {enabled && (
              <div className="space-y-4">
                <Controller
                  control={control}
                  name="numberOfImages"
                  render={({ field: count, fieldState: countState }) => (
                    <>
                      <ImageSourceSelector
                        value={field.value}
                        onChange={(source) => {
                          field.onChange(source)
                          clearErrors(["numberOfImages", "blogImages"])
                        }}
                        showUpload={allowUpload}
                        error={fieldState.error?.message}
                        numberOfImages={count.value}
                        onNumberChange={count.onChange}
                      />
                      {countState.error && (
                        <p className="text-xs text-destructive">{countState.error.message}</p>
                      )}
                    </>
                  )}
                />

                {allowUpload && field.value === IMAGE_SOURCE.UPLOAD && (
                  <Controller
                    control={control}
                    name="blogImages"
                    render={({ field: files, fieldState: filesState }) => {
                      const list: UploadedImage[] = files.value ?? []
                      return (
                        <div className="space-y-3">
                          {/* A drop target holding block content, which a <button> cannot;
                              role + tabIndex + onKeyDown give it the same keyboard behaviour. */}
                          {/* biome-ignore lint/a11y/useSemanticElements: see comment above */}
                          <div
                            role="button"
                            tabIndex={0}
                            aria-label="Upload images"
                            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                              filesState.error
                                ? "border-destructive bg-destructive/5"
                                : "border-border bg-muted/40 hover:border-primary"
                            }`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                e.currentTarget.click()
                              }
                            }}
                            onClick={() => {
                              const input = document.createElement("input")
                              input.type = "file"
                              input.accept = BLOG_CONFIG.IMAGES.ALLOWED_TYPES.join(",")
                              input.multiple = true
                              input.onchange = () => void addFiles(Array.from(input.files ?? []))
                              input.click()
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault()
                              void addFiles(
                                Array.from(e.dataTransfer.files).filter((f) =>
                                  f.type.startsWith("image/")
                                )
                              )
                            }}
                          >
                            <p className="text-sm font-semibold">Click or drag images here</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              PNG, JPEG, WEBP · up to {BLOG_CONFIG.IMAGES.MAX_UPLOAD_COUNT} images ·{" "}
                              {BLOG_CONFIG.IMAGES.MAX_FILE_SIZE_MB}MB each
                            </p>
                          </div>
                          {filesState.error && (
                            <p className="text-xs text-destructive">{filesState.error.message}</p>
                          )}
                          {list.length > 0 && (
                            <>
                              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                {list.map((img, i) => (
                                  <div key={img.src} className="group relative aspect-square">
                                    <img
                                      src={img.src}
                                      alt={`Upload ${i + 1}`}
                                      className="h-full w-full rounded-lg border border-border object-cover"
                                    />
                                    <button
                                      type="button"
                                      aria-label={`Remove image ${i + 1}`}
                                      onClick={() => files.onChange(list.filter((im) => im !== img))}
                                      className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <p className="text-right text-xs text-muted-foreground">
                                {list.length} / {BLOG_CONFIG.IMAGES.MAX_UPLOAD_COUNT} images uploaded
                              </p>
                            </>
                          )}
                        </div>
                      )
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )
      }}
    />
  )
}
