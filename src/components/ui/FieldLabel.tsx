import type { FC, ReactNode } from "react"

interface FieldLabelProps {
  children: ReactNode
  tip: string
  required?: boolean
  className?: string
  /** id of the control this labels. Pass it to get click-to-focus and screen reader
   *  association; omit it for headings that don't caption a single input. */
  htmlFor?: string
}

/**
 * A minimal label with an inline hover tooltip.
 * Usage: <FieldLabel htmlFor="topic" tip="The core subject…" required>Topic</FieldLabel>
 *
 * Renders a real <label> only when htmlFor is supplied. Without a control to point at, a
 * <label> is a lie to assistive tech — clicking it focuses nothing — so it degrades to a
 * visually identical <span>.
 */
const FieldLabel: FC<FieldLabelProps> = ({
  children,
  tip,
  required = false,
  className = "",
  htmlFor,
}) => {
  const content = (
    <>
      <span className="field-label-tip" data-tip={tip}>
        {children}
        <span className="field-label-icon ml-1.5" aria-hidden="true">
          ?
        </span>
      </span>
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </>
  )

  const classes = `block text-sm font-semibold mb-2 ${className}`

  return htmlFor ? (
    <label htmlFor={htmlFor} className={classes}>
      {content}
    </label>
  ) : (
    <span className={classes}>{content}</span>
  )
}

export default FieldLabel
