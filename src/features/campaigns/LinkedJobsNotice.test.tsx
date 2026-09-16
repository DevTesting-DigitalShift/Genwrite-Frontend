import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { LinkedJobsNotice } from "./LinkedJobsNotice"

describe("LinkedJobsNotice", () => {
  it("shows a passive notice for a linked job that is currently not posting", () => {
    render(
      <LinkedJobsNotice linkedJobs={[{ _id: "job-1", name: "Weekly refresh", eligible: false }]} />
    )
    expect(screen.getByText(/weekly refresh/i)).toBeInTheDocument()
    expect(screen.getByText(/posting right now/i)).toBeInTheDocument()
  })

  it("renders nothing when all linked jobs are eligible", () => {
    const { container } = render(
      <LinkedJobsNotice linkedJobs={[{ _id: "job-1", name: "Weekly refresh", eligible: true }]} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing when linkedJobs is undefined", () => {
    const { container } = render(<LinkedJobsNotice linkedJobs={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })
})
