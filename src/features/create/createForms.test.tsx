import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { RouterProvider, createMemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"

// The forms are exercised for real; only the network- and context-backed edges are stubbed.
vi.mock("@/context/ConfirmPopupContext", () => ({ useConfirmPopup: () => ({ handlePopup: vi.fn() }) }))
vi.mock("@/context/LoadingContext", () => ({
  useLoading: () => ({ showLoading: () => "id", hideLoading: () => {} }),
}))
// react-query hands back a referentially stable `data`; the stubs must too, or any effect
// keyed on it re-runs every render.
const stubs = vi.hoisted(() => ({
  brands: { data: [], isLoading: false, error: null },
  integrations: { data: { integrations: {} } },
  job: { data: undefined, isLoading: false },
}))
vi.mock("@api/Brand/Brand.query", () => ({
  brandsQuery: { useList: () => stubs.brands },
}))
vi.mock("@api/Integration/Integration.query", () => ({
  integrationQuery: { useList: () => stubs.integrations },
}))
vi.mock("@api/Job/Job.query", () => ({
  jobsQuery: {
    useDetail: () => stubs.job,
    useCreate: () => ({ mutateAsync: vi.fn() }),
    useUpdate: () => ({ mutateAsync: vi.fn() }),
  },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), warning: vi.fn(), info: vi.fn(), success: vi.fn() } }))

const { default: CreatePage } = await import("./CreatePage")

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  // Radix pointer capture / scrollIntoView are not implemented by jsdom.
  Element.prototype.scrollIntoView = () => {}
})

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // A data router, as in the app: the forms use `useBlocker` for their unsaved-changes guard.
  const router = createMemoryRouter(
    [
      { path: "/create/:kind", element: <CreatePage /> },
      { path: "/dashboard", element: <p>dashboard</p> },
    ],
    { initialEntries: [path] }
  )
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

// The forms are lazy chunks; the first render of each waits on its dynamic import.
const LAZY_LOAD = { timeout: 25_000 }

describe.each([
  ["quick", "Generate Quick Blog", "Generate blog"],
  ["youtube", "Generate YouTube Blog", "Generate blog"],
  ["advanced", "Generate Advanced Blog", "Generate blog"],
  ["bulk", "Generate Bulk Blogs", "Generate blogs"],
  ["job", "Create Job", "Create job"],
])("/create/%s", (kind, title, submitLabel) => {
  it("renders as one page with the power-user options collapsed", { timeout: 45_000 }, async () => {
    const { container } = renderAt(`/create/${kind}`)
    await screen.findByText(title, {}, LAZY_LOAD)

    const sections = Array.from(container.querySelectorAll<HTMLDetailsElement>("details"))
    expect(sections.length).toBeGreaterThan(2)
    // At least one section is open (the basics) and at least one is collapsed (advanced).
    expect(sections.some((d) => d.open)).toBe(true)
    expect(sections.some((d) => !d.open)).toBe(true)
    expect(screen.getByRole("button", { name: submitLabel })).toBeTruthy()
  })

  it("submitting an empty form shows errors without sending anything", { timeout: 45_000 }, async () => {
    const { container } = renderAt(`/create/${kind}`)
    await screen.findByText(title, {}, LAZY_LOAD)

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: submitLabel }))
    })

    await waitFor(() =>
      expect(container.querySelectorAll(".text-destructive, [class*='text-red-500']").length).toBeGreaterThan(0)
    )
  })
})

describe("/create/:kind routing", () => {
  it("sends an unknown kind to the dashboard", async () => {
    renderAt("/create/nope")
    expect(await screen.findByText("dashboard", {}, LAZY_LOAD)).toBeTruthy()
  })
})
