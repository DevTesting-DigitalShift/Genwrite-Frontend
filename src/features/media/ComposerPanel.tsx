import { Check, Loader2, Sparkles } from "lucide-react"
import { AutoVideoForm } from "./AutoVideoForm"
import { ComposerTabs } from "./ComposerTabs"
import { RefinePromptButton } from "./RefinePromptButton"
import { PURPOSES } from "./mediaOptions"
import { formatRate, type MediaComposer } from "./useMediaComposer"

const SIZE_OPTIONS = [0.25, 0.5, 1, 2, 4]

function FieldLabel({ children, hint }: { children: string; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{children}</h3>
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </div>
  )
}

/** Small segmented radio group (duration, resolution, size). */
function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  format = String,
  disabled = false,
}: {
  label: string
  value: T
  options: T[]
  onChange: (v: T) => void
  format?: (v: T) => string
  disabled?: boolean
}) {
  return (
    <fieldset aria-label={label} className="m-0 flex min-w-0 rounded-lg border-0 bg-slate-100 p-1">
      {options.map((o) => {
        const active = o === value
        return (
          <button
            key={String(o)}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(o)}
            className={`flex-1 rounded-md px-2 py-1.5 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/20 disabled:cursor-default ${
              active ? "bg-white text-[#4C5BD6] shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {format(o)}
          </button>
        )
      })}
    </fieldset>
  )
}

/**
 * Layout B: the whole create form as one vertical panel — scrollable fields on top, the price
 * and Generate button pinned at the bottom so they never scroll out of reach.
 */
export function ComposerPanel({ composer }: { composer: MediaComposer }) {
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="@container min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-5">
        <ComposerTabs value={tab} onChange={setTab} fullWidth />

        {tab === "auto" ? (
          <AutoVideoForm compact />
        ) : (
          <>
            <section>
              <FieldLabel>Prompt</FieldLabel>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 transition-colors focus-within:border-[#4C5BD6] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#4C5BD6]/15">
                <textarea
                  id="media-prompt"
                  aria-label="Prompt"
                  rows={6}
                  className="block w-full resize-none rounded-t-xl bg-transparent p-3.5 text-[15px] leading-relaxed text-slate-900 outline-none placeholder:text-slate-400"
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
                      ? "Describe the image you want…"
                      : "Describe the video you want…"
                  }
                />
                <div className="flex justify-end px-2.5 pb-2.5">
                  <RefinePromptButton
                    prompt={prompt}
                    kind={kind}
                    purpose={purpose}
                    onRefined={setPrompt}
                  />
                </div>
              </div>
            </section>

            <section>
              <FieldLabel hint={kind === "image" ? "Cheapest first" : undefined}>Model</FieldLabel>
              <fieldset
                aria-label="Model"
                className="m-0 grid min-w-0 gap-2 border-0 p-0 @md:grid-cols-2"
              >
                {tabModels.map((m, i) => {
                  const active = m.id === currentModel?.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setModel(m.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/20 ${
                        active
                          ? "border-[#4C5BD6] bg-[#4C5BD6]/5"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900">
                            {m.label}
                          </span>
                          {i === 0 && kind === "image" && (
                            <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              Best value
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-slate-500">{formatRate(m)}</span>
                      </span>
                      {active && <Check className="size-4 shrink-0 text-[#4C5BD6]" aria-hidden />}
                    </button>
                  )
                })}
              </fieldset>
            </section>

            <section>
              <FieldLabel hint="Tag only — doesn't change the output">Purpose</FieldLabel>
              <fieldset
                aria-label="Purpose"
                className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0"
              >
                {PURPOSES.map((p) => {
                  const active = p.id === purpose
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPurpose(p.id)}
                      className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/20 ${
                        active
                          ? "border-[#4C5BD6] bg-[#4C5BD6] text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </fieldset>
            </section>

            {kind === "image" && currentModel?.unit === "megapixel" && (
              <section>
                <FieldLabel hint="Cost estimate only">Size</FieldLabel>
                <Segmented
                  label="Size in megapixels"
                  value={megapixels}
                  options={SIZE_OPTIONS}
                  onChange={setMegapixels}
                  format={(v) => `${v} MP`}
                />
              </section>
            )}

            {kind === "video" && (
              <div className="grid grid-cols-1 gap-6 @md:grid-cols-2">
                <section>
                  <FieldLabel
                    hint={
                      currentModel && currentModel.unit !== "second"
                        ? "Same price at any length"
                        : undefined
                    }
                  >
                    Length
                  </FieldLabel>
                  <Segmented
                    label="Video length in seconds"
                    value={videoDuration}
                    options={videoDurations}
                    onChange={setDurationSeconds}
                    format={(v) => `${v}s`}
                    disabled={videoDurations.length <= 1}
                  />
                </section>
                {videoResolutions.length > 0 && (
                  <section>
                    <FieldLabel>Resolution</FieldLabel>
                    <Segmented
                      label="Resolution"
                      value={videoResolution ?? videoResolutions[0]}
                      options={videoResolutions}
                      onChange={setResolution}
                      disabled={videoResolutions.length <= 1}
                    />
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {tab !== "auto" && (
        <div className="shrink-0 border-t border-slate-200 bg-white p-4 sm:p-5">
          <p className="mb-3 flex flex-wrap items-center justify-between gap-x-3 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#4C5BD6]" aria-hidden />
              <strong className="font-semibold text-slate-900">
                {estimatedCredits} credit{estimatedCredits === 1 ? "" : "s"}
              </strong>
            </span>
            <span className={short ? "font-medium text-amber-700" : "text-slate-400"}>
              {short ? "Not enough credits" : `${userCredits.toLocaleString()} left`}
            </span>
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-[#4C5BD6] text-base font-semibold text-white transition-colors hover:bg-[#3B4BB8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/30 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="size-5 animate-spin" aria-label="Starting generation" />
            ) : (
              `Generate ${kind === "image" ? "Image" : "Video"}`
            )}
          </button>
        </div>
      )}
    </div>
  )
}
