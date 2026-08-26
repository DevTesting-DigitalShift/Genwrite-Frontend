import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import useDebounce from "./useDebounce"

// Covers the behaviour that replaced lodash-es/debounce: trailing edge, cancel,
// and always calling the latest callback.
describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("fires only once, on the trailing edge", () => {
    const spy = vi.fn()
    const { result } = renderHook(() => useDebounce(spy, 500))

    act(() => {
      result.current("a")
      result.current("b")
      result.current("c")
    })
    expect(spy).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith("c")
  })

  it("does not fire before the delay elapses", () => {
    const spy = vi.fn()
    const { result } = renderHook(() => useDebounce(spy, 500))

    act(() => {
      result.current("x")
      vi.advanceTimersByTime(499)
    })
    expect(spy).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("cancel() prevents a pending call", () => {
    const spy = vi.fn()
    const { result } = renderHook(() => useDebounce(spy, 500))

    act(() => {
      result.current("x")
      result.current.cancel()
      vi.advanceTimersByTime(1000)
    })
    expect(spy).not.toHaveBeenCalled()
  })

  it("cancels the pending call on unmount", () => {
    const spy = vi.fn()
    const { result, unmount } = renderHook(() => useDebounce(spy, 500))

    act(() => {
      result.current("x")
    })
    unmount()
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(spy).not.toHaveBeenCalled()
  })

  it("invokes the latest callback, not the one captured at mount", () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(({ cb }) => useDebounce(cb, 500), {
      initialProps: { cb: first },
    })

    act(() => {
      result.current("x")
    })
    rerender({ cb: second })
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith("x")
  })
})
