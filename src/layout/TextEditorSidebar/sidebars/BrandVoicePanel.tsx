import { motion } from "framer-motion"
import { Crown, ExternalLink, User } from "lucide-react"
import { useAnimations } from "../hooks/useAnimations"
import type { BrandVoicePanelProps } from "../types"
import { isBrandVoiceObject } from "../types"

/**
 * Brand Voice Panel - Display brand voice information
 * Shows persona, keywords, and reference links
 */
const BrandVoicePanel: React.FC<BrandVoicePanelProps> = ({ blog, onRegenerateWithBrand }) => {
  const { panel, item } = useAnimations()

  // Extract brand information with type guards
  const brandId = blog?.brandId
  const isBrandPopulated = isBrandVoiceObject(brandId)
  const brand = isBrandPopulated ? brandId : undefined

  const describeBrand =
    brand?.describeBrand || brand?.description || blog.describeBrand || blog.description || ""
  const persona = brand?.persona || blog.persona || ""
  const postLink = brand?.postLink || blog.postLink || brand?.url || ""
  const brandKeywords = brand?.keywords || []

  // Show empty state if no brand
  if (!blog?.brandId && !blog?.nameOfVoice) {
    return (
      <motion.div
        variants={panel}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex flex-col items-center justify-center h-full p-6 text-center"
      >
        <motion.div
          variants={item}
          className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100"
        >
          <Crown className="w-8 h-8 text-gray-300" />
        </motion.div>
        <motion.h3 variants={item} className="text-lg font-bold text-gray-900 mb-2">
          No Brand Selected
        </motion.h3>
        <motion.p variants={item} className="text-xs text-gray-500 leading-relaxed mb-6">
          This blog wasn't generated with a specific brand voice. Add one to maintain personality
          across your content.
        </motion.p>
        <motion.button
          variants={item}
          onClick={onRegenerateWithBrand}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all"
        >
          Regenerate with Brand
        </motion.button>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={panel}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col h-full bg-white"
    >
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-br from-purple-50 to-indigo-50 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600 rounded-xl shadow-lg shadow-purple-100">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 line-clamp-1">
              {brand?.nameOfVoice || brand?.name || blog.nameOfVoice || "Brand Voice"}
            </h3>
            <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mt-0.5">
              Authenticated Identity
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll">
        {/* Persona */}
        {persona && (
          <motion.div variants={item} className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Author Persona
              </h4>
            </div>
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-gray-700 leading-relaxed">
              {persona}
            </div>
          </motion.div>
        )}

        {/* Description */}
        {describeBrand && (
          <motion.div variants={item} className="space-y-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Brand Description
            </h4>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-700 leading-relaxed">
              {describeBrand}
            </div>
          </motion.div>
        )}

        {/* Keywords & Links */}
        <div className="grid grid-cols-1 gap-4">
          {postLink && (
            <motion.div variants={item} className="space-y-2">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Reference Site
              </h4>
              <a
                href={postLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-200 transition-all group"
              >
                <span className="text-xs font-semibold text-blue-600 truncate mr-2">
                  {postLink}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </a>
            </motion.div>
          )}

          {brandKeywords && brandKeywords.length > 0 && (
            <motion.div variants={item} className="space-y-2">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Core Keywords
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {brandKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-white border border-gray-100 text-gray-600 rounded-lg text-xs font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default BrandVoicePanel
