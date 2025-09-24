import { html } from "@codemirror/lang-html"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { EditorState } from "@codemirror/state"
import { basicSetup, EditorView } from "codemirror"
import { useEffect, useRef, useState } from "react"

const MarkdownEditor = ({ content: propContent, onChange, className, setUnsavedChanges }) => {
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const externalUpdateRef = useRef(false)

  useEffect(() => {
    if (containerRef.current && !viewRef.current) {
      const startState = EditorState.create({
        doc: propContent,
        extensions: [
          basicSetup,
          EditorView.lineWrapping,
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          EditorView.updateListener.of((update) => {
            if (
              update.docChanged &&
              update.transactions.some((tr) => tr.isUserEvent("input") || tr.isUserEvent("delete"))
            ) {
              const newDoc = update.state.doc.toString()
              onChange(newDoc)
              setUnsavedChanges(true)
            }
          }),
        ],
      })
      viewRef.current = new EditorView({ state: startState, parent: containerRef.current })
    }

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [])

  // Only update editor if propContent comes from parent, not on every keystroke
  useEffect(() => {
    if (viewRef.current) {
      const currentContent = viewRef.current.state.doc.toString()
      if (propContent !== currentContent) {
        const transaction = viewRef.current.state.update({
          changes: { from: 0, to: currentContent.length, insert: propContent },
        })
        externalUpdateRef.current = true
        viewRef.current.dispatch(transaction)
        externalUpdateRef.current = false
      }
    }
  }, [propContent])

  return <div ref={containerRef} className={`w-full h-full ${className}`} />
}

const HtmlEditor = ({ content: propContent, onChange, className, setUnsavedChanges }) => {
  const containerRef = useRef(null)
  const viewRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || viewRef.current) return

    const startState = EditorState.create({
      doc: propContent,
      extensions: [
        basicSetup,
        html(),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (
            update.docChanged &&
            update.transactions.some((tr) => tr.isUserEvent("input") || tr.isUserEvent("delete"))
          ) {
            const newDoc = update.state.doc.toString()
            onChange(newDoc)
            setUnsavedChanges(true)
          }
        }),
      ],
    })

    viewRef.current = new EditorView({ state: startState, parent: containerRef.current })

    return () => {
      viewRef.current.destroy()
      viewRef.current = null
    }
  }, [])

  // Only update editor if propContent comes from outside (not user typing)
  useEffect(() => {
    if (!viewRef.current) return
    const currentContent = viewRef.current.state.doc.toString()
    if (propContent !== currentContent) {
      const transaction = viewRef.current.state.update({
        changes: { from: 0, to: currentContent.length, insert: propContent },
      })
      viewRef.current.dispatch(transaction)
    }
  }, [propContent])

  return <div ref={containerRef} className={`h-screen ${className}`} />
}

export { MarkdownEditor, HtmlEditor }
