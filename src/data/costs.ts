import { useMemo } from "react"
import usePricingStore from "@store/usePricingStore"
import type { PricingCatalogue } from "@api/Pricing/Pricing.api"

/**
 * Per-action credit costs in the shape the UI has always used (`COSTS.IMAGE.GENERATE`, …),
 * now derived from the backend's pricing catalogue instead of hardcoded numbers. Each value
 * maps to the backend module that actually charges it:
 *  - generate.pricing.js       → BLOG.METADATA/HUMANISED_CONTENT/OUTLINE/PROMPT_CONTENT, TOOLS.*,
 *                                WEBSITE_RANKING.*, COMPETITOR_LIKE_BLOG
 *  - blogGeneration.pricing.js → BLOG.PROOFREAD/REWRITE, SECTION_TASK.*
 *  - images.pricing.js         → IMAGE.* (ENHANCE is the backend's ENHANCE_PRO)
 *  - analysis.pricing.js       → ANALYSIS.COMPETITORS
 *  - analytics.pricing.js      → BLOG_INSIGHT.*
 *  - blog.pricing.js aiModels  → MODEL_MULTIPLIER
 */
export function buildCosts(c: PricingCatalogue) {
  const g = c.generate
  return {
    ANALYSIS: { COMPETITORS: c.analysis.COMPETITORS },
    BLOG: {
      PROOFREAD: c.blogGeneration.PROOFREAD,
      REWRITE: c.blogGeneration.REWRITE,
      METADATA: g.METADATA,
      HUMANISED_CONTENT: g.HUMANISED_CONTENT,
      OUTLINE: g.OUTLINE,
      PROMPT_CONTENT: g.PROMPT_CONTENT,
    },
    SECTION_TASK: c.blogGeneration.SECTION_TASK,
    TOOLS: {
      DETECTOR: g.DETECTOR,
      KEYWORD_SCRAPER: g.KEYWORD_SCRAPER,
      YOUTUBE_SUMMARIZER: g.YOUTUBE_SUMMARIZER,
      PDF_CHAT: g.PDF_CHAT,
    },
    IMAGE: {
      GENERATE: c.images.GENERATE,
      ALT_TEXT: c.images.ALT_TEXT,
      ENHANCE: c.images.ENHANCE_PRO,
    },
    WEBSITE_RANKING: g.WEBSITE_RANKING,
    COMPETITOR_LIKE_BLOG: g.COMPETITOR_LIKE_BLOG,
    BLOG_INSIGHT: { ANALYZE: c.analytics.ANALYZE, APPLY: c.analytics.APPLY },
    MODEL_MULTIPLIER: Object.fromEntries(
      Object.entries(c.blog.aiModels).map(([key, m]) => [key.toUpperCase(), m.costMultiplier])
    ) as Record<string, number>,
  }
}

export type Costs = ReturnType<typeof buildCosts>

/** Live costs for components — re-renders when the backend catalogue arrives. */
export function useCosts(): Costs {
  const catalogue = usePricingStore((s) => s.catalogue)
  return useMemo(() => buildCosts(catalogue), [catalogue])
}

/** Current costs outside React (utils, event handlers that can't use a hook). */
export const getCosts = (): Costs => buildCosts(usePricingStore.getState().catalogue)
