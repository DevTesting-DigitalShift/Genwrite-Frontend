import { html } from "@codemirror/lang-html"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { EditorState } from "@codemirror/state"
import { basicSetup, EditorView } from "codemirror"
import { useEffect, useRef } from "react"

function useCodeMirrorEditor({ content, onChange, language }) {
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const externalUpdateRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || viewRef.current) return

    const langExtension =
      language === "html" ? html() : markdown({ base: markdownLanguage, codeLanguages: languages })

    const startState = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        EditorView.lineWrapping,
        langExtension,
        EditorView.updateListener.of((update) => {
          if (externalUpdateRef.current) return

          if (
            update.docChanged &&
            update.transactions.some((tr) => tr.isUserEvent("input") || tr.isUserEvent("delete"))
          ) {
            const newDoc = update.state.doc.toString()
            onChange(newDoc)
          }
        }),
      ],
    })

    viewRef.current = new EditorView({
      state: startState,
      parent: containerRef.current,
    })

    return () => {
      viewRef.current?.destroy()
      viewRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!viewRef.current) return
    const currentContent = viewRef.current.state.doc.toString()
    if (content !== currentContent) {
      externalUpdateRef.current = true

      // Save current selection
      const { from, to } = viewRef.current.state.selection.main

      const transaction = viewRef.current.state.update({
        changes: { from: 0, to: currentContent.length, insert: content },
        selection: { anchor: from, head: to }, // restore cursor
      })
      viewRef.current.dispatch(transaction)
      externalUpdateRef.current = false
    }
  }, [content])

  return containerRef
}

// Markdown editor
const MarkdownEditor = ({ content, onChange, className }) => {
  const ref = useCodeMirrorEditor({ content, onChange, language: "markdown" })
  return <div ref={ref} className={`w-full h-full ${className}`} />
}

// HTML editor
const HtmlEditor = ({ content, onChange, className }) => {
  const ref = useCodeMirrorEditor({ content, onChange, language: "html" })
  return <div ref={ref} className={`w-full h-full ${className}`} />
}

export { MarkdownEditor, HtmlEditor }
