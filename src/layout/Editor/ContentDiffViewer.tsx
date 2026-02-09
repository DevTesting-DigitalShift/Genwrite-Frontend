import React from "react"

import DiffViewer, { DiffMethod } from "react-diff-viewer-continued"

interface ContentDiffViewerProps {
  oldMarkdown: string
  newMarkdown: string
  onAccept?: React.MouseEventHandler<HTMLButtonElement>
  onReject?: React.MouseEventHandler<HTMLButtonElement>
}

const ContentDiffViewer: React.FC<ContentDiffViewerProps> = ({
  oldMarkdown,
  newMarkdown,
  onAccept,
  onReject,
}) => {
  const stripHtml = (html: string) => {
    if (!html) return ""
    // If running in environment without document (SSR), return as is or handle gracefully
    if (typeof document === "undefined") return html
    const tmp = document.createElement("DIV")
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ""
  }

  const oldText = stripHtml(oldMarkdown || "")
  const newText = stripHtml(newMarkdown || "")

  return (
    <div className="flex flex-col items-center w-fit p-4">
      <div className="w-full max-w-5xl overflow-none">
        {oldText === newText ? (
          <p className="text-gray-500">No differences found between the two versions.</p>
        ) : (
          <DiffViewer
            oldValue={oldText}
            newValue={newText}
            splitView={false}
            compareMethod={DiffMethod.WORDS}
            styles={{
              diffContainer: { fontSize: "1rem", lineHeight: "1.6" },
              contentText: { lineHeight: "1.5" },
              wordDiff: {
                padding: "2px",
                display: "inline-flex",
                backgroundColor: "transparent",
                borderRadius: "2px",
              },
              wordAdded: { backgroundColor: "#d4fcbc", textDecoration: "none" },
              wordRemoved: { backgroundColor: "#ffe6e6", textDecoration: "none" },
            }}
          />
        )}
      </div>
      <div className="flex gap-4 mt-4">
        <button
          onClick={onAccept}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Accept All Changes
        </button>
        <button
          onClick={onReject}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Reject All Changes
        </button>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .diff-container {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  )
}
export default ContentDiffViewer
