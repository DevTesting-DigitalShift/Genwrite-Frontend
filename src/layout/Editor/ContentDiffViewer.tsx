// import React from "react"

// import DiffViewer, { DiffMethod } from "react-diff-viewer-continued"

// interface ContentDiffViewerProps {
//   oldMarkdown: string
//   newMarkdown: string
//   onAccept?: React.MouseEventHandler<HTMLButtonElement>
//   onReject?: React.MouseEventHandler<HTMLButtonElement>
// }

// const ContentDiffViewer: React.FC<ContentDiffViewerProps> = ({
//   oldMarkdown,
//   newMarkdown,
//   onAccept,
//   onReject,
// }) => {
//   const stripHtml = (html: string) => {
//     if (!html) return ""
//     // Pre-process common structural tags to preserve structure in the diff
//     const processed = html
//       .replace(/<br\s*\/?>/gi, "\n")
//       .replace(/<\/p>/gi, "\n\n")
//       .replace(/<\/li>/gi, "\n")
//       .replace(/<\/tr>/gi, "\n")
//       .replace(/<\/td>/gi, " | ")
//       .replace(/<\/h[1-6]>/gi, "\n\n")
//       .replace(/<\/div>/gi, "\n")

//     if (typeof document === "undefined") return processed.replace(/<[^>]+>/g, "")
//     const tmp = document.createElement("DIV")
//     tmp.innerHTML = processed
//     return tmp.textContent || tmp.innerText || ""
//   }

//   const oldText = oldMarkdown //stripHtml(oldMarkdown || "")
//   const newText = newMarkdown // stripHtml(newMarkdown || "")

//   return (
//     <div className="flex flex-col w-full min-h-100 p-1">
//       <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
//         {oldText === newText ? (
//           <div className="flex items-center justify-center p-12 bg-slate-50 text-slate-500">
//             <p className="font-medium text-sm">No differences found between the two versions.</p>
//           </div>
//         ) : (
//           <DiffViewer
//             oldValue={oldText}
//             newValue={newText}
//             splitView={true}
//             compareMethod={DiffMethod.WORDS}
//             hideLineNumbers={true}
//             styles={{
//               diffContainer: { fontSize: "0.85rem", fontFamily: "Inter, system-ui, sans-serif" },
//               contentText: { lineHeight: "1.6", padding: "10px 0" },
//               wordDiff: {
//                 padding: "1px 2px",
//                 backgroundColor: "rgba(0,0,0,0.05)",
//                 borderRadius: "3px",
//               },
//               wordAdded: { backgroundColor: "#ecfdf5", color: "#065f46", textDecoration: "none" },
//               wordRemoved: { backgroundColor: "#fef2f2", color: "#991b1b", textDecoration: "none" },
//               gutter: { backgroundColor: "#f8fafc" },
//             }}
//           />
//         )}
//       </div>
//       <div className="flex justify-end gap-3 mt-6">
//         <button
//           onClick={onReject}
//           className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm active:scale-95"
//         >
//           Discard Changes
//         </button>
//         <button
//           onClick={onAccept}
//           className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg shadow-indigo-100 active:scale-95"
//         >
//           Apply to Section
//         </button>
//       </div>
//       <style>{`
//         @media (max-width: 768px) {
//           .diff-container {
//             font-size: 0.8rem;
//           }
//         }
//       `}</style>
//     </div>
//   )
// }
// export default ContentDiffViewer


import React, { useMemo } from "react"

interface ContentDiffViewerProps {
  oldMarkdown: string
  newMarkdown: string
  onAccept?: React.MouseEventHandler<HTMLButtonElement>
  onReject?: React.MouseEventHandler<HTMLButtonElement>
}

// Tokenize HTML into a mix of tags and word-level text tokens
function tokenizeHtml(html: string): string[] {
  const tokens: string[] = []
  // Split into HTML tags and text nodes
  const parts = html.split(/(<[^>]+>)/g)
  for (const part of parts) {
    if (part.startsWith("<")) {
      tokens.push(part) // push tag as a single atomic token
    } else {
      // split text into words (preserving whitespace as separate tokens)
      const words = part.split(/(\s+)/g)
      for (const w of words) {
        if (w) tokens.push(w)
      }
    }
  }
  return tokens
}

type DiffOp = { type: "equal" | "insert" | "delete"; tokens: string[] }

