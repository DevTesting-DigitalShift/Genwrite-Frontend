export type CampaignFormTab = "basics" | "targets" | "blogs" | "automation"

/** Ephemeral UI state for the campaign form dialog — everything that is NOT a form
 * field (react-hook-form owns those). Kept separate so the dialog's open/close/tab
 * flow doesn't get tangled up with field validation state. */
export interface CampaignFormUIState {
  isOpen: boolean
  editingCampaignId: string | null
  activeTab: CampaignFormTab
  blogSearch: string
}

export type CampaignFormUIAction =
  | { type: "OPEN_CREATE" }
  | { type: "OPEN_EDIT"; campaignId: string }
  | { type: "CLOSE" }
  | { type: "SET_TAB"; tab: CampaignFormTab }
  | { type: "SET_BLOG_SEARCH"; query: string }

export const initialCampaignFormUIState: CampaignFormUIState = {
  isOpen: false,
  editingCampaignId: null,
  activeTab: "basics",
  blogSearch: "",
}
