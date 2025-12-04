export interface SectionData {
  title: string
  sectionGoal?: string
  contentBrief?: string
  keywords: string[]
  minWordCount?: number
  content: string
  summary?: string
}

export interface SectionWithReveal extends SectionData {
  revealed: boolean
}
export interface FAQItem {
  question: string
  answer: string
}

export interface FAQBlock {
  heading: string
  qa: FAQItem[]
}

export interface EditorDocument {
  title: string
  description: string
  sections: SectionData[]
  faq: FAQBlock // 🔥 ADD THIS!
}
export type UserPlan = "free" | "premium"

export interface SectionItemProps {
  index: number
  section: SectionData & { revealed: boolean }
  locked: boolean
  onReveal: () => void
  onDelete: () => void
  onRegenerate: () => void
  onChange: (updated: SectionData) => void
}
