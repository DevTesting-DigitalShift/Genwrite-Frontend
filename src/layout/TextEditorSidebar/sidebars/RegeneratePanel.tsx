import { motion } from "framer-motion"
import { RefreshCw, Sparkles } from "lucide-react"
import { useAnimations } from "../hooks/useAnimations"
import type { RegeneratePanelProps } from "../types"

/**
 * Regenerate Panel - Opens regenerate modal
 * Simple panel that triggers the regeneration flow
 */
const RegeneratePanel: React.FC<RegeneratePanelProps> = ({ onRegenerate }) => {
  const { panel, item } = useAnimations()

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
        className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-blue-100"
      >
        <RefreshCw className="w-10 h-10 text-blue-600" />
      </motion.div>

      <motion.h3 variants={item} className="text-xl font-bold text-gray-900 mb-3">
        Regenerate Blog
      </motion.h3>

      <motion.p variants={item} className="text-sm text-gray-500 leading-relaxed mb-6 max-w-xs">
        Modify settings and regenerate this blog with new parameters. Previous version will be
        archived.
      </motion.p>

      <motion.div variants={item} className="w-full max-w-xs space-y-3">
        <button
          onClick={onRegenerate}
          className="w-full py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-[0.98]"
        >
          <Sparkles className="w-5 h-5" />
          <span>Configure Regeneration</span>
        </button>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-800">
            <span className="font-bold">Note:</span> Regeneration will consume credits based on
            selected options. Review carefully before confirming.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default RegeneratePanel
