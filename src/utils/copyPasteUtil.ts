import { ClipboardEvent } from "react"

/**
 * Handles pasting a batch of values (keywords, focus keywords, topics, etc.) from the clipboard.
 * Supports splitting by newline (\n), tab (\t), comma (,), or semicolon (;).
 * Trims whitespace and filters out empty values.
 *
 * @example
 * // In a React component:
 * <input
 *   onPaste={(e) => extractKeywordsFromClipboard(e, {
 *     type: "keywords",
 *     cb: (newItems, type) => {
 *       setKeywords(prev => [...new Set([...prev, ...newItems])]);
 *     }
 *   })}
 * />
 *
 * @param e - The React ClipboardEvent object.
 * @param options - Configuration for extraction.
 * @param options.type - A label identifying the target data field (e.g., "keywords", "topics").
 * @param options.cb - Callback function called with the extracted array of strings and the type.
 */
export const extractKeywordsFromClipboard = <T extends string = string>(
  e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  { type, cb }: { type: T; cb: (items: string[], type: T) => void }
) => {
  const pasteData = e.clipboardData.getData("text")
  if (!pasteData || !/[\n\t\r,;]+/.test(pasteData)) return

  e.preventDefault()
  const newItems = pasteData
    .split(/[\n\t\r,;]+/)
    .map(item => item.trim())
    .filter(item => item.length > 0)

  if (newItems.length > 0) {
    cb(newItems, type)
  }
}
