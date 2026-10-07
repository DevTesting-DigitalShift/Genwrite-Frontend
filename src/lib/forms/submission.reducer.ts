/**
 * Submit/cancel lifecycle shared by every create form. Kept as a pure reducer (the hook in
 * `useFormSubmission.ts` just wires it to React) so the transitions are testable and each
 * form's own submit hook holds only what is specific to it: the payload and the API call.
 */

export type SubmissionStatus = "idle" | "submitting" | "failed"

export interface SubmissionState {
  status: SubmissionStatus
  error: string | null
}

export type SubmissionAction =
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCEEDED" }
  | { type: "SUBMIT_FAILED"; error: string }
  /** Credits ran out or the user backed out of a confirmation: nothing was sent. */
  | { type: "SUBMIT_ABORTED" }
  | { type: "RESET" }

export const initialSubmissionState: SubmissionState = { status: "idle", error: null }

export function submissionReducer(
  state: SubmissionState,
  action: SubmissionAction
): SubmissionState {
  switch (action.type) {
    case "SUBMIT_START":
      // A second click while a request is in flight must not start another one.
      return state.status === "submitting" ? state : { status: "submitting", error: null }
    case "SUBMIT_SUCCEEDED":
    case "SUBMIT_ABORTED":
    case "RESET":
      return initialSubmissionState
    case "SUBMIT_FAILED":
      return { status: "failed", error: action.error }
    default:
      return state
  }
}
