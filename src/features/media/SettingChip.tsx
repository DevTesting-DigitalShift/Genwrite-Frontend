import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type ChipOption = { id: string; label: string; hint?: string }

/**
 * A compact "Label: value ▾" button that opens a list of options. It replaces a full-width
 * <select> so a form with five settings takes one row instead of five stacked fields, while
 * the defaults stay visible at a glance. Listbox semantics + Radix focus handling keep it
 * keyboard-usable; a `note` explains what the setting does without a permanent helper line.
 */
export function SettingChip({
  label,
  value,
  options,
  onChange,
  note,
  disabled = false,
}: {
  label: string
  value: string
  options: ChipOption[]
  onChange: (id: string) => void
  note?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.id === value)
  const interactive = !disabled && options.length > 1

  const trigger = (
    <button
      type="button"
      disabled={!interactive}
      aria-label={`${label}: ${selected?.label ?? "none"}`}
      className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:border-[#4C5BD6] focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/15 disabled:cursor-default disabled:bg-slate-50 disabled:hover:border-slate-200 data-[state=open]:border-[#4C5BD6]"
    >
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="truncate font-semibold text-slate-900">{selected?.label ?? "—"}</span>
      {interactive && <ChevronDown className="size-3.5 shrink-0 text-slate-400" aria-hidden />}
    </button>
  )

  if (!interactive) return trigger

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(22rem,calc(100vw-2rem))] p-1.5"
        onOpenAutoFocus={(e) => {
          // Land on the selected option so arrow-key users start where they are.
          e.preventDefault()
          const el = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(
            '[aria-selected="true"]'
          )
          el?.focus()
        }}
      >
        {note && <p className="px-2.5 pb-1.5 pt-1 text-xs text-slate-500">{note}</p>}
        <div role="listbox" aria-label={label} className="max-h-72 overflow-y-auto">
          {options.map((o) => {
            const active = o.id === value
            return (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(o.id)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:bg-slate-100 ${
                  active ? "bg-[#4C5BD6]/8 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{o.label}</span>
                  {o.hint && (
                    <span className="block truncate text-xs text-slate-500">{o.hint}</span>
                  )}
                </span>
                {active && <Check className="size-4 shrink-0 text-[#4C5BD6]" aria-hidden />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
