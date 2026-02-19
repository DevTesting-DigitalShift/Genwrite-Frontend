export const ImageSource = { NONE: "none", STOCK: "stock", AI: "ai", UPLOAD: "upload" } as const

export type ImageSourceType = (typeof ImageSource)[keyof typeof ImageSource]

/** AI Model options - using 'openai' as the value for ChatGPT */
export const AiModel = {
  GEMINI: "gemini",
  OPENAI: "openai",
  CHATGPT: "openai",
  CLAUDE: "claude",
} as const

export type AiModelType = (typeof AiModel)[keyof typeof AiModel]

/** Tone of voice options */
export const Tone = {
  CASUAL: "Casual",
  CONVERSATIONAL: "Conversational",
  EMPATHETIC: "Empathetic",
  FORMAL: "Formal",
  FRIENDLY: "Friendly",
  INFORMATIVE: "Informative",
  INSPIRATIONAL: "Inspirational",
  PERSUASIVE: "Persuasive",
  PROFESSIONAL: "Professional",
  WITTY: "Witty",
} as const

export type ToneType = (typeof Tone)[keyof typeof Tone]

/** Supported languages */
export const Language = {
  ENGLISH: "English",
  SPANISH: "Spanish",
  GERMAN: "German",
  FRENCH: "French",
  ITALIAN: "Italian",
  PORTUGUESE: "Portuguese",
  DUTCH: "Dutch",
  JAPANESE: "Japanese",
  HINDI: "Hindi",
  CHINESE: "Chinese",
} as const

export type LanguageType = (typeof Language)[keyof typeof Language]

/** Job schedule types */
export const ScheduleType = {
  DAILY: "daily",
  WEEKLY: "weekly",
  WEEKDAYS: "weekdays",
  MONTHDAYS: "monthdays",
  CUSTOM: "custom",
} as const

export type ScheduleTypeValue = (typeof ScheduleType)[keyof typeof ScheduleType]

/** Posting platform types */
export type PostingType = "WORDPRESS" | "SHOPIFY" | "SERVERENDPOINT" | "WIX" | null

export interface QuickBlogFormData {
  topic: string
  exactTitle: boolean
  performKeywordResearch: boolean
  addImages: boolean
  imageSource: ImageSourceType
  template: string | null
  templateIds: number[]
  keywords: string[]
  focusKeywords: string[]
  otherLinkInput: string
  focusKeywordInput: string
  keywordInput: string
  languageToWrite: LanguageType
  costCutter: boolean
  easyToUnderstand: boolean
}

/** Data sent to API for QuickBlogModal */
export interface QuickBlogFinalData {
  topic: string
  exactTitle: boolean
  performKeywordResearch: boolean
  addImages: boolean
  imageSource: ImageSourceType
  template: string | null
  templateIds: number[]
  keywords: string[]
  focusKeywords: string[]
  languageToWrite: LanguageType
  costCutter: boolean
  easyToUnderstand: boolean
  embedYouTubeVideos: boolean
  type: "quick" | "yt"
  otherLinks: string[]
}

export interface BulkBlogFormData {
  templates: string[]
  templateIds: number[]
  topics: string[]
  keywords: string[]
  topicInput: string
  keywordInput: string
  performKeywordResearch: boolean
  tone: ToneType | ""
  languageToWrite: LanguageType
  userDefinedLength: number
  imageSource: ImageSourceType
  useBrandVoice: boolean
  useCompetitors: boolean
  includeInterlinks: boolean
  includeFaqs: boolean
  numberOfBlogs: number
  numberOfImages: number
  wordpressPostStatus: boolean
  postFrequency: number
  aiModel: AiModelType
  includeTableOfContents: boolean
  isCheckedGeneratedImages: boolean
  addOutBoundLinks: boolean
  blogImages: File[]
  postingType: PostingType
  brandId: string | null
  addCTA: boolean
  isDragging: boolean
  costCutter: boolean
  easyToUnderstand: boolean
  embedYouTubeVideos: boolean
}

