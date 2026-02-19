import { motion } from "framer-motion"
import { BarChart3, Sparkles, FileText, TrendingUp, X } from "lucide-react"
import { useAnimations } from "../hooks/useAnimations"
import useViewport from "@/hooks/useViewport"
import type { OverviewPanelProps } from "../types"
import { ScoreCard } from "../FeatureComponents"

/**
 * Overview Panel - Dashboard with stats, scores, and quick actions
 */
const OverviewPanel: React.FC<OverviewPanelProps> = ({
  editorContent,
  keywords,
  setIsSidebarOpen,
  onAnalyze,
  isAnalyzing,
  seoScore,
  contentScore,
  isPro,
}) => {
  const { panel, item, stagger } = useAnimations()
  const { isMobile } = useViewport()

  /**
   * Calculate word count from editor content
   * Removes HTML tags and counts actual words
   */
  const getWordCount = (text: string): number => {
    if (!text) return 0

    // Plain text case (heuristic check for HTML tags)
    if (!/<[a-z][\s\S]*>/i.test(text)) {
      return text.trim().replace(/\s+/g, " ").split(" ").filter(Boolean).length
    }

    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, "text/html")

      // Remove non-visible / non-content elements
      const elementsToRemove = doc.querySelectorAll(
        "script, style, iframe, svg, video, audio, noscript, figure, img, table, ul, ol, li, figcaption, hr, br"
      )
      elementsToRemove.forEach(el => el.remove())

      // If article exists, use it; otherwise use body
      const content = doc.querySelector("article") || doc.body
      const strippedText = content.textContent || ""

      return strippedText.trim().replace(/\s+/g, " ").split(" ").filter(Boolean).length
    } catch (e) {
      console.error("Error parsing HTML for word count:", e)
      // Fallback to simple regex strip
      return text
        .replace(/<[^>]*>/g, " ")
        .trim()
        .replace(/\s+/g, " ")
        .split(" ")
        .filter(Boolean).length
    }
  }

  const wordCount = getWordCount(editorContent)

  return (
    <motion.div
      variants={panel}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.15 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-100">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">Analysis</h3>
                {isPro && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg font-bold">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Real-time Statistics
              </p>
            </div>
          </div>
          {setIsSidebarOpen && isMobile && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <motion.div variants={stagger} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll">
        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center group hover:bg-white hover:shadow-md transition-all">
            <div className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
              {wordCount}
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Word Count
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center group hover:bg-white hover:shadow-md transition-all">
            <div className="text-2xl font-black text-gray-900 group-hover:text-purple-600 transition-colors">
              {keywords?.length || 0}
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Keywords
            </div>
          </div>
        </motion.div>

        {/* Scores */}
        <motion.div variants={item} className="space-y-3">
          <ScoreCard title="Quality Score" score={contentScore} icon={FileText} />
          <ScoreCard title="SEO Potential" score={seoScore} icon={TrendingUp} />
        </motion.div>

        {/* Optimization Card */}
        <motion.div
          variants={item}
          className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h4 className="text-base font-bold text-gray-900">Boost SEO Score</h4>
          </div>
          <p className="text-sm text-gray-500 mb-4 font-medium leading-relaxed">
            Run our advanced competitive analysis to uncover keyword opportunities and improve
            rankings.
          </p>
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className={`
              w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm
              ${
                isAnalyzing
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg active:scale-[0.98]"
              }
            `}
          >
            {isAnalyzing ? "Analyzing Content..." : "Run Analysis (10 Credits)"}
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default OverviewPanel
