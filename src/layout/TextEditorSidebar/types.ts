/**
 * Shared TypeScript types for TextEditorSidebar
 */

export interface Blog {
  _id: string
  title?: string
  topic?: string
  content?: string
  slug?: string
  category?: string
  template?: string
  tone?: string
  userDefinedLength?: number
  aiModel?: string
  imageSource?: string
  numberOfImages?: number
  tags?: string[]
  keywords?: string[]
  focusKeywords?: string[]
  seoMetadata?: { title?: string; description?: string }
  brandId?: BrandVoice | string
  nameOfVoice?: string
  describeBrand?: string
  description?: string
  persona?: string
  postLink?: string
  options?: BlogOptions
  seoScore?: number
  blogScore?: number
  isCheckedBrand?: boolean
  costCutter?: boolean
  easyToUnderstand?: boolean
  embedYouTubeVideos?: boolean
  isCheckedQuick?: boolean
  isCheckedGeneratedImages?: boolean
  wordpressPostStatus?: boolean
  postingDefaultType?: string | null
}

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

export interface AnalysisResult {
  insights?: {
    blogScore?: number
    analysis?: Record<string, { score: number; maxScore: number; feedback: string }>
    suggestions?: string[]
  }
  competitors?: Array<{ title: string; url: string; score?: number }>
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
  analysisResult?: AnalysisResult
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
