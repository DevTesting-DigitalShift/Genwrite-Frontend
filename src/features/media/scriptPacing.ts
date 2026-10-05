/** Natural ad-read pace (150 words/min). Faster sounds rushed — the backend asks the video
 * model for an unhurried delivery, but it can only slow down if the clip is long enough. */
const WORDS_PER_SECOND = 2.5
/** Breathing room before the first and after the last word. */
const LEAD_SECONDS = 1

/** The spoken script a prompt quotes (the backend keeps quoted text word for word), or null. */
export function extractQuotedScript(prompt: string): string | null {
  const quotes = [...prompt.matchAll(/["“]([^"”]{2,})["”]/g)].map((m) => m[1].trim())
  return quotes.length > 0 ? quotes.join(" ") : null
}

export const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length

/** Seconds needed to say `words` at a natural pace. */
export const naturalSecondsFor = (words: number) =>
  Math.ceil(words / WORDS_PER_SECOND + LEAD_SECONDS)

export type PacingAdvice = {
  words: number
  neededSeconds: number
  /** Shortest duration the model offers that fits, or null when none does. */
  suggestedDuration: number | null
}

/** Advice when the quoted script won't fit `durationSeconds` at a natural pace; null when it does
 * (or there's no quoted script). */
export function pacingAdvice(
  prompt: string,
  durationSeconds: number,
  durations: number[]
): PacingAdvice | null {
  const script = extractQuotedScript(prompt)
  if (!script) return null
  const words = countWords(script)
  const neededSeconds = naturalSecondsFor(words)
  if (neededSeconds <= durationSeconds) return null
  const suggestedDuration =
    [...durations].sort((a, b) => a - b).find((d) => d >= neededSeconds) ?? null
  return { words, neededSeconds, suggestedDuration }
}
