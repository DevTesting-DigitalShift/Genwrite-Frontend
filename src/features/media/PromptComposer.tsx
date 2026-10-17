import { Loader2, Sparkles } from "lucide-react"
import { AutoVideoForm } from "./AutoVideoForm"
import { ComposerTabs } from "./ComposerTabs"
import { ModeTabs } from "./ModeTabs"
import { PricingNotice } from "./PricingNotice"
import { RefinePromptButton } from "./RefinePromptButton"
import { SettingChip } from "./SettingChip"
import { SourceImageUpload } from "./SourceImageUpload"
import { aspectLabel, imageCredits, qualityLabel, resolutionLabel } from "./imageOptions"
import { formatRate, type MediaComposer } from "./useMediaComposer"

const EXAMPLES = {
  text_to_image: [
    "UGC selfie of a woman holding a skincare serum in warm morning light",
    "Cozy café workspace with a laptop, candid lifestyle shot",
    "Macro product shot of a running sneaker on wet asphalt",
  ],
  image_to_image: [
    "Put the product on a marble kitchen counter in warm morning light",
    "Restyle this as a soft watercolour illustration",
    "Change the background to a clean white studio",
  ],
  text_to_video: [
    "Drone shot flying over a mountain range at sunrise",
    "Slow-motion pour of coffee into a glass, soft studio lighting",
    "Handheld selfie video of a creator unboxing a gadget",
  ],
} as const

const credits = (n: number | null) => (n === null ? undefined : `${n} credit${n === 1 ? "" : "s"}`)

/**
 * The create form: the prompt is the hero. Everything else is a default you can change from one
 * row of chips, and the price sits beside the Generate button instead of in a footnote.
 */
