import { useEffect, useRef, useState } from "react"

export function useProofreadingUI(editor) {
  const [activeSpan, setActiveSpan] = useState(null)
  const bubbleRef = useRef(null)

  useEffect(() => {
    if (!editor) return

    const handler = (e) => {
      const target = (e.target).closest(".proofreading-mark")
      if (target) {
        setActiveSpan(target)
      } else {
        setActiveSpan(null)
      }
    }

    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [editor])

  const applyChange = () => {
    if (!activeSpan) return
    const from = Number(activeSpan.dataset.from)
    const to = Number(activeSpan.dataset.to)
    const suggestion = activeSpan.dataset.suggestion

    editor?.commands.command(({ tr }) => {
      tr.insertText(suggestion, from, to)
      return true
    })

    setActiveSpan(null)
  }

  const rejectChange = () => {
    if (!activeSpan) return

    // Just remove decoration (force re-render with new suggestion list)
    const original = activeSpan.dataset.original
    const newSuggestions = editor.extensionManager.extensions
      .find((ext) => ext.name === "proofreadingDecoration")
      ?.options?.suggestions?.filter((s) => s.original !== original)

    editor?.commands?.setContent(editor.getHTML(), false) // re-render to reset
    editor?.extensionManager?.extensions
      .find((ext) => ext.name === "proofreadingDecoration")
      ?.configure({ suggestions: newSuggestions })

    setActiveSpan(null)
  }

  return {
    activeSpan,
    bubbleRef,
    applyChange,
    rejectChange,
  }
}
