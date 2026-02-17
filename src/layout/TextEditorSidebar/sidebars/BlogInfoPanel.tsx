import { motion } from "framer-motion"
import { Info, Crown, TagIcon } from "lucide-react"
import { Button, Input, message } from "antd"
import { useAnimations } from "../hooks/useAnimations"
import type { BlogInfoPanelProps } from "../types"

/**
 * Blog Info Panel - Display and edit blog metadata like slug, template, category, etc.
 */
const BlogInfoPanel: React.FC<BlogInfoPanelProps> = ({
  blog,
  blogSlug,
  setBlogSlug,
  isEditingSlug,
  setIsEditingSlug,
  hasPublishedLinks,
  onSlugSave,
}) => {
  const { panel, item } = useAnimations()

  const handleSlugSave = async () => {
    if (!blogSlug.trim()) {
      return message.error("Slug cannot be empty")
    }
    try {
      await onSlugSave(blogSlug)
      setIsEditingSlug(false)
      message.success("Slug updated successfully")
    } catch (error) {
      console.error("Failed to update slug:", error)
      message.error("Failed to update slug")
    }
  }

  return (
    <motion.div
      variants={panel}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-3 border-b bg-linear-to-r from-gray-50 to-blue-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-linear-to-br from-blue-600 to-indigo-600 rounded-lg">
            <Info className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Blog Information</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Metadata and settings used for this blog
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scroll">
        {/* Blog Slug */}
        <motion.div variants={item} className="p-3 bg-white border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-500">Blog Slug</div>
            {!hasPublishedLinks && (
              <button
                onClick={() => setIsEditingSlug(!isEditingSlug)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                {isEditingSlug ? "Cancel" : "Edit"}
              </button>
            )}
          </div>
          {isEditingSlug && !hasPublishedLinks ? (
            <div className="space-y-2">
              <Input
                size="small"
                value={blogSlug}
                onChange={e => setBlogSlug(e.target.value)}
                placeholder="blog-slug"
                className="text-sm font-mono"
              />
              <Button size="small" type="primary" block onClick={handleSlugSave}>
                Save Slug
              </Button>
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
        </motion.div>

        {/* Template & Category */}
        <motion.div variants={item} className="space-y-3">
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Template</div>
            <div className="font-semibold text-gray-900">{blog?.template || "N/A"}</div>
          </div>
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Category</div>
            <div className="font-semibold text-gray-900">{blog?.category || "N/A"}</div>
          </div>
        </motion.div>

        {/* Brand Information */}
        {(blog?.brandId || blog?.nameOfVoice) && (
          <motion.div
            variants={item}
            className="p-3 bg-linear-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-3.5 h-3.5 text-purple-600" />
              <div className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                Brand Voice
              </div>
            </div>
            <div className="font-bold text-gray-900">
              {typeof blog.brandId === "object" && blog.brandId
                ? blog.brandId.nameOfVoice || blog.brandId.name || "Brand Voice"
                : blog.nameOfVoice || "Custom Brand"}
            </div>
            {((typeof blog.brandId === "object" && blog.brandId?.describeBrand) ||
              blog.describeBrand) && (
              <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                {typeof blog.brandId === "object" && blog.brandId?.describeBrand
                  ? blog.brandId.describeBrand
                  : blog.describeBrand}
              </p>
            )}
          </motion.div>
        )}

        {/* Tags */}
        {blog?.tags && blog.tags.length > 0 && (
          <motion.div variants={item} className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-2">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {blog.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                >
                  <TagIcon className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Keywords */}
        {blog?.keywords && blog.keywords.length > 0 && (
          <motion.div variants={item} className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-2">Keywords</div>
            <div className="flex flex-wrap gap-1.5">
              {blog.keywords.map((kw, i) => (
                <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                  {kw}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Focus Keywords */}
        {blog?.focusKeywords && blog.focusKeywords.length > 0 && (
          <motion.div variants={item} className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-2">Focus Keywords</div>
            <div className="flex flex-wrap gap-1.5">
              {blog.focusKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tone & Word Count */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Tone</div>
            <div className="font-semibold text-gray-900">{blog?.tone || "N/A"}</div>
          </div>
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Target Length</div>
            <div className="font-semibold text-gray-900">{blog?.userDefinedLength || 0} words</div>
          </div>
        </motion.div>

        {/* AI Model & Image Source */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-1">AI Model</div>
            <div className="font-semibold text-gray-900 capitalize">{blog?.aiModel || "N/A"}</div>
          </div>
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Image Source</div>
            <div className="font-semibold text-gray-900 capitalize">
              {blog?.imageSource || "none"}
            </div>
          </div>
        </motion.div>

        {/* Options/Features */}
        {blog?.options && (
          <motion.div variants={item} className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-2">Features Enabled</div>
            <div className="space-y-1.5">
              {Object.entries(blog.options).map(
                ([key, value]) =>
                  value && (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span className="text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </div>
                  )
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default BlogInfoPanel
