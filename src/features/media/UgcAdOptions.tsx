import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Plus, Trash2 } from "lucide-react"
import { PricingAPI, type UgcSceneKind } from "@api/Pricing/Pricing.api"
import {
  DEFAULT_UGC_STRUCTURE,
  MAX_SCENE_SECONDS,
  MAX_UGC_SCENES,
  MIN_SCENE_SECONDS,
  SCENE_KIND_LABELS,
  structureSeconds,
  usableScript,
  type UgcAdSettings,
} from "./ugcAd"

const SCRIPT_PLACEHOLDER = `Optional — paste a ready-made ad script and we'll use it as written:

IMAGE PROMPT: Selfie of a woman in her kitchen holding a phone…
VIDEO PROMPT: 0-3s she looks into the camera and says "…"`

/** The quote inputs the parent already knows; this component adds the scene structure to them. */
export type UgcQuoteBase = {
  videoModel: string
  resolution: string | null
  productImages: number
  subtitles: boolean
}

const useDebounced = <T,>(value: T, ms = 500) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

/** Live exact price (and the scenes a pasted script will run to) from the backend. */
export function useUgcQuote(settings: UgcAdSettings, base: UgcQuoteBase, enabled: boolean) {
  const script = useDebounced(usableScript(settings.script))
  return useQuery({
    queryKey: ["ugc-quote", base, settings.structure, script, settings.pacing],
    queryFn: () =>
      PricingAPI.quoteUgcAd({
        ...base,
        ...(script ? { script } : { structure: settings.structure }),
        pacing: settings.pacing,
      }),
    enabled: enabled && Boolean(base.videoModel),
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  })
}

/**
 * UGC ads: choose a single clip or a multi-scene ad (each scene its own shot, stitched), edit
 * the scene structure or paste a finished script, and control the audio. The scenes shown under
 * a pasted script come from the backend, because pacing can lengthen them.
 */
export function UgcAdOptions({
  settings,
  onChange,
  scenes,
  warnings,
}: {
  settings: UgcAdSettings
  onChange: (next: UgcAdSettings) => void
  scenes?: { index: number; kind: UgcSceneKind; title: string | null; durationSeconds: number }[]
  warnings?: string[]
}) {
  const set = (patch: Partial<UgcAdSettings>) => onChange({ ...settings, ...patch })
  const hasScript = Boolean(usableScript(settings.script))
  const updateScene = (i: number, patch: Partial<UgcAdSettings["structure"][number]>) =>
    set({ structure: settings.structure.map((s, j) => (j === i ? { ...s, ...patch } : s)) })

  return (
    <div className="mb-5 sm:mb-6 rounded-xl border border-slate-200 p-3 sm:p-4 space-y-4">
      <div role="radiogroup" aria-label="Ad format" className="grid grid-cols-2 gap-2">
        {(
          [
            ["single", "One clip", "A single shot, like any Auto Video run"],
            ["multi", "Multi-scene ad", "Hook → demo → wrap-up, each its own shot, stitched"],
          ] as const
        ).map(([id, title, hint]) => (
          // biome-ignore lint/a11y/useSemanticElements: styled radio card; a native input would lose the card layout
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={settings.mode === id}
            onClick={() => set({ mode: id })}
            className={`rounded-lg border p-3 text-left transition-colors ${
              settings.mode === id
                ? "border-[#4C5BD6] bg-[#4C5BD6]/5"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className="block text-sm font-semibold text-slate-800">{title}</span>
            <span className="block text-xs text-slate-500">{hint}</span>
          </button>
        ))}
      </div>

      {settings.mode === "multi" && (
        <>
          {!hasScript && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                Scenes · {structureSeconds(settings.structure)}s in total
              </p>
              {settings.structure.map((scene, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: scenes have no id; they are positional and edited by index
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 text-xs font-bold text-slate-400">{i + 1}</span>
                  <select
                    aria-label={`Scene ${i + 1} type`}
                    className="select outline-0 h-10 min-w-0 flex-1 rounded-lg border border-gray-200 text-sm"
                    value={scene.kind}
                    onChange={(e) => updateScene(i, { kind: e.target.value as UgcSceneKind })}
                  >
                    {(Object.keys(SCENE_KIND_LABELS) as UgcSceneKind[]).map((k) => (
                      <option key={k} value={k}>
                        {SCENE_KIND_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label={`Scene ${i + 1} seconds`}
                    type="number"
                    min={MIN_SCENE_SECONDS}
                    max={MAX_SCENE_SECONDS}
                    className="input outline-0 h-10 w-20 rounded-lg border border-gray-200 text-sm"
                    value={scene.durationSeconds}
                    onChange={(e) =>
                      updateScene(i, {
                        durationSeconds: Math.min(
                          MAX_SCENE_SECONDS,
                          Math.max(MIN_SCENE_SECONDS, Math.round(Number(e.target.value) || 0))
                        ),
                      })
                    }
                  />
                  <span className="text-xs text-slate-400">s</span>
                  <button
                    type="button"
                    aria-label={`Remove scene ${i + 1}`}
                    disabled={settings.structure.length <= 1}
                    onClick={() => set({ structure: settings.structure.filter((_, j) => j !== i) })}
                    className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={settings.structure.length >= MAX_UGC_SCENES}
                  onClick={() =>
                    set({
                      structure: [...settings.structure, { kind: "talk", durationSeconds: 5 }],
                    })
                  }
                  className="flex items-center gap-1 text-xs font-semibold text-[#4C5BD6] disabled:opacity-40"
                >
                  <Plus size={13} /> Add scene
                </button>
                <button
                  type="button"
                  onClick={() => set({ structure: DEFAULT_UGC_STRUCTURE })}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="ugc-script" className="text-xs font-semibold text-slate-700">
              Ready-made script
            </label>
            <textarea
              id="ugc-script"
              className="textarea w-full min-h-28 rounded-xl p-3 text-xs outline-0 border border-slate-200 bg-slate-50 resize-y font-mono"
              value={settings.script}
              onChange={(e) => set({ script: e.target.value })}
              maxLength={60000}
              placeholder={SCRIPT_PLACEHOLDER}
            />
          </div>

          {hasScript && scenes && scenes.length > 0 && (
            <ol className="space-y-1 text-xs text-slate-600">
              {scenes.map((s) => (
                <li key={s.index} className="flex justify-between gap-3">
                  <span className="truncate">
                    {s.index + 1}. {s.title || SCENE_KIND_LABELS[s.kind]}
                  </span>
                  <span className="shrink-0 font-semibold text-slate-700">
                    {s.durationSeconds}s
                  </span>
                </li>
              ))}
            </ol>
          )}

          {warnings && warnings.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <ul className="space-y-1">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm mt-0.5"
                checked={settings.pacing === "natural"}
                onChange={(e) => set({ pacing: e.target.checked ? "natural" : "as_written" })}
              />
              <span className="text-sm">
                <span className="font-semibold text-slate-800">Natural speaking pace</span>
                <span className="block text-xs text-slate-500">
                  Lengthens a scene whose speech would sound rushed. Off keeps your timings.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm mt-0.5"
                checked={settings.masterAudio}
                onChange={(e) => set({ masterAudio: e.target.checked })}
              />
              <span className="text-sm">
                <span className="font-semibold text-slate-800">Level the sound</span>
                <span className="block text-xs text-slate-500">
                  One even volume across scenes, less rumble and harsh hiss.
                </span>
              </span>
            </label>
          </div>
        </>
      )}
    </div>
  )
}
