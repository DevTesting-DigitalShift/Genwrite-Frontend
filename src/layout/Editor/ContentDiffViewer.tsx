import React, { useMemo } from "react"

interface ContentDiffViewerProps {
  oldMarkdown: string
  newMarkdown: string
  onAccept?: React.MouseEventHandler<HTMLButtonElement>
  onReject?: React.MouseEventHandler<HTMLButtonElement>
  acceptLabel?: string
  rejectLabel?: string
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
  acceptLabel = "Apply to Content",
  rejectLabel = "Discard Changes",
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
    <div className="flex flex-col h-full w-full">
      <style>{`
        .diff-viewer-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }
        .diff-pane {
          font-size: 0.9rem;
          line-height: 1.6;
          padding: 24px 28px;
          background: #fff;
        }
        .diff-word-added {
          background-color: #dcfce7;
          color: #166534;
          font-weight: 500;
          border-radius: 2px;
          padding: 0 1px;
        }
        .diff-word-removed {
          background-color: #fee2e2;
          color: #991b1b;
          text-decoration: line-through;
          border-radius: 2px;
          padding: 0 1px;
        }
        /* Heading prominence fix */
        .diff-pane h1, .diff-pane .heading-1 {
          font-size: 1.85em !important;
          font-weight: 800 !important;
          margin: 0.5em 0 0.75em !important;
          line-height: 1.2 !important;
          color: #0f172a !important;
          display: block !important;
        }
        .diff-pane h2, .diff-pane .heading-2 {
          font-size: 1.45em !important;
          font-weight: 700 !important;
          margin: 1em 0 0.5em !important;
          line-height: 1.3 !important;
          color: #1e293b !important;
        }
        .diff-pane h3, .diff-pane .heading-3 {
          font-size: 1.2em !important;
          font-weight: 700 !important;
          margin: 1em 0 0.5em !important;
        }
        .diff-pane p { margin: 0 0 1em; color: #334155; }
        .diff-pane strong, .diff-pane b { font-weight: 700; color: #0f172a; }
        .diff-pane-header {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 12px 28px;
          border-bottom: 1px solid #f1f5f9;
        }
      `}</style>

      <div className="flex-1 min-h-0 bg-white overflow-hidden flex flex-col">
        {!hasDiff ? (
          <div className="flex-1 flex items-center justify-center p-12 bg-slate-50 text-slate-400 italic">
            No changes detected between these versions.
          </div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-slate-100 flex-1 overflow-y-auto custom-scroll">
            {/* Old Column */}
            <div className="flex flex-col min-w-0">
              <div className="diff-pane-header bg-red-50/50 text-red-600 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                <span>Original Content</span>
                <span className="text-[10px] bg-red-100 px-2 py-0.5 rounded font-bold">BEFORE</span>
              </div>
              <div
                className="diff-pane flex-1"
                dangerouslySetInnerHTML={{ __html: oldHtml }}
              />
            </div>
            {/* New Column */}
            <div className="flex flex-col min-w-0">
              <div className="diff-pane-header bg-emerald-50/50 text-emerald-700 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                <span>Refined Content</span>
                <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded font-bold">AFTER</span>
              </div>
              <div
                className="diff-pane flex-1"
                dangerouslySetInnerHTML={{ __html: newHtml }}
              />
            </div>
          </div>
        )}
      </div>

      {(onAccept || onReject) && (
        <div className="flex items-center justify-end gap-3 mt-8 pt-6 pr-6 border-t border-slate-100 bg-white">
          <button
            onClick={onReject}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 rounded transition-all font-bold text-sm"
          >
            {rejectLabel}
          </button>
          <button
            onClick={onAccept}
            className="px-8 py-2.5 bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white rounded font-bold text-sm shadow-none transition-all active:scale-95"
          >
            {acceptLabel}
          </button>
        </div>
      )}
    </div>
  )
}

export default ContentDiffViewer