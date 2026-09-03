import { describe, expect, it, vi } from "vitest"
import { toast } from "sonner"
import { mutationFactory } from "./mutationFactory"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

type Handlers = { onSuccess?: () => void; onError?: (error: unknown) => void }

/** Captures the options each `use*` hook was handed so they can be invoked here. */
function fakeQuery() {
  const captured: Record<string, Handlers> = {}
  const capture = (key: string) => (options: Handlers) => {
    captured[key] = options
    return null
  }
  return {
    baseKey: ["brands"],
    useCreate: capture("create"),
    useUpdate: capture("update"),
    useDelete: capture("delete"),
    captured,
  }
}

const axiosError = (message: string) => ({ response: { status: 400, data: { message } } })

describe("mutationFactory", () => {
  it("toasts what the server said instead of a generic line", () => {
    const query = fakeQuery()
    mutationFactory(query as unknown as Parameters<typeof mutationFactory>[0], "Brand Voice")

    query.captured.create?.onError?.(axiosError("Sitemap could not be reached"))
    expect(toast.error).toHaveBeenLastCalledWith("Sitemap could not be reached")

    query.captured.update?.onError?.(axiosError("Brand name already in use"))
    expect(toast.error).toHaveBeenLastCalledWith("Brand name already in use")
  })

  it("falls back to the generic line when the failure carries no message", () => {
    const query = fakeQuery()
    mutationFactory(query as unknown as Parameters<typeof mutationFactory>[0], "Brand Voice")

    query.captured.create?.onError?.({})
    expect(toast.error).toHaveBeenLastCalledWith("Error creating Brand Voice")

    query.captured.delete?.onError?.({})
    expect(toast.error).toHaveBeenLastCalledWith("Error deleting Brand Voice")
  })

  it("still lets a caller override the handler", () => {
    const query = fakeQuery()
    const onCreateError = vi.fn()
    mutationFactory(query as unknown as Parameters<typeof mutationFactory>[0], "Brand Voice", {
      onCreateError,
    })

    const error = axiosError("nope")
    query.captured.create?.onError?.(error)
    expect(onCreateError).toHaveBeenCalledWith(error)
  })
})
