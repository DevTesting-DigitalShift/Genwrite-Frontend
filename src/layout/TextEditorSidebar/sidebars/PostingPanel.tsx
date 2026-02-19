import { motion } from "framer-motion"
import { ExternalLink, Info, RefreshCw, Send, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAnimations } from "../hooks/useAnimations"
import type { PostingPanelProps } from "../types"
import { PLATFORM_LABELS, POPULAR_CATEGORIES } from "../constants"
import toast from "@utils/toast"

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
  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val)
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
      toast.error("Please select a platform")
      return
    }
    if (!selectedCategory) {
      toast.error("Please select a category")
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
      <div className="p-4 border-b bg-emerald-50/50 sticky top-0 z-10 overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-900/10 group-hover:scale-110 transition-transform duration-500">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 tracking-tight">Node Deployment</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
              Cross-Platform Publishing
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        variants={stagger}
        className="flex-1 overflow-y-auto p-4 space-y-10 custom-scroll pb-24"
      >
        {/* === POST HISTORY SECTION === */}
        <motion.div variants={item} className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Deployment Logs
              </span>
            </div>
          </div>

          {isLoadingPostings ? (
            <div className="p-10 text-center bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-300 mx-auto mb-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Syncing History...
              </p>
            </div>
          ) : hasPublishedLinks ? (
            <div className="space-y-4">
              {blogPostings.map((posting, idx) => (
                <div
                  key={idx}
                  className="p-6 bg-white rounded-[24px] border border-slate-100 shadow-sm hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      {(posting.integrationType &&
                        PLATFORM_LABELS[posting.integrationType as keyof typeof PLATFORM_LABELS]) ||
                        (posting.platform &&
                          PLATFORM_LABELS[posting.platform as keyof typeof PLATFORM_LABELS]) ||
                        posting.integrationType ||
                        posting.platform ||
                        "Unknown"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">
                      {new Date(posting.postedOn).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Tag:
                      </span>
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">
                        {blog.category}
                      </span>
                    </div>
                    {posting.link && (
                      <a
                        href={posting.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 group-hover:translate-x-1 transition-transform"
                      >
                        Source View <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => handleRepost(posting)}
                    disabled={isPosting}
                    className="w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-30"
                  >
                    Re-Sync Node
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                Logs Empty
              </p>
            </div>
          )}
        </motion.div>

        {/* === NEW POST SECTION === */}
        <motion.div variants={item} className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                <Send className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                New Deployment
              </span>
            </div>
            <span className="bg-slate-900 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
              {selectedIntegration
                ? PLATFORM_LABELS[selectedIntegration.rawPlatform] || "Selected"
                : "Awaiting Core"}
            </span>
          </div>

          <div className="space-y-6">
            {/* Platform Select */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                Target Platform
              </label>
              {integrations?.integrations && Object.keys(integrations.integrations).length > 0 ? (
                <select
                  className={`select select-sm w-full bg-slate-50 border-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-blue-600/20 focus:outline-none transition-all ${platformError ? "border-rose-500" : ""}`}
                  value={selectedIntegration?.rawPlatform || ""}
                  onChange={e => handleIntegrationChange(e.target.value)}
                >
                  <option value="" disabled>
                    Select Distribution Node...
                  </option>
                  {Object.entries(integrations.integrations).map(([k]) => (
                    <option key={k} value={k}>
                      {PLATFORM_LABELS[k] || k}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-[10px] text-amber-900 font-bold leading-relaxed">
                  No distribution nodes connected.{" "}
                  <span
                    className="underline cursor-pointer hover:text-amber-600"
                    onClick={() => navigate("/plugins")}
                  >
                    Establish connection
                  </span>
                  .
                </div>
              )}
              {platformError && (
                <p className="text-[9px] font-bold text-rose-500 mt-1 uppercase tracking-widest">
                  {errors.platform}
                </p>
              )}
            </div>

            {/* Category Select */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                Node Taxonomy (Category)
              </label>

              {/* Active Category Tag */}
              {selectedCategory && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest group transition-all hover:bg-slate-800">
                    <span className="truncate">{selectedCategory}</span>
                    {!isCategoryLocked && (
                      <X
                        size={14}
                        className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                        onClick={handleCategoryRemove}
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="relative">
                <input
                  list="categories-list"
                  className={`input input-sm w-full bg-slate-50 border-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-blue-600/20 focus:outline-none transition-all ${categoryError ? "border-rose-500" : ""}`}
                  placeholder="Assign Tag or Create New..."
                  value={selectedCategory}
                  onChange={e => handleCategoryChange(e.target.value)}
                  disabled={isCategoryLocked}
                />
                <datalist id="categories-list">
                  {POPULAR_CATEGORIES.map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {categoryError && (
                <p className="text-[9px] font-bold text-rose-500 mt-1 uppercase tracking-widest">
                  {errors.category}
                </p>
              )}

              {isCategoryLocked && selectedIntegration?.platform === "shopify" && (
                <div className="p-3 bg-blue-50/50 text-blue-700 text-[9px] font-bold border border-blue-100 rounded-xl flex items-start gap-2">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  <p className="uppercase tracking-widest">
                    Shopify taxonomies are persistent after deployment.
                  </p>
                </div>
              )}
            </div>

            {/* ToC Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl group transition-all hover:bg-slate-50">
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                Index Mapping (TOC)
              </span>
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-primary"
                checked={includeTableOfContents}
                onChange={e => setIncludeTableOfContents(e.target.checked)}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Post Action - Fixed Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-20">
        <button
          onClick={handlePublishClick}
          disabled={isPosting || !hasAnyIntegration}
          className={`
            w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl
            ${
              isPosting || !hasAnyIntegration
                ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                : "bg-slate-950 text-white hover:bg-slate-800 shadow-slate-900/20 hover:shadow-blue-600/10"
            }
          `}
        >
          {isPosting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Deploying...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Initiate Deployment</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

export default PostingPanel
