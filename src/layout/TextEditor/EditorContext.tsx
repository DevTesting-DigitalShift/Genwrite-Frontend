import { type ReactNode, createContext, useContext } from "react"

/** Everything TipTapEditor shares with its toolbar/sidebar descendants. */
export type EditorContextValue = Record<string, unknown>

const EditorContext = createContext<EditorContextValue | null>(null)

export const EditorProvider = ({
  children,
  value,
}: {
  children: ReactNode
  value: EditorContextValue
}) => {
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}

export const useEditorContext = (): EditorContextValue => {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error("useEditorContext must be used within an EditorProvider")
  }
  return context
}

export default EditorContext