// Simple LCS-based diff on token arrays
function diffTokens(oldTokens: string[], newTokens: string[]): DiffOp[] {
  const m = oldTokens.length
  const n = newTokens.length

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldTokens[i] === newTokens[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
  }

  const ops: DiffOp[] = []
  let i = 0,
    j = 0
  while (i < m || j < n) {
    if (i < m && j < n && oldTokens[i] === newTokens[j]) {
      const last = ops[ops.length - 1]
      if (last?.type === "equal") last.tokens.push(oldTokens[i])
      else ops.push({ type: "equal", tokens: [oldTokens[i]] })
      i++
      j++
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      const last = ops[ops.length - 1]
      if (last?.type === "insert") last.tokens.push(newTokens[j])
      else ops.push({ type: "insert", tokens: [newTokens[j]] })
      j++
    } else {
      const last = ops[ops.length - 1]
      if (last?.type === "delete") last.tokens.push(oldTokens[i])
      else ops.push({ type: "delete", tokens: [oldTokens[i]] })
      i++
    }
  }
  return ops
}

// Wrap non-tag tokens with a highlight span; leave HTML tags unwrapped
function wrapTokens(tokens: string[], type: "insert" | "delete" | "equal"): string {
  if (type === "equal") return tokens.join("")
  const cls =
    type === "insert"
      ? "diff-word-added"
      : "diff-word-removed"
  return tokens
    .map((t) => {
      if (t.startsWith("<")) return t // don't wrap HTML tags
      if (/^\s+$/.test(t)) return t  // don't wrap pure whitespace
      return `<span class="${cls}">${t}</span>`
    })
    .join("")
}

function buildDiffHtml(ops: DiffOp[], side: "old" | "new"): string {
  return ops
    .filter((op) => {
      if (side === "old") return op.type === "equal" || op.type === "delete"
      return op.type === "equal" || op.type === "insert"
    })
    .map((op) => {
      if (op.type === "equal") return wrapTokens(op.tokens, "equal")
      return wrapTokens(op.tokens, op.type as "insert" | "delete")
    })
    .join("")
}

const ContentDiffViewer: React.FC<ContentDiffViewerProps> = ({
  oldMarkdown,
  newMarkdown,
  onAccept,
  onReject,
}) => {
  const { oldHtml, newHtml, hasDiff } = useMemo(() => {
    const oldTokens = tokenizeHtml(oldMarkdown || "")
    const newTokens = tokenizeHtml(newMarkdown || "")
    const ops = diffTokens(oldTokens, newTokens)
    const hasDiff = ops.some((op) => op.type !== "equal")
    return {
      oldHtml: buildDiffHtml(ops, "old"),
      newHtml: buildDiffHtml(ops, "new"),
      hasDiff,
    }
  }, [oldMarkdown, newMarkdown])

  return (
    <div className="flex flex-col w-full p-1">
      <style>{`
        .diff-pane {
          font-size: 0.875rem;
          line-height: 1.7;
          padding: 16px 20px;
          background: #fff;
          overflow-x: auto;
        }
        .diff-word-added {
          background-color: #d1fae5;
          color: #065f46;
          border-radius: 3px;
          padding: 1px 2px;
        }
        .diff-word-removed {
          background-color: #fee2e2;
          color: #991b1b;
          border-radius: 3px;
          padding: 1px 2px;
          text-decoration: line-through;
        }
        .diff-pane h1, .diff-pane h2, .diff-pane h3,
        .diff-pane h4, .diff-pane h5, .diff-pane h6 {
          font-weight: 700;
          margin: 0.75em 0 0.4em;
          line-height: 1.3;
        }
        .diff-pane h1 { font-size: 1.6em; }
        .diff-pane h2 { font-size: 1.35em; }
        .diff-pane h3 { font-size: 1.15em; }
        .diff-pane p { margin: 0 0 0.85em; }
        .diff-pane strong, .diff-pane b { font-weight: 700; }
        .diff-pane em, .diff-pane i { font-style: italic; }
        .diff-pane ul { list-style: disc; padding-left: 1.4em; margin: 0 0 0.85em; }
        .diff-pane ol { list-style: decimal; padding-left: 1.4em; margin: 0 0 0.85em; }
        .diff-pane li { margin-bottom: 0.3em; }
        .diff-pane a { color: #4f46e5; text-decoration: underline; }
        .diff-pane-header {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 8px 20px;
          border-bottom: 1px solid #e2e8f0;
        }
      `}</style>

      <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        {!hasDiff ? (
          <div className="flex items-center justify-center p-12 bg-slate-50 text-slate-500">
            <p className="font-medium text-sm">No differences found between the two versions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-slate-200">
            {/* Old / Before */}
            <div>
              <div className="diff-pane-header bg-red-50 text-red-600">Before</div>
              <div
                className="diff-pane"
                dangerouslySetInnerHTML={{ __html: oldHtml }}
              />
            </div>
            {/* New / After */}
            <div>
              <div className="diff-pane-header bg-emerald-50 text-emerald-700">After</div>
              <div
                className="diff-pane"
                dangerouslySetInnerHTML={{ __html: newHtml }}
              />
            </div>
          </div>
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
    </div>
  )
}

export default ContentDiffViewer