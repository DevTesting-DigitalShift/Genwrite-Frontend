/**
 * Utility to calculate word count across different languages,
 * including character-based languages like Japanese, Chinese, and Korean (CJK).
 */

export const getWordCount = (text: string | null | undefined): number => {
  if (!text) return 0;

  // 1. Remove HTML tags if present
  const strippedText = text.replace(/<[^>]*>/g, " ").trim();
  if (!strippedText) return 0;

  // 2. Identify CJK characters (Chinese, Japanese, Korean)
  // \u4e00-\u9fa5 : Chinese Unified Ideographs
  // \u3040-\u309f : Japanese Hiragana
  // \u30a0-\u30ff : Japanese Katakana
  // \uff00-\uffef : Full-width forms (Japanese/Korean punctuation)
  // \u4e00-\u9faf : Japanese Kanji
  // \uac00-\ud7af : Korean Hangul
  const cjkRegex = /[\u4e00-\u9fa5]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\uac00-\ud7af]|[\u3130-\u318f]/g;
  
  const cjkMatches = strippedText.match(cjkRegex) || [];
  const cjkCount = cjkMatches.length;

  // 3. Remove CJK characters to count standard space-separated words in the remaining text
  const nonCjkText = strippedText.replace(cjkRegex, " ");
  
  // Split by whitespace and filter out empty strings
  const standardWordMatches = nonCjkText.split(/\s+/).filter(word => word.length > 0);
  const standardWordCount = standardWordMatches.length;

  // Total count is the sum of characters (for CJK) and space-separated words (for others)
  return cjkCount + standardWordCount;
};

/**
 * Utility to calculate estimated reading time
 * @param text The content to analyze
 * @param wordsPerMinute Average reading speed (default: 225)
 */
export const getEstimatedReadTime = (text: string | null | undefined, wordsPerMinute: number = 225): number => {
  const words = getWordCount(text);
  if (words === 0) return 0;
  
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};
