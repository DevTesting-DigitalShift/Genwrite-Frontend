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
    // Pre-process common structural tags to preserve structure in the diff
    const processed = html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<\/td>/gi, " | ")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")

    if (typeof document === "undefined") return processed.replace(/<[^>]+>/g, "")
    const tmp = document.createElement("DIV")
    tmp.innerHTML = processed
    return tmp.textContent || tmp.innerText || ""
  }

  const oldText = stripHtml(oldMarkdown || "")
  const newText = stripHtml(newMarkdown || "")

  return (
    <div className="flex flex-col w-full min-h-[400px]">
      <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        {oldText === newText ? (
          <div className="flex items-center justify-center p-12 bg-slate-50 text-slate-500">
            <p className="font-medium text-sm">No differences found between the two versions.</p>
          </div>
        ) : (
          <DiffViewer
            oldValue={oldText}
            newValue={newText}
            splitView={true}
            compareMethod={DiffMethod.WORDS}
            hideLineNumbers={true}
            styles={{
              diffContainer: { fontSize: "0.85rem", fontFamily: "Inter, system-ui, sans-serif" },
              contentText: { lineHeight: "1.6", padding: "10px 0" },
              wordDiff: {
                padding: "1px 2px",
                backgroundColor: "rgba(0,0,0,0.05)",
                borderRadius: "3px",
              },
              wordAdded: { backgroundColor: "#ecfdf5", color: "#065f46", textDecoration: "none" },
              wordRemoved: { backgroundColor: "#fef2f2", color: "#991b1b", textDecoration: "none" },
              gutter: { backgroundColor: "#f8fafc" },
            }}
          />
        )}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onReject}
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm active:scale-95"
        >
          Discard Changes
        </button>
        <button
          onClick={onAccept}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg shadow-indigo-100 active:scale-95"
        >
          Apply to Section
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
