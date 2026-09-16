import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CheckCircle, Crown, Info, TagIcon, X } from "lucide-react"
import type { BlogInfoPanelProps } from "../types"

const FEATURE_FLAGS: { key: string; label: string; value: (blog: any) => boolean }[] = [
  { key: "exactTitle", label: "Exact Title", value: (b) => b?.options?.exactTitle },
  {
    key: "performKeywordResearch",
    label: "Perform Keyword Research",
    value: (b) => b?.options?.performKeywordResearch,
  },
  {
    key: "includeInterlinks",
    label: "Include Interlinks",
    value: (b) => b?.options?.includeInterlinks,
  },
  {
    key: "includeCompetitorResearch",
    label: "Include Competitor Research",
    value: (b) => b?.options?.includeCompetitorResearch,
  },
  {
    key: "addOutBoundLinks",
    label: "Add Outbound Links",
    value: (b) => b?.options?.addOutBoundLinks,
  },
  { key: "includeFaqs", label: "Include FAQs", value: (b) => b?.options?.includeFaqs },
  { key: "addCTA", label: "Add CTA", value: (b) => b?.options?.addCTA || b?.addCTA },
  {
    key: "createBrandedImages",
    label: "Create Branded Images",
    value: (b) => b?.options?.createBrandedImages || b?.createBrandedImages,
  },
  {
    key: "automaticPosting",
    label: "Automatic Posting",
    value: (b) => b?.options?.automaticPosting,
  },
  {
    key: "includeTableOfContents",
    label: "Include Table Of Contents",
    value: (b) => b?.options?.includeTableOfContents,
  },
  {
    key: "embedYouTubeVideos",
    label: "Embed YouTube Videos",
    value: (b) => b?.options?.embedYouTubeVideos || b?.embedYouTubeVideos,
  },
  {
    key: "easyToUnderstand",
    label: "Easy To Understand",
    value: (b) => b?.options?.easyToUnderstand || b?.easyToUnderstand,
  },
  { key: "costCutter", label: "Cost Cutter", value: (b) => b?.costCutter },
  { key: "isCheckedBrand", label: "Brand Voice", value: (b) => b?.isCheckedBrand },
  { key: "isCheckedQuick", label: "Quick Summary", value: (b) => b?.isCheckedQuick },
  {
    key: "humanisation",
    label: "Humanisation",
    value: (b) => b?.humanisation || b?.options?.humanisation || false,
  },
  {
    key: "extendedThinking",
    label: "Extended Thinking",
    value: (b) => b?.extendedThinking || b?.options?.extendedThinking || false,
  },
  {
    key: "deepResearch",
    label: "Deep Research",
    value: (b) => b?.deepResearch || b?.options?.deepResearch || false,
  },
]

/**
 * Blog Details panel — read-only technical/metadata view plus the one editable
 * field, the slug. Slug edit state is local: nothing outside this panel needs it.
 */
