/**
 * Pure helpers behind every chip-style list input (keywords, focus keywords, topics, reference
 * links). They used to be re-implemented inline in each modal, once per list; keeping them pure
 * is what lets one field component and one test file cover all of them.
 */

export const LIST_SEPARATORS = /[,\t\n\r;]+/

/** "a, b;c\nd" → ["a","b","c","d"]; blanks dropped. */
export function splitItems(text: string): string[] {
  return text
    .split(LIST_SEPARATORS)
    .map((item) => item.trim())
    .filter(Boolean)
}

export interface MergeResult {
  next: string[]
  added: string[]
  /** Items skipped because the list (or the input itself) already had them. */
  duplicates: string[]
  /** Items that did not fit under `max`. */
  rejected: string[]
}

/** Appends `incoming` to `existing`: case-insensitive de-duplication, optional ceiling. */
export function mergeItems(
  existing: string[],
  incoming: string[],
  { max }: { max?: number } = {}
): MergeResult {
  const seen = new Set(existing.map((item) => item.trim().toLowerCase()))
  const added: string[] = []
  const duplicates: string[] = []
  const rejected: string[] = []

  for (const raw of incoming) {
    const item = raw.trim()
    if (!item) continue
    const key = item.toLowerCase()
    if (seen.has(key)) {
      duplicates.push(item)
      continue
    }
    if (max !== undefined && existing.length + added.length >= max) {
      rejected.push(item)
      continue
    }
    seen.add(key)
    added.push(item)
  }

  return { next: [...existing, ...added], added, duplicates, rejected }
}

/**
 * First non-empty cell of every line, dropping a header row when its first line names the
 * column ("topics", "keyword", ...). Matches what the bulk modal's CSV import always did.
 */
export function parseCsvItems(text: string): string[] {
  let lines = text.trim().split(/\r?\n/)
  if (lines.length === 0) return []

  const header = lines[0].toLowerCase()
  if (header.includes("topics") || header.includes("keyword")) lines = lines.slice(1)

  return lines
    .map((line) => line.split(",").map((cell) => cell.trim()).find(Boolean) ?? "")
    .filter(Boolean)
}

export const CSV_MAX_BYTES = 20 * 1024

/** Returns an error message, or `null` when the file may be read. */
export function validateCsvFile(file: { name: string; size: number } | undefined | null) {
  if (!file) return "No file selected. Please choose a valid CSV file."
  if (!file.name.toLowerCase().endsWith(".csv")) return "Invalid file type. Please upload a .csv file."
  if (file.size > CSV_MAX_BYTES) return "File size exceeds 20KB limit. Please upload a smaller file."
  return null
}
