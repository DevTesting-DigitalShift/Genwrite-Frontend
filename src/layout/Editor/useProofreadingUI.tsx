import { asApiError } from "@/types/api"
import type { Editor } from "@tiptap/react"
import { useEffect, useRef, useState } from "react"

export function useProofreadingUI(editor: Editor | null) {
  const [activeSpan, setActiveSpan] = useState<HTMLElement | null>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor?.view) {
      return
    }

    const dom = editor.view.dom
    const handler = (e: Event) => {
      const target = (e.target as HTMLElement)?.closest<HTMLElement>(".proofreading-mark")
      if (target?.dataset.suggestion) {
        setActiveSpan(target)
      } else {
        setActiveSpan(null)
      }
    }

    dom.addEventListener("mousedown", handler)

    return () => {
      dom.removeEventListener("mousedown", handler)
    }
  }, [editor])

  const applyChange = () => {
    if (!activeSpan || !editor) {
      console.error("Cannot apply change: activeSpan or editor is null")
      return
    }

    const from = Number(activeSpan.dataset.from)
    const to = Number(activeSpan.dataset.to)
    const suggestion = activeSpan.dataset.suggestion
    const original = activeSpan.dataset.original

    if (!suggestion || Number.isNaN(from) || Number.isNaN(to)) {
      console.error("Invalid data attributes:", { from, to, suggestion, original })
      return
    }

    try {
      // Apply the suggestion
      editor.chain().focus().deleteRange({ from, to }).insertContent(suggestion).run()

      // Update suggestions
      const newSuggestions =
        editor.extensionManager.extensions
          .find((ext) => ext.name === "proofreadingDecoration")
          ?.options?.suggestions?.filter((s: { original: string }) => s.original !== original) || []

      // Reconfigure the ProofreadingDecoration extension
      const proofExt = editor.extensionManager.extensions.find(
        (ext) => ext.name === "proofreadingDecoration"
      )
      if (proofExt) {
        proofExt.options.suggestions = newSuggestions
        editor.view.dispatch(editor.state.tr) // Trigger re-render
      }

      setActiveSpan(null)
    } catch (rawError) {
    const error = asApiError(rawError)
      console.error("Error applying change:", error)
    }
  }

  const rejectChange = () => {
    if (!activeSpan || !editor) {
      console.error("Cannot reject change: activeSpan or editor is null")
      return
    }

    const original = activeSpan.dataset.original
    if (!original) {
      console.error("No original data attribute found")
      return
    }

    try {
      // Remove the suggestion
      const newSuggestions =
        editor.extensionManager.extensions
          .find((ext) => ext.name === "proofreadingDecoration")
          ?.options?.suggestions?.filter((s: { original: string }) => s.original !== original) || []

      // Reconfigure the ProofreadingDecoration extension
      const proofExt = editor.extensionManager.extensions.find(
        (ext) => ext.name === "proofreadingDecoration"
      )
      if (proofExt) {
        proofExt.options.suggestions = newSuggestions
        editor.view.dispatch(editor.state.tr) // Trigger re-render
      }

      setActiveSpan(null)
    } catch (rawError) {
    const error = asApiError(rawError)
      console.error("Error rejecting change:", error)
    }
  }

  return { activeSpan, bubbleRef, applyChange, rejectChange }
}
