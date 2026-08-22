import { BarChart3, TrendingUp, Info, Send, RefreshCw, Crown } from "lucide-react"

/**
 * Platform labels for display
 */
export const PLATFORM_LABELS: Record<string, string> = {
  WORDPRESS: "WordPress",
  SHOPIFY: "Shopify",
  SERVERENDPOINT: "Server",
  WIX: "Wix",
}

/**
 * Popular WordPress categories (limited to 15 for relevance)
 */
export const POPULAR_CATEGORIES = [
  "Blogging",
  "Technology",
  "Lifestyle",
  "Travel",
  "Food & Drink",
  "Health & Wellness",
  "Fashion",
  "Business",
  "Education",
  "Entertainment",
  "Photography",
  "Fitness",
  "Marketing",
  "Finance",
  "DIY & Crafts",
]

/**
 * Navigation items for sidebar
 * Dynamic based on blog context
 */
export interface NavItem {
  id: string

  icon: any
  label: string
}

export const BASE_NAV_ITEMS: NavItem[] = [
  { id: "overview", icon: BarChart3, label: "Overview" },
  { id: "seo", icon: TrendingUp, label: "SEO" },
  { id: "bloginfo", icon: Info, label: "Blog Info" },
]

export const POSTING_NAV_ITEM: NavItem = { id: "posting", icon: Send, label: "Posting" }

export const REGENERATE_NAV_ITEM: NavItem = {
  id: "regenerate",
  icon: RefreshCw,
  label: "Regenerate",
}

export const BRAND_NAV_ITEM: NavItem = { id: "brand", icon: Crown, label: "Brand Voice" }
