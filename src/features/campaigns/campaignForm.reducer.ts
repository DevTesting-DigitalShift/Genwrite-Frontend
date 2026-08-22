import { useMemo, useReducer } from "react"
import type { CampaignFormUIAction, CampaignFormUIState } from "./campaignForm.types"
import { initialCampaignFormUIState } from "./campaignForm.types"

export function campaignFormUIReducer(
  state: CampaignFormUIState,
  action: CampaignFormUIAction
): CampaignFormUIState {
  switch (action.type) {
    case "OPEN_CREATE":
      return { ...initialCampaignFormUIState, isOpen: true }
    case "OPEN_EDIT":
      return { ...initialCampaignFormUIState, isOpen: true, editingCampaignId: action.campaignId }
    case "CLOSE":
      return { ...state, isOpen: false }
    case "SET_TAB":
      return { ...state, activeTab: action.tab }
    case "SET_BLOG_SEARCH":
      return { ...state, blogSearch: action.query }
    default:
      return state
  }
}

/**
 * Wraps the reducer with a stable set of callback handles, so components consuming
 * it (the dialog, the list page's "New campaign" / "Edit" buttons) don't each
 * re-derive their own `dispatch({ type: ... })` calls — one set of intents, reused
 * everywhere this form opens from.
 */
export function useCampaignFormUI() {
  const [state, dispatch] = useReducer(campaignFormUIReducer, initialCampaignFormUIState)

  const actions = useMemo(
    () => ({
      openCreate: () => dispatch({ type: "OPEN_CREATE" }),
      openEdit: (campaignId: string) => dispatch({ type: "OPEN_EDIT", campaignId }),
      close: () => dispatch({ type: "CLOSE" }),
      setTab: (tab: CampaignFormUIState["activeTab"]) => dispatch({ type: "SET_TAB", tab }),
      setBlogSearch: (query: string) => dispatch({ type: "SET_BLOG_SEARCH", query }),
    }),
    []
  )

  return { state, actions }
}
