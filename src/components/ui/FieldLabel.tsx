import type { FC, ReactNode } from "react"

interface FieldLabelProps {
  children: ReactNode
  tip: string
  required?: boolean
  className?: string
}

/**
 * A minimal label with an inline hover tooltip.
 * Usage: <FieldLabel tip="The core subject…" required>Topic</FieldLabel>
 */
const FieldLabel: FC<FieldLabelProps> = ({ children, tip, required = false, className = "" }) => {
  return (
    <label className={`block text-sm font-semibold mb-2 ${className}`}>
      <span className="field-label-tip" data-tip={tip}>
        {children}
        <span className="field-label-icon ml-1.5" aria-hidden="true">
          ?
        </span>
      </span>
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

export default FieldLabel
