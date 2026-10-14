import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { FieldErrors } from "react-hook-form"
import { countFieldErrors, findFirstInvalidField } from "./invalidSubmit"

describe("countFieldErrors", () => {
  it("counts leaf errors, including nested and array items, ignoring refs", () => {
    const errors = {
      topic: { type: "custom", message: "Please enter a topic.", ref: { name: "topic" } },
      referenceLinks: [undefined, { type: "custom", message: "Bad link" }, { message: "Bad" }],
      schedule: { daysOfWeek: { type: "custom", message: "Pick a day" } },
    } as unknown as FieldErrors
    expect(countFieldErrors(errors)).toBe(4)
  })

  it("is 0 for no errors", () => {
    expect(countFieldErrors({})).toBe(0)
  })
})

describe("findFirstInvalidField", () => {
  // jsdom does no layout, so `getClientRects` is always empty; treat anything outside a
  // `[hidden]` subtree as rendered.
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(function (
      this: HTMLElement
    ) {
      return (this.closest("[hidden]") ? [] : [{}]) as unknown as DOMRectList
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ""
  })

  it("returns the top-most visible error with its field label and invalid control", () => {
    document.body.innerHTML = `
      <form>
        <div hidden>
          <div data-field-shell data-field-label="Hidden"><p role="alert">Hidden error</p></div>
        </div>
        <div data-field-shell data-field-label="Topic">
          <input id="topic" aria-invalid="true" />
          <p role="alert">Please enter a topic.</p>
        </div>
        <div data-field-shell data-field-label="Keywords"><p role="alert">Add one</p></div>
      </form>`
    const first = findFirstInvalidField(document.body)
    expect(first?.label).toBe("Topic")
    expect(first?.message).toBe("Please enter a topic.")
    expect(first?.element.id).toBe("topic")
  })

  it("prefers a field's [data-focus-on-error] target over its first focusable", () => {
    document.body.innerHTML = `
      <div data-field-shell data-field-label="Template">
        <input id="search" />
        <p role="alert">Please select a template.</p>
        <button id="first-card" data-focus-on-error type="button">Classic</button>
      </div>`
    expect(findFirstInvalidField(document.body)?.element.id).toBe("first-card")
  })

  it("returns null when nothing is invalid", () => {
    document.body.innerHTML = `<div data-field-shell><input /></div>`
    expect(findFirstInvalidField(document.body)).toBeNull()
  })
})
