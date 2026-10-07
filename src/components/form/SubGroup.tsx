import type { ReactNode } from "react"

/**
 * A labeled subdivision inside one `FormSection` body — used in "Advanced options", which
 * intentionally stays a single section (so the form never grows past four groups) but still
 * needs to read as more than one flat list of switches.
 */
export function SubGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-3 border-t border-border/70 pt-4 first:border-t-0 first:pt-0">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h4>
      {children}
    </div>
  )
}
