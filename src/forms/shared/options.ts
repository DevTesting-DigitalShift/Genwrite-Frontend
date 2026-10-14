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

/**
 * `options` for the advanced, bulk and job requests, which always keep the exact title: once a
 * blog is pushed to a CMS its title is live (indexed, linked), so it must not be rewritten.
 * Only the quick / YouTube forms let the user turn it off (their "Use exact topic as blog
 * title" switch). With keyword research on, the backend titles the blog with its topic.
 */
export function withExactTitle<T extends Partial<GenerationOptions>>(options: T): T {
  return { ...options, exactTitle: true }
}

/**
 * All off except `exactTitle`, which defaults on (as on the backend). Forms layer their own
 * historical defaults on top.
 */
export function generationOptionDefaults(
  overrides: Partial<GenerationOptions> = {}
): GenerationOptions {
  return {
    ...(Object.fromEntries(GENERATION_OPTION_KEYS.map((key) => [key, false])) as GenerationOptions),
    exactTitle: true,
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
    label: "Use exact topic as blog title",
    description:
      "Keep your topic word-for-word as the title — a published title shouldn't change later.",
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
    description: "Add a table of contents to the published post.",
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