const BlogInfoPanel: React.FC<BlogInfoPanelProps> = ({
  blog,
  hasPublishedLinks,
  isReadOnlyWorkspace,
  isPublicMode,
  setIsSidebarOpen,
  onSlugSave,
}) => {
  const [blogSlug, setBlogSlug] = useState(blog?.slug || "")
  const [isEditingSlug, setIsEditingSlug] = useState(false)

  useEffect(() => {
    setBlogSlug(blog?.slug || "")
  }, [blog?.slug])

  const handleEditClick = () => {
    if (blog?.isArchived || isPublicMode) {
      toast.error(
        isPublicMode ? "Read-only mode" : "This blog is archived. Please restore it to perform this action."
      )
      return
    }
    setIsEditingSlug(!isEditingSlug)
  }

  const handleSlugSave = async () => {
    if (!blogSlug.trim()) {
      return toast.error("Slug cannot be empty")
    }
    try {
      await onSlugSave(blogSlug)
      setIsEditingSlug(false)
      toast.success("Slug updated successfully")
    } catch (error) {
      console.error("Failed to update slug:", error)
      toast.error("Failed to update slug")
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-white sticky top-0 z-10 border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 italic">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 line-clamp-1">Blog Content</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Technical Data
              </p>
            </div>
          </div>
          {setIsSidebarOpen && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scroll">
        {/* Blog Slug */}
        <div className="p-3 bg-white border border-gray-300 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-500">Blog Slug</div>
            {!hasPublishedLinks && !isReadOnlyWorkspace && (
              <button
                type="button"
                onClick={handleEditClick}
                className={`text-xs font-semibold ${
                  blog?.isArchived || isPublicMode
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                {isEditingSlug ? "Cancel" : "Edit"}
              </button>
            )}
          </div>
          {isEditingSlug && !hasPublishedLinks ? (
            <div className="space-y-2">
              <input
                type="text"
                value={blogSlug}
                onChange={(e) => setBlogSlug(e.target.value)}
                placeholder="blog-slug"
                className="input input-bordered input-sm w-full text-sm font-mono"
              />
              <button
                type="button"
                onClick={handleSlugSave}
                className="btn btn-sm btn-primary w-full text-white"
              >
                Save Slug
              </button>
            </div>
          ) : (
            <div>
              <div className="font-semibold text-gray-900 font-mono text-sm break-all">
                {blog?.slug || "Not set"}
              </div>
              {hasPublishedLinks && (
                <p className="text-[10px] text-gray-400 mt-1 italic">Slug locked after posting</p>
              )}
            </div>
          )}
        </div>

        {/* Template & Category */}
        <div className="space-y-3">
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Template</div>
            <div className="font-semibold text-gray-900">{blog?.template || "N/A"}</div>
          </div>
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Category</div>
            <div className="font-semibold text-gray-900">{blog?.category || "N/A"}</div>
          </div>
        </div>

        {/* Brand Information */}
        {blog?.brandId && (
          <div className="p-3 bg-linear-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-3.5 h-3.5 text-purple-600" />
              <div className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                Brand Voice
              </div>
            </div>
            <div className="font-bold text-gray-900">
              {typeof blog.brandId === "object" && blog.brandId
                ? blog.brandId.nameOfVoice || "Custom Brand"
                : "Custom Brand"}
            </div>
            {typeof blog.brandId === "object" && blog.brandId?.describeBrand && (
              <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                {blog.brandId.describeBrand}
              </p>
            )}
          </div>
        )}

        {/* Tags */}
        {blog?.tags && blog.tags.length > 0 && (
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            <div className="text-xs text-gray-500 mb-2">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {blog.tags.map((tag: any) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                >
                  <TagIcon className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        {blog?.keywords && blog.keywords.length > 0 && (
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            <div className="text-xs text-gray-500 mb-2">Keywords</div>
            <div className="flex flex-wrap gap-1.5">
              {blog.keywords.map((kw: any) => (
                <span key={kw} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Focus Keywords */}
        {blog?.focusKeywords && blog.focusKeywords.length > 0 && (
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            <div className="text-xs text-gray-500 mb-2">Focus Keywords</div>
            <div className="flex flex-wrap gap-1.5">
              {blog.focusKeywords.map((kw: any) => (
                <span
                  key={kw}
                  className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tone & Word Count */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Tone</div>
            <div className="font-semibold text-gray-900">{blog?.tone || "N/A"}</div>
          </div>
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Target Length</div>
            <div className="font-semibold text-gray-900">{blog?.userDefinedLength || 0} words</div>
          </div>
        </div>

        {/* AI Model & Image Source */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">AI Model</div>
            <div className="font-semibold text-gray-900 capitalize">{blog?.aiModel || "N/A"}</div>
          </div>
          <div className="p-3 bg-white border border-gray-300 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Image Source</div>
            <div className="font-semibold text-gray-900 capitalize">
              {blog?.imageSource || "none"}
            </div>
          </div>
        </div>

        {/* Options/Features */}
        <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Feature Status
            </span>
          </div>

          <div className="space-y-3">
            {FEATURE_FLAGS.map((feature) => {
              const value = feature.value(blog)
              return (
                <div
                  key={feature.key}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <span className="text-sm  font-medium">{feature.label}</span>
                  <div
                    className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border
                    ${
                      value
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }
                  `}
                  >
                    {value ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        <span>ON</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        <span>OFF</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlogInfoPanel
