import { createContext, useContext } from "react"
import type { ReactNode } from "react"

/**
 * A request, from the summary rail, for one section to open (and, inside it, one
 * `ConfigTabs` tab to show); `seq` makes repeats distinct.
 */
export interface SectionOpenRequest {
  id: string
  tab?: string
  seq: number
}

/** What a `FormSection` header shows for itself, worked out once by the form's summary hook. */
export interface SectionStatus {
  /** Chip in the header, e.g. "Classic" or "3/5 topics". */
  summary?: ReactNode
  /** Everything required in the section is filled in. */
  complete?: boolean
}

export interface CreateFormContextValue {
  openRequest: SectionOpenRequest | null
  /** Per-section header state keyed by `FormSection` id; a section's own props win over it. */
  sections: Record<string, SectionStatus>
}

const NO_SECTIONS: Record<string, SectionStatus> = {}

export const CreateFormContext = createContext<CreateFormContextValue>({
  openRequest: null,
  sections: NO_SECTIONS,
})

export const useCreateFormContext = () => useContext(CreateFormContext)

/** DOM id of a `FormSection`, so the rail can scroll to it. */
export const sectionDomId = (id: string) => `form-section-${id}`
