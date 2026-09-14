/**
 * Shared TypeScript types for TextEditorSidebar
 */

// The single canonical Blog type (derived from the backend's OpenAPI response schema,
// see useBlogStore.ts) — re-exported here so existing imports from this module keep
// working. Don't redeclare it; this file used to have its own drifting copy.
import type { Blog } from "@store/useBlogStore"
export type { Blog }
import type { components } from "@/types/apiSchema"

export type CompetitorAnalysisResponse = components["schemas"]["CompetitorAnalysisResponse"]

export interface BrandVoice {
  _id?: string
  nameOfVoice?: string
  name?: string
  describeBrand?: string
  description?: string
  persona?: string
  postLink?: string
  url?: string
  keywords?: string[]
}

// Type guard for BrandVoice
export function isBrandVoiceObject(
  brandId: BrandVoice | string | undefined
): brandId is BrandVoice {
  return typeof brandId === "object" && brandId !== null
}

export interface BlogOptions {
  includeFaqs?: boolean
  includeInterlinks?: boolean
  includeCompetitorResearch?: boolean
  addOutBoundLinks?: boolean
  performKeywordResearch?: boolean
  addCTA?: boolean
  easyToUnderstand?: boolean
  embedYouTubeVideos?: boolean
  automaticPosting?: boolean
  includeTableOfContents?: boolean
}

export interface Integration {
  url?: string
  frontend?: string
}

export interface Integrations {
  integrations?: Record<string, Integration>
}

export interface BlogPosting {
  _id: string
  blogId: string
  integrationType?: string
  platform?: string
  link?: string
  category?: string
  includeTableOfContents?: boolean
  postedOn: string
}

export interface ProofreadingSuggestion {
  original: string
  change: string
  reason?: string
}

export interface Metadata {
  title: string
  description: string
}

export interface RegenerateForm {
  topic: string
  title: string
  focusKeywords: string[]
  keywords: string[]
  tone: string
  userDefinedLength: number
  aiModel: string
  isCheckedGeneratedImages: boolean
  imageSource: string
  numberOfImages: number
  useBrandVoice: boolean
  brandId: string
  addCTA: boolean
  costCutter: boolean
  options: {
    includeFaqs: boolean
    includeInterlinks: boolean
    includeCompetitorResearch: boolean
    addOutBoundLinks: boolean
    performKeywordResearch: boolean
  }
  easyToUnderstand: boolean
  embedYouTubeVideos: boolean
  isCheckedQuick: boolean
  wordpressPostStatus: boolean
  postingType: string | null
  includeTableOfContents: boolean
}

/**
 * Props for individual sidebar panels
 */
export interface BasePanelProps {
  blog: Blog

  user: any
  userPlan: string
  isPro: boolean
}

export interface OverviewPanelProps extends BasePanelProps {
  editorContent: string
  keywords: string[]
  setIsSidebarOpen?: (open: boolean) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  seoScore: number
  contentScore: number
}

export interface SeoPanelProps extends BasePanelProps {
  metadata: Metadata
  setMetadata: (metadata: Metadata | ((prev: Metadata) => Metadata)) => void
  onMetadataGenerate: () => void
  onMetadataSave: () => void
  isGeneratingMetadata: boolean
  analysisResult?: CompetitorAnalysisResponse
  editorContent: string
  includeImagesInExport: boolean
  setIncludeImagesInExport: (value: boolean) => void
  onExportMarkdown: () => void
  onExportHTML: () => void
  onExportPDF: () => void
}

export interface BlogInfoPanelProps extends BasePanelProps {
  blogSlug: string
  setBlogSlug: (slug: string) => void
  isEditingSlug: boolean
  setIsEditingSlug: (editing: boolean) => void
  hasPublishedLinks: boolean
  onSlugSave: (slug: string) => Promise<void>
}

export interface BrandVoicePanelProps extends BasePanelProps {
  onRegenerateWithBrand: () => void
  setIsSidebarOpen?: (open: boolean) => void
}

export interface PostingPanelProps extends BasePanelProps {
  integrations: Integrations
  blogPostings: BlogPosting[]
  isLoadingPostings: boolean
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  selectedIntegration: { platform: string; rawPlatform: string; url: string } | null
  setSelectedIntegration: (
    integration: { platform: string; rawPlatform: string; url: string } | null
  ) => void
  includeTableOfContents: boolean
  setIncludeTableOfContents: (include: boolean) => void
  isCategoryLocked: boolean
  categoryError: boolean
  platformError: boolean
  errors: { category: string; platform: string }

  onPost: (data: any) => void
  isPosting: boolean

  formData: any
  hasAnyIntegration: boolean
}

export interface RegeneratePanelProps extends BasePanelProps {
  onRegenerate: () => void
}

/**
 * Result of POST /blogs/:id/analyze / GET /blogs/:id/insight — a persisted BlogInsight
 * document, or null if none has been generated yet. Derived from the backend's OpenAPI
 * schema (regenerate via `npm run gen:api-types`) rather than hand-mirrored.
 */
export type BlogInsight = NonNullable<components["schemas"]["BlogInsight"]>

/** A single AI-generated rewrite suggestion — one entry of `BlogInsight["suggestions"]`. */
export type InsightSuggestion = BlogInsight["suggestions"][number]

export interface InsightsPanelProps extends BasePanelProps {
  isAnalyzing: boolean
  onAnalyze: () => void
  onApplySuggestion: (
    suggestion: InsightSuggestion,
    options: { scope: "section" | "whole"; republish: boolean }
  ) => void
  hasPublishedLinks: boolean
  setIsSidebarOpen?: (open: boolean) => void
}

/**
 * Animation variants for framer-motion
 */
export interface AnimationVariants {
  panel: {
    initial: { opacity: number; x: number }
    animate: { opacity: number; x: number }
    exit: { opacity: number; x: number }
  }
  item: { initial: { opacity: number; y: number }; animate: { opacity: number; y: number } }
  stagger: { animate: { transition: { staggerChildren: number } } }
}
