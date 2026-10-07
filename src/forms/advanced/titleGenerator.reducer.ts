/**
 * State of the "Generate titles" helper on the advanced blog form. The suggestions are
 * remembered so each request can pass the previous ones as `oldTitles` and get fresh ideas.
 */

export interface TitleGeneratorState {
  titles: string[]
  isGenerating: boolean
}

export type TitleGeneratorAction =
  | { type: "GENERATE_START" }
  | { type: "GENERATE_SUCCEEDED"; titles: string[] }
  | { type: "GENERATE_FAILED" }
  | { type: "CLEAR" }

export const initialTitleGeneratorState: TitleGeneratorState = { titles: [], isGenerating: false }

export function titleGeneratorReducer(
  state: TitleGeneratorState,
  action: TitleGeneratorAction
): TitleGeneratorState {
  switch (action.type) {
    case "GENERATE_START":
      return { ...state, isGenerating: true }
    case "GENERATE_SUCCEEDED":
      return { titles: action.titles, isGenerating: false }
    case "GENERATE_FAILED":
      return { ...state, isGenerating: false }
    case "CLEAR":
      return initialTitleGeneratorState
    default:
      return state
  }
}
