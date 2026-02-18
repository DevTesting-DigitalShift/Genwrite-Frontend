import { motion } from "framer-motion"
import { Send, RefreshCw, ExternalLink, Info, X } from "lucide-react"
import { Select, Switch, Button, message } from "antd"
import { useNavigate } from "react-router-dom"
import { useAnimations } from "../hooks/useAnimations"
import type { PostingPanelProps } from "../types"
import { PLATFORM_LABELS, POPULAR_CATEGORIES } from "../constants"

/**
 * Posting Panel - Complex publishing workflow
 * Handles platform selection, category management, and post history
 */
const PostingPanel: React.FC<PostingPanelProps> = ({
  blog,
  integrations,
  blogPostings,
  isLoadingPostings,
  selectedCategory,
  setSelectedCategory,
  selectedIntegration,
  setSelectedIntegration,
  includeTableOfContents,
  setIncludeTableOfContents,
  isCategoryLocked,
  categoryError,
  platformError,
  errors,
  onPost,
  isPosting,
  formData,
  hasAnyIntegration,
}) => {
  const { panel, item, stagger } = useAnimations()
  const navigate = useNavigate()

  const hasPublishedLinks = blogPostings.length > 0

  /**
   * Handle category change from select
   */
  const handleCategoryChange = (value: string[]) => {
    // If multiple values selected (mode='tags'), take the last one to allow switching
    const newCategory = value.length > 0 ? value[value.length - 1] : ""
    setSelectedCategory(newCategory)
  }

  /**
   * Remove selected category
   */
  const handleCategoryRemove = () => {
    setSelectedCategory("")
  }

  /**
   * Handle platform selection
   */
  const handleIntegrationChange = (platform: string) => {
    const integrationData = integrations?.integrations?.[platform]
    if (!integrationData) return

    setSelectedIntegration({
      platform: platform.toLowerCase(),
      rawPlatform: platform,
      url: integrationData.url || integrationData.frontend || "",
    })
  }

  /**
   * Handle publish click with validation
   */
  const handlePublishClick = () => {
    // Validation
    if (!selectedIntegration) {
      message.error("Please select a platform")
      return
    }
    if (!selectedCategory) {
      message.error("Please select a category")
      return
    }

    // Call parent handler
    onPost({
      ...formData,
      categories: selectedCategory,
      includeTableOfContents,
      type: { platform: selectedIntegration.rawPlatform },
    })
  }

  /**
   * Handle repost with same settings
   */

  const handleRepost = (posting: any) => {
    onPost({
      ...formData,
      categories: posting.category || blog.category,
      includeTableOfContents: posting.includeTableOfContents,
      type: { platform: posting.integrationType || posting.platform },
    })
  }

  return (
    <motion.div
      variants={panel}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col h-full bg-white relative"
    >
      {/* Header */}
      <div className="p-3 border-b bg-linear-to-r from-emerald-50 to-green-50 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-linear-to-br from-green-600 to-emerald-600 rounded-lg">
            <Send className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Publishing</h3>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        variants={stagger}
        className="flex-1 overflow-y-auto p-3 space-y-6 custom-scroll pb-20"
      >
        {/* === POST HISTORY SECTION === */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Post History
              </span>
            </div>
          </div>

          {isLoadingPostings ? (
            <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Loading history...</p>
            </div>
          ) : hasPublishedLinks ? (
            <div className="space-y-3">
              {blogPostings.map((posting, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-100 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-gray-700">
                      {(posting.integrationType &&
                        PLATFORM_LABELS[posting.integrationType as keyof typeof PLATFORM_LABELS]) ||
                        (posting.platform &&
                          PLATFORM_LABELS[posting.platform as keyof typeof PLATFORM_LABELS]) ||
                        posting.integrationType ||
                        posting.platform ||
                        "Unknown"}
                    </span>
                    <span className="text-[12px] text-gray-400">
                      {new Date(posting.postedOn).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between">
                      <span className="text-[12px] text-gray-400">Category:</span>
                      <span className="text-[12px] font-medium text-gray-700 text-right truncate max-w-[120px]">
                        {blog.category}
                      </span>
                    </div>
                    {posting.link && (
                      <a
                        href={posting.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-end gap-1 text-[12px] text-blue-600 hover:underline"
                      >
                        View Live <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <Button
                    size="small"
                    block
                    className="text-[12px] font-semibold h-7"
                    onClick={() => handleRepost(posting)}
                    disabled={isPosting}
                  >
                    Repost Same Settings
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
              <p className="text-xs text-gray-400 italic">No posting history yet.</p>
            </div>
          )}
        </motion.div>

        {/* === NEW POST SECTION === */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                New Post
              </span>
            </div>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[12px] font-bold">
              {selectedIntegration
                ? PLATFORM_LABELS[selectedIntegration.rawPlatform] || "Selected"
                : "Configure"}
            </span>
          </div>

          <div className="space-y-4">
            {/* Platform Select */}
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Select Platform
              </label>
              {integrations?.integrations && Object.keys(integrations.integrations).length > 0 ? (
                <Select
                  className="w-full"
                  placeholder="Choose platform..."
                  value={selectedIntegration?.rawPlatform || undefined}
                  onChange={handleIntegrationChange}
                  status={platformError ? "error" : ""}
                >
                  {Object.entries(integrations.integrations).map(([k]) => (
                    <Select.Option key={k} value={k}>
                      {PLATFORM_LABELS[k] || k}
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-800">
                  No platforms connected.{" "}
                  <span
                    className="font-bold cursor-pointer underline"
                    onClick={() => navigate("/plugins")}
                  >
                    Connect now
                  </span>
                  .
                </div>
              )}
              {platformError && <p className="text-[10px] text-red-500 mt-1">{errors.platform}</p>}
            </div>
            {/* Category Select */}
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Select Category
              </label>

              {/* Active Category Tag */}
              {selectedCategory && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium max-w-full">
                    <span className="truncate">{selectedCategory}</span>
                    {!isCategoryLocked && (
                      <X
                        size={12}
                        className="cursor-pointer opacity-75 hover:opacity-100"
                        onClick={handleCategoryRemove}
                      />
                    )}
                  </div>
                </div>
              )}

              <Select
                mode="tags"
                className="w-full"
                placeholder="Select or type..."
                value={selectedCategory ? [selectedCategory] : []}
                onChange={handleCategoryChange}
                disabled={isCategoryLocked}
                showSearch
                allowClear
                status={categoryError ? "error" : ""}
                options={POPULAR_CATEGORIES.map(c => ({ value: c, label: c }))}
              />

              {categoryError && <p className="text-[10px] text-red-500 mt-1">{errors.category}</p>}

              {isCategoryLocked && selectedIntegration?.platform === "shopify" && (
                <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-[10px] border border-blue-100 rounded">
                  <Info className="inline w-3 h-3 mr-1" />
                  Shopify categories are permanent once posted.
                </div>
              )}
            </div>
            {/* ToC Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <span className="text-xs font-semibold text-gray-800">Table of Contents</span>
              <Switch
                size="small"
                checked={includeTableOfContents}
                onChange={setIncludeTableOfContents}
              />
            </div>
            <div className="h-4" /> {/* Spacer */}
          </div>
        </motion.div>
      </motion.div>

      {/* Main Post Action - Fixed Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] z-20">
        <button
          onClick={handlePublishClick}
          disabled={isPosting || !hasAnyIntegration}
          className={`
            w-full py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95
            ${
              isPosting || !hasAnyIntegration
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-200"
            }
          `}
        >
          {isPosting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Publish Now</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

export default PostingPanel
