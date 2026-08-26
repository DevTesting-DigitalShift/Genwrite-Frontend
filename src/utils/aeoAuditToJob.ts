// Converts an AEO audit report (variable size, depends on chosen AEO token count)
// into the compact { focusKeywords, keywords, allKeywords } shape JobModal expects.
const MAX_TOPICS = 10
const MAX_KEYWORDS = 15
export const MAX_BLOGS_FROM_AUDIT = 10

interface AeoAuditReport {
  analysis?: {
    expertiseAreas?: string[]
  }
  rankings?: {
    results?: Array<{ rank?: number; prompt?: string }>
  }
}

export interface JobImportShape {
  focusKeywords: string[]
  keywords: string[]
  allKeywords: string[]
  numberOfBlogs: number
}

export const mapAeoAuditToJobImport = (
  { analysis, rankings }: AeoAuditReport,
  promptCount: number | string
): JobImportShape => {
  const topics = [
    ...new Set((analysis?.expertiseAreas || []).map((t) => t.trim()).filter(Boolean)),
  ].slice(0, MAX_TOPICS)

  const rankedFirst = [...(rankings?.results || [])].sort((a, b) => {
    const rankA = a.rank && a.rank > 0 ? a.rank : Infinity
    const rankB = b.rank && b.rank > 0 ? b.rank : Infinity
    return rankA - rankB
  })

  const keywords = [
    ...new Set(rankedFirst.map((r) => r.prompt?.trim()).filter((p): p is string => Boolean(p))),
  ].slice(0, MAX_KEYWORDS)

  const numberOfBlogs = Math.min(Math.max(Number(promptCount) || 1, 1), MAX_BLOGS_FROM_AUDIT)

  return { focusKeywords: keywords, keywords: [], allKeywords: topics, numberOfBlogs }
}
