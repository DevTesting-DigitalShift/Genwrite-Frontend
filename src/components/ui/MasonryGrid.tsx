import { type ReactNode, useLayoutEffect, useRef, useState } from "react"

/** Height of one implicit grid row in px. Smaller = tighter packing at the cost of more
 * implicit rows for the browser to track; 4px keeps the gap jitter invisible. */
const ROW_PX = 4

/**
 * Pinterest-style masonry on top of plain CSS grid: each item measures itself and spans the
 * matching number of 4px implicit rows, so mixed-aspect content (portrait/landscape images,
 * 16:9 videos, square placeholders) packs top-down with no gaps while keeping left-to-right
 * DOM order. Pass the column classes yourself (e.g. "grid-cols-2 lg:grid-cols-4") so each
 * caller picks its own breakpoints.
 *
 * CSS `columns-*` was the previous approach and is *not* a masonry — it flows top-to-bottom
 * and, with `break-inside-avoid` items whose height changes after load, Chrome routinely
 * left everything piled in the first column.
 */
export const MasonryGrid = ({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) => (
  <div className={`grid gap-y-0 ${className}`} style={{ gridAutoRows: `${ROW_PX}px` }}>
    {children}
  </div>
)

/** Wraps a single masonry cell. `gapClassName` is a bottom padding that acts as the vertical
 * gutter, since `gap-y` can't be used (the implicit rows are the sizing unit). */
export const MasonryItem = ({
  children,
  gapClassName = "pb-4",
}: {
  children: ReactNode
  gapClassName?: string
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [span, setSpan] = useState(1)

  // ResizeObserver rather than a one-shot measure: lazy-loaded images and video posters
  // change height after mount, and the cell has to snap to the new size when they do.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const next = Math.max(1, Math.ceil(el.getBoundingClientRect().height / ROW_PX))
      setSpan((prev) => (prev === next ? prev : next))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    // self-start stops the grid stretching the cell to its span, which would otherwise feed
    // the stretched height straight back into the observer.
    <div ref={ref} className={`self-start ${gapClassName}`} style={{ gridRowEnd: `span ${span}` }}>
      {children}
    </div>
  )
}
