export const ImageSource = { NONE: "none", STOCK: "stock", AI: "ai" } as const

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
  MONTHLY: "monthly",
  CUSTOM: "custom",
} as const

export type ScheduleTypeValue = (typeof ScheduleType)[keyof typeof ScheduleType]
