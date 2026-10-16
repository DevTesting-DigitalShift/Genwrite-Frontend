import { Loader2, Sparkles } from "lucide-react"
import { AutoVideoForm } from "./AutoVideoForm"
import { ComposerTabs } from "./ComposerTabs"
import { RefinePromptButton } from "./RefinePromptButton"
import { SettingChip } from "./SettingChip"
import { PURPOSES, type Purpose } from "./mediaOptions"
import { formatRate, type MediaComposer } from "./useMediaComposer"

const EXAMPLES = {
  image: [
    "UGC selfie of a woman holding a skincare serum in warm morning light",
    "Cozy café workspace with a laptop, candid lifestyle shot",
    "Macro product shot of a running sneaker on wet asphalt",
  ],
  video: [
    "Drone shot flying over a mountain range at sunrise",
    "Slow-motion pour of coffee into a glass, soft studio lighting",
    "Handheld selfie video of a creator unboxing a gadget",
  ],
} as const

const SIZE_OPTIONS = [0.25, 0.5, 1, 2, 4].map((mp) => ({ id: String(mp), label: `${mp} MP` }))

/**
 * Layout A: the prompt is the hero. Everything else is a default you can change from one row of
 * chips, and the price sits beside the Generate button instead of in a footnote.
 */
export function PromptComposer({ composer }: { composer: MediaComposer }) {
  const {
    tab,
    setTab,
    prompt,
    setPrompt,
    purpose,
    setPurpose,
    tabModels,
    currentModel,
    setModel,
    megapixels,
    setMegapixels,
    videoDuration,
    videoDurations,
    setDurationSeconds,
    videoResolution,
    videoResolutions,
    setResolution,
    estimatedCredits,
    userCredits,
    isSubmitting,
    handleGenerate,
  } = composer

  const kind = tab === "video" ? "video" : "image"
  const short = userCredits < estimatedCredits

  return (
    <section
      aria-label="Create media"
      className="rounded-xl border border-slate-200 bg-white shadow-xs"
    >
      <div className="p-4 sm:p-5">
        <div className="mb-4">
          <ComposerTabs value={tab} onChange={setTab} />
        </div>

        {tab === "auto" ? (
          <AutoVideoForm />
        ) : (
          <>
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
                  kind === "image"
                    ? "Describe the image you want… e.g. A futuristic city skyline at dusk"
                    : "Describe the video you want… e.g. A drone shot flying over a mountain range at sunrise"
                }
              />
              <div className="flex items-center justify-between gap-3 px-3 pb-3 sm:px-4">
                <span className="hidden text-xs text-slate-400 sm:inline">
                  Ctrl + Enter to generate
                </span>
                <div className="ml-auto">
                  <RefinePromptButton
                    prompt={prompt}
                    kind={kind}
                    purpose={purpose}
                    onRefined={setPrompt}
                  />
                </div>
              </div>
            </div>

            {prompt.trim() === "" && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Try:</span>
                {EXAMPLES[kind].map((example) => (
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

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SettingChip
                label="Model"
                value={currentModel?.id ?? ""}
                options={tabModels.map((m) => ({ id: m.id, label: m.label, hint: formatRate(m) }))}
                onChange={setModel}
              />
              <SettingChip
                label="Purpose"
                value={purpose}
                options={PURPOSES.map((p) => ({ id: p.id, label: p.label }))}
                onChange={(id) => setPurpose(id as Purpose)}
                note="Just a tag for organizing your library — it doesn't change the output."
              />
              {kind === "image" && currentModel?.unit === "megapixel" && (
                <SettingChip
                  label="Size"
                  value={String(megapixels)}
                  options={SIZE_OPTIONS}
                  onChange={(id) => setMegapixels(Number(id))}
                  note="Used for the cost estimate only — the model sets the real output size."
                />
              )}
              {kind === "video" && (
                <>
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

            <div className="mt-5 flex flex-col-reverse items-stretch gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-500">
                <Sparkles size={14} className="text-[#4C5BD6]" aria-hidden />
                <span>
                  Estimated cost{" "}
                  <strong className="font-semibold text-slate-900">
                    {estimatedCredits} credit{estimatedCredits === 1 ? "" : "s"}
                  </strong>
                </span>
                <span className={short ? "font-medium text-amber-700" : "text-slate-400"}>
                  · {short ? "not enough credits" : `${userCredits.toLocaleString()} left`}
                </span>
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#4C5BD6] px-7 text-base font-semibold text-white transition-colors hover:bg-[#3B4BB8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/30 disabled:opacity-60 sm:w-auto"
              >
                {isSubmitting ? (
                  <Loader2 className="size-5 animate-spin" aria-label="Starting generation" />
                ) : (
                  `Generate ${kind === "image" ? "Image" : "Video"}`
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
