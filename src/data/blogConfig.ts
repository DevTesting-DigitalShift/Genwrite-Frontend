/**
 * Central configuration for all Blog related settings.
 * Changing values here will reflect across all modals (Manual, Bulk, Jobs, etc.)
 */

export const BLOG_CONFIG = {
  // Word count settings for sliders and defaults
  LENGTH: {
    MIN: 500,
    MAX: 5000,
    DEFAULT: 1000,
    STEP: 100,
  },

  // Image related constraints
  IMAGES: {
    MAX_COUNT: 15, // Max images allowed for AI/Stock selection
    MAX_UPLOAD_COUNT: 15, // Max images allowed for custom upload
    MAX_FILE_SIZE_MB: 1,
    UPLOAD_NOTE: "Each image size can be up to 1 MB. You can upload a maximum of 15 images at once.",
    ALLOWED_TYPES: ["image/png", "image/jpeg", "image/webp"],
  },

  // Bulk generation settings
  BULK: {
    MAX_BLOGS: 10,
    DEFAULT_FREQUENCY_SECONDS: 600, // 10 minutes
  },

  // Content constraints
  CONSTRAINTS: {
    MAX_REFERENCE_LINKS: 4,
    MAX_FOCUS_KEYWORDS: 3,
    MAX_SECONDARY_KEYWORDS: 18, // Visible before "show more"
  },
} as const;

export type BlogConfig = typeof BLOG_CONFIG;