/** Data sent to API for BulkBlogModal */
export interface BulkBlogFinalData {
  templates: string[]
  templateIds: number[]
  topics: string[]
  keywords: string[]
  performKeywordResearch: boolean
  tone: ToneType
  languageToWrite: LanguageType
  userDefinedLength: number
  imageSource: ImageSourceType
  useBrandVoice: boolean
  useCompetitors: boolean
  includeInterlinks: boolean
  includeFaqs: boolean
  numberOfBlogs: number
  numberOfImages: number
  wordpressPostStatus: boolean
  postFrequency: number
  aiModel: AiModelType
  includeTableOfContents: boolean
  isCheckedGeneratedImages: boolean
  addOutBoundLinks: boolean
  blogImages: File[]
  postingType: PostingType
  brandId: string | null
  addCTA: boolean
  costCutter: boolean
  easyToUnderstand: boolean
  embedYouTubeVideos: boolean
}
export interface JobSchedule {
  type: ScheduleTypeValue
  customDates: string[]
  daysOfWeek: number[]
  daysOfMonth: number[]
}

/** Blog configuration within a job */
export interface JobBlogConfig {
  numberOfBlogs: number
  topics: string[]
  keywords: string[]
  templates: string[]
  tone: ToneType
  userDefinedLength: number
  imageSource: ImageSourceType
  aiModel: AiModelType
  brandId: string | null
  useBrandVoice: boolean
  isCheckedGeneratedImages: boolean
  isCheckedCustomImages: boolean
  addCTA: boolean
  numberOfImages: number
  blogImages: File[]
  postingType: PostingType
  languageToWrite: LanguageType
  costCutter: boolean
  easyToUnderstand: boolean
  embedYouTubeVideos: boolean
}

/** Boolean options for job configuration */
export interface JobOptions {
  wordpressPosting: boolean
  includeFaqs: boolean
  includeCompetitorResearch: boolean
  includeInterlinks: boolean
  performKeywordResearch: boolean
  includeTableOfContents: boolean
  addOutBoundLinks: boolean
  embedYouTubeVideos: boolean
  easyToUnderstand: boolean
}

/** Internal form state for JobModal */
export interface JobFormData {
  keywords: string[]
  keywordInput: string
  performKeywordResearch: boolean
  aiModel: AiModelType
  postingType: PostingType
  templates?: string[]
  topicInput?: string
  isDragging?: boolean
}

/** Complete job data structure */
export interface JobData {
  name: string
  schedule: JobSchedule
  blogs: JobBlogConfig
  options: JobOptions
  status: "active" | "stop"
  templateIds: number[]
}

/** Data sent to API for Job create/update */
export interface JobFinalData {
  name: string
  schedule: JobSchedule
  blogs: JobBlogConfig & {
    keywords: string[]
    aiModel: AiModelType
    postingType: PostingType
    imageSource: ImageSourceType
    brandId: string | null
  }
  options: JobOptions & { performKeywordResearch: boolean }
  status: "active" | "stop"
  templateIds: number[]
}

export interface AdvancedBlogOptions {
  exactTitle: boolean
  performKeywordResearch: boolean
  includeFaqs: boolean
  includeInterlinks: boolean
  includeCompetitorResearch: boolean
  addOutBoundLinks: boolean
  addCTA: boolean
  embedYouTubeVideos: boolean
  easyToUnderstand: boolean
}

/** Internal form state for AdvancedBlogModal */
export interface AdvancedBlogFormData {
  templateIds: number[]
  template: string
  topic: string
  focusKeywords: string[]
  keywords: string[]
  title: string
  tone: ToneType | ""
  userDefinedLength: number
  brief: string
  aiModel: AiModelType
  isCheckedGeneratedImages: boolean
  imageSource: ImageSourceType
  numberOfImages: number
  blogImages: File[]
  referenceLinks: string[]
  isCheckedQuick: boolean
  isCheckedBrand: boolean
  brandId: string
  languageToWrite: LanguageType
  costCutter: boolean
  easyToUnderstand: boolean
  embedYouTubeVideos: boolean
  options: AdvancedBlogOptions
}

/** Data sent to API for AdvancedBlogModal */
export interface AdvancedBlogFinalData {
  templateIds: number[]
  template: string
  topic: string
  focusKeywords?: string[]
  keywords?: string[]
  title?: string
  tone: ToneType
  userDefinedLength: number
  brief: string
  aiModel: AiModelType
  isCheckedGeneratedImages: boolean
  imageSource: ImageSourceType
  numberOfImages: number
  blogImages?: File[]
  referenceLinks: string[]
  isCheckedQuick: boolean
  isCheckedBrand: boolean
  brandId?: string
  languageToWrite: LanguageType
  costCutter: boolean
  options: AdvancedBlogOptions
}
