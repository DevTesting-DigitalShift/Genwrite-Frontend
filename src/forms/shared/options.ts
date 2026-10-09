import { z } from "zod"

/**
 * The per-blog feature toggles, in the key names `models/Blog.js` uses (`Blog.options`). Every
 * generation form — quick, YouTube, advanced, bulk and the scheduled job — keeps them in an
 * `options` object, so the same list drives the schema, the defaults, the switches and the
 * credit estimate.
 */

export const GENERATION_OPTION_KEYS = [
  "exactTitle",
  "performKeywordResearch",
  "includeInterlinks",
  "includeCompetitorResearch",
  "addOutBoundLinks",
  "includeFaqs",
  "addCTA",
  "automaticPosting",
  "includeTableOfContents",
  "embedYouTubeVideos",
  "easyToUnderstand",
  "humanisation",
  "extendedThinking",
  "deepResearch",
  "createBrandedImages",
] as const

export type GenerationOptionKey = (typeof GENERATION_OPTION_KEYS)[number]
export type GenerationOptions = Record<GenerationOptionKey, boolean>

export const generationOptionsSchema = z.object(
  Object.fromEntries(GENERATION_OPTION_KEYS.map((key) => [key, z.boolean()])) as Record<
    GenerationOptionKey,
    z.ZodBoolean
  >
)

/** All off. Forms layer their own historical defaults on top (see `generationOptionDefaults`). */
export function generationOptionDefaults(
  overrides: Partial<GenerationOptions> = {}
): GenerationOptions {
  return {
    ...(Object.fromEntries(GENERATION_OPTION_KEYS.map((key) => [key, false])) as GenerationOptions),
    ...overrides,
  }
}

export interface ToggleDefinition {
  key: GenerationOptionKey
  label: string
  description: string
  /** Where the toggle sits when a form renders the full list. */
  group: "writing" | "seo" | "content"
}

/**
 * Single source of truth for toggle copy. `ToggleListField` renders a subset of this by key,
 * so a form chooses *which* switches it offers but never re-words them.
 */
export const GENERATION_TOGGLES: readonly ToggleDefinition[] = [
  {
    key: "exactTitle",
    label: "Use topic as blog title",
    description: "Uses your topic text as the exact H1 title.",
    group: "writing",
  },
  {
    key: "easyToUnderstand",
    label: "Easy to understand",
    description: "Use simple language and shorter sentences.",
    group: "writing",
  },
  {
    key: "humanisation",
    label: "Humanization",
    description: "Use more natural phrasing, sentence rhythm, and variation.",
    group: "writing",
  },
  {
    key: "extendedThinking",
    label: "Extended thinking",
    description: "Deepen AI reasoning for logical outputs.",
    group: "writing",
  },
  {
    key: "deepResearch",
    label: "Deep research",
    description: "Extensive multi-source investigative research.",
    group: "writing",
  },
  {
    key: "performKeywordResearch",
    label: "Perform keyword research",
    description: "Let AI discover high-traffic SEO keywords for the topic.",
    group: "seo",
  },
  {
    key: "includeFaqs",
    label: "Include FAQs",
    description: "Add a frequently-asked-questions section.",
    group: "seo",
  },
  {
    key: "includeInterlinks",
    label: "Include internal links",
    description: "Link to your other published posts.",
    group: "seo",
  },
  {
    key: "addOutBoundLinks",
    label: "Add outbound links",
    description: "Cite relevant external sources.",
    group: "seo",
  },
  {
    key: "includeCompetitorResearch",
    label: "Competitor research",
    description: "Study competing articles before writing.",
    group: "seo",
  },
  {
    key: "includeTableOfContents",
    label: "Table of contents",
    description: "Include a table of contents in the post.",
    group: "content",
  },
  {
    key: "embedYouTubeVideos",
    label: "Embed YouTube videos",
    description: "Embed relevant YouTube videos in the post.",
    group: "content",
  },
]

export const GENERATION_TOGGLE_BY_KEY = Object.fromEntries(
  GENERATION_TOGGLES.map((toggle) => [toggle.key, toggle])
) as Record<string, ToggleDefinition | undefined>
