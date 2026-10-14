import { createContext, useContext } from "react"

/**
 * A request, from the summary rail, for one section to open (and, inside it, one
 * `ConfigTabs` tab to show); `seq` makes repeats distinct.
 */
export interface SectionOpenRequest {
  id: string
  tab?: string
  seq: number
}

export interface CreateFormContextValue {
  openRequest: SectionOpenRequest | null
}

export const CreateFormContext = createContext<CreateFormContextValue>({ openRequest: null })

export const useCreateFormContext = () => useContext(CreateFormContext)

/** DOM id of a `FormSection`, so the rail can scroll to it. */
export const sectionDomId = (id: string) => `form-section-${id}`
