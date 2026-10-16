import { MEDIA_MODE_HINTS, MEDIA_MODE_LABELS, MODES_BY_KIND, type MediaMode } from "./mediaModes"
import type { ComposerTab } from "./useMediaComposer"

/**
 * What the user is starting from — nothing (text), one generated opening frame, or their own
 * reference images. A tab with a single mode shows no switch, just the one-line hint, so the
 * form is never asking a question that has only one answer.
 */
export function ModeTabs({
  kind,
  mode,
  onChange,
}: {
  kind: ComposerTab
  mode: MediaMode
  onChange: (mode: MediaMode) => void
}) {
  const modes = MODES_BY_KIND[kind]
  return (
    <div className="space-y-2">
      {modes.length > 1 && (
        <div
          role="tablist"
          aria-label="Start from"
          className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1"
        >
          {modes.map((m) => {
            const active = m === mode
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(m)}
                className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/20 ${
                  active
                    ? "bg-[#4C5BD6]/10 text-[#4C5BD6]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {MEDIA_MODE_LABELS[m]}
              </button>
            )
          })}
        </div>
      )}
      <p className="text-sm text-slate-500">{MEDIA_MODE_HINTS[mode]}</p>
    </div>
  )
}
