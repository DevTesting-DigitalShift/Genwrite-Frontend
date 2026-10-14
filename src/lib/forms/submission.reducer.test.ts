import { describe, expect, it } from "vitest"
import { initialSubmissionState, submissionReducer } from "./submission.reducer"

describe("submissionReducer", () => {
  it("walks idle -> submitting -> idle on success", () => {
    const submitting = submissionReducer(initialSubmissionState, { type: "SUBMIT_START" })
    expect(submitting.status).toBe("submitting")
    expect(submissionReducer(submitting, { type: "SUBMIT_SUCCEEDED" })).toEqual(
      initialSubmissionState
    )
  })

  it("keeps the failure message until the next attempt", () => {
    const failed = submissionReducer(
      { status: "submitting", error: null },
      { type: "SUBMIT_FAILED", error: "boom" }
    )
    expect(failed).toEqual({ status: "failed", error: "boom" })
    expect(submissionReducer(failed, { type: "SUBMIT_START" })).toEqual({
      status: "submitting",
      error: null,
    })
  })

  it("ignores a second start while a request is in flight", () => {
    const submitting = { status: "submitting", error: null } as const
    expect(submissionReducer(submitting, { type: "SUBMIT_START" })).toBe(submitting)
  })

  it("returns to idle when aborted before sending", () => {
    expect(
      submissionReducer({ status: "submitting", error: null }, { type: "SUBMIT_ABORTED" })
    ).toEqual(initialSubmissionState)
  })
})