export function PromptComposer({ composer }: { composer: MediaComposer }) {
  const {
    tab,
    setTab,
    prompt,
    setPrompt,
    mode,
    setMode,
    usesPipeline,
    isEdit,
    tabModels,
    currentModel,
    setModel,
    imageOptions,
    imageChoice,
    setImageChoice,
    sourceImageUrl,
    setSourceImageUrl,
    setUploadingSource,
    videoDuration,
    videoDurations,
    setDurationSeconds,
    videoAspects,
    videoAspectRatio,
    setVideoAspectRatio,
    videoResolution,
    videoResolutions,
    setResolution,
    estimatedCredits,
    canGenerate,
    pricingReady,
    pricingFailed,
    retryPricing,
    userCredits,
    isSubmitting,
    handleGenerate,
  } = composer

  const kind = tab === "video" ? "video" : "image"
  const short = estimatedCredits !== null && userCredits < estimatedCredits
  const examples = EXAMPLES[mode as keyof typeof EXAMPLES] ?? []

  return (
    <section
      aria-label="Create media"
      className="rounded-xl border border-slate-200 bg-white shadow-xs"
    >
      <div className="p-4 sm:p-5">
        <div className="mb-4 space-y-3">
          <ComposerTabs value={tab} onChange={setTab} />
          <ModeTabs kind={tab} mode={mode} onChange={setMode} />
        </div>

        {usesPipeline ? (
          <AutoVideoForm mode={mode as "image_to_video" | "reference_to_video"} />
        ) : (
          <>
            {isEdit && (
              <SourceImageUpload
                url={sourceImageUrl}
                onChange={setSourceImageUrl}
                onUploadingChange={setUploadingSource}
              />
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 transition-colors focus-within:border-[#4C5BD6] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#4C5BD6]/15">
              <label htmlFor="media-prompt" className="sr-only">
                Prompt
              </label>
              <textarea
                id="media-prompt"
                className="block min-h-32 w-full resize-none rounded-t-xl bg-transparent p-4 text-base leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 sm:min-h-36 sm:p-5"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    handleGenerate()
                  }
                }}
                placeholder={
                  isEdit
                    ? "Describe the change… e.g. Make the background a sunny beach"
                    : kind === "image"
                      ? "Describe the image you want… e.g. A futuristic city skyline at dusk"
                      : "Describe the video you want… e.g. A drone shot flying over a mountain range at sunrise"
                }
              />
              <div className="flex items-center justify-between gap-3 px-3 pb-3 sm:px-4">
                <span className="hidden text-xs text-slate-400 sm:inline">
                  Ctrl + Enter to generate
                </span>
                {/* Refining rewrites a short idea into a full scene — not what an edit instruction needs. */}
                {!isEdit && (
                  <div className="ml-auto">
                    <RefinePromptButton prompt={prompt} kind={kind} onRefined={setPrompt} />
                  </div>
                )}
              </div>
            </div>

            {prompt.trim() === "" && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Try:</span>
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setPrompt(example)}
                    className="max-w-full truncate rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition-colors hover:border-[#4C5BD6]/40 hover:bg-[#4C5BD6]/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/15"
                  >
                    {example}
                  </button>
                ))}
              </div>
            )}

            {!pricingReady ? (
              <div className="mt-4">
                <PricingNotice failed={pricingFailed} onRetry={retryPricing} />
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <SettingChip
                  label="Model"
                  value={currentModel?.id ?? ""}
                  options={tabModels.map((m) => ({
                    id: m.id,
                    label: m.label,
                    hint: formatRate(m),
                  }))}
                  onChange={setModel}
                />

                {imageOptions && imageChoice && (
                  <>
                    <SettingChip
                      label="Aspect"
                      value={imageChoice.aspectRatio}
                      options={imageOptions.aspectRatios.map((id) => ({
                        id,
                        label: id === "match" ? "Match input" : id,
                        hint: id === "match" ? undefined : aspectLabel(id).replace(` ${id}`, ""),
                      }))}
                      onChange={(aspectRatio) => setImageChoice({ aspectRatio })}
                      note={
                        isEdit
                          ? "The shape of the result. Some models can keep the original's."
                          : "The shape of the image."
                      }
                    />
                    {imageOptions.resolutions.length > 1 && (
                      <SettingChip
                        label="Resolution"
                        value={imageChoice.resolution}
                        options={imageOptions.resolutions.map((id) => ({
                          id,
                          label: resolutionLabel(id),
                          hint: credits(
                            imageCredits(currentModel, { ...imageChoice, resolution: id })
                          ),
                        }))}
                        onChange={(resolution) => setImageChoice({ resolution })}
                        note="Higher resolution costs more."
                      />
                    )}
                    {imageOptions.qualities && (
                      <SettingChip
                        label="Quality"
                        value={imageChoice.quality ?? ""}
                        options={imageOptions.qualities.map((id) => ({
                          id,
                          label: qualityLabel(id),
                          hint: credits(
                            imageCredits(currentModel, { ...imageChoice, quality: id })
                          ),
                        }))}
                        onChange={(quality) => setImageChoice({ quality })}
                        note="Higher quality renders finer detail and text, and costs more."
                      />
                    )}
                  </>
                )}

                {kind === "video" && (
                  <>
                    {videoAspects.length > 0 && (
                      <SettingChip
                        label="Aspect"
                        value={videoAspectRatio ?? ""}
                        options={videoAspects.map((id) => ({
                          id,
                          label: id,
                          hint: aspectLabel(id).replace(` ${id}`, ""),
                        }))}
                        onChange={setVideoAspectRatio}
                        note="The shape of the video — 9:16 for Reels and Shorts, 16:9 for YouTube."
                        disabled={videoAspects.length <= 1}
                      />
                    )}
                    <SettingChip
                      label="Length"
                      value={String(videoDuration)}
                      options={videoDurations.map((d) => ({ id: String(d), label: `${d}s` }))}
                      onChange={(id) => setDurationSeconds(Number(id))}
                      note={
                        currentModel && currentModel.unit !== "second"
                          ? "This model is billed per video — length doesn't change the cost."
                          : undefined
                      }
                      disabled={videoDurations.length <= 1}
                    />
                    {videoResolutions.length > 0 && (
                      <SettingChip
                        label="Resolution"
                        value={videoResolution ?? ""}
                        options={videoResolutions.map((r) => ({ id: r, label: r }))}
                        onChange={(id) => setResolution(id as (typeof videoResolutions)[number])}
                        disabled={videoResolutions.length <= 1}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse items-stretch gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-500">
                <Sparkles size={14} className="text-[#4C5BD6]" aria-hidden />
                <span>
                  Estimated cost{" "}
                  <strong className="font-semibold text-slate-900">
                    {pricingReady && estimatedCredits !== null
                      ? `${estimatedCredits} credit${estimatedCredits === 1 ? "" : "s"}`
                      : "—"}
                  </strong>
                </span>
                <span className={short ? "font-medium text-amber-700" : "text-slate-400"}>
                  · {short ? "not enough credits" : `${userCredits.toLocaleString()} left`}
                </span>
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#4C5BD6] px-7 text-base font-semibold text-white transition-colors hover:bg-[#3B4BB8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/30 disabled:opacity-60 sm:w-auto"
              >
                {isSubmitting ? (
                  <Loader2 className="size-5 animate-spin" aria-label="Starting generation" />
                ) : (
                  `${isEdit ? "Edit" : "Generate"} ${kind === "image" ? "Image" : "Video"}`
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
