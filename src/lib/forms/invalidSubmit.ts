import type { BaseSyntheticEvent } from "react"
import type { FieldErrors, FieldValues } from "react-hook-form"
import { toast } from "sonner"

const FOCUSABLE =
  'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Leaf errors in an RHF error tree — `referenceLinks.2` counts once, its parent array doesn't. */
export function countFieldErrors(errors: FieldErrors | undefined): number {
  if (!errors || typeof errors !== "object") return 0
  let count = 0
  for (const [key, value] of Object.entries(errors)) {
    // `ref` points at the DOM node / field ref, `types` at per-rule messages — neither is a child.
    if (key === "ref" || key === "types" || !value || typeof value !== "object") continue
    const nested = countFieldErrors(value as FieldErrors)
    if (nested > 0) count += nested
    else if ("message" in value && value.message) count += 1
  }
  return count
}

/**
 * `getClientRects` is empty for anything `display: none` — the other breakpoint's copy of a
 * responsive field, or a section body that's still collapsed.
 */
const isRendered = (el: HTMLElement) => el.getClientRects().length > 0

export interface FirstInvalidField {
  label?: string
  message: string
  element: HTMLElement
}

/**
 * The first error the user can actually see, in page order. Works off the DOM rather than the
 * error object so "first" means top-most on screen (the error object's key order is the
 * schema's, not the layout's), and so no form needs a path → label map. Every RHF field renders
 * its message as `[role=alert]` inside a `[data-field-shell]` (see `FieldShell`). Within the
 * shell, focus goes to `[data-focus-on-error]` if a field marks one (the template grid's first
 * card, rather than its search box), else the invalid control, else the first focusable.
 */
export function findFirstInvalidField(root: ParentNode): FirstInvalidField | null {
  const alerts = Array.from(root.querySelectorAll<HTMLElement>('[role="alert"]'))
  const alert = alerts.find((el) => isRendered(el) && el.textContent?.trim())
  if (!alert) return null

  const shell = alert.closest<HTMLElement>("[data-field-shell]")
  const firstRendered = (selector: string) =>
    Array.from(shell?.querySelectorAll<HTMLElement>(selector) ?? []).find(isRendered)
  const control =
    firstRendered("[data-focus-on-error]") ??
    firstRendered('[aria-invalid="true"]') ??
    firstRendered(FOCUSABLE)

  return {
    label: shell?.dataset.fieldLabel || undefined,
    message: alert.textContent?.trim() ?? "",
    element: control ?? shell ?? alert,
  }
}

/** Scrolls `element` to the middle of the screen and moves focus to it. */
export function revealAndFocus(element: HTMLElement) {
  element.scrollIntoView({ behavior: "smooth", block: "center" })
  if (element.tabIndex < 0 && !element.matches(FOCUSABLE)) element.tabIndex = -1
  element.focus({ preventScroll: true })
}

/**
 * The `onInvalid` half of `handleSubmit` for page-level forms: say how many fields need fixing
 * and what the first one is, then scroll to it and focus it.
 *
 * It waits two frames before looking at the DOM. Error messages render on the commit after
 * validation, and `FormSection`s holding an error open themselves in an effect after that —
 * until both have landed, the field isn't on screen to find or focus.
 */
export function onInvalidSubmit<T extends FieldValues>(
  errors: FieldErrors<T>,
  event?: BaseSyntheticEvent
) {
  const form = (event?.target as HTMLElement | undefined)?.closest("form") ?? document
  const total = countFieldErrors(errors as FieldErrors)

  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const first = findFirstInvalidField(form)
      const title =
        total > 1 ? `${total} fields need your attention` : "One field needs your attention"
      const description = first
        ? `${first.label ? `${first.label}: ` : ""}${first.message}`
        : "Check the highlighted fields."

      toast.error(title, { id: "form-invalid", description })
      if (first) revealAndFocus(first.element)
    })
  )
}
