import { BarChart3, FileText, Sparkles, TrendingUp, X } from "lucide-react"
import useEditorStore from "@store/useEditorStore"
import type { OverviewPanelProps } from "../types"
import { ScoreCard } from "../FeatureComponents"
import { getWordCount } from "@/utils/wordUtils"

/**
 * Overview Panel - Dashboard with stats, scores, and quick actions.
 *
 * `editorContent`/`keywords` come straight from `useEditorStore` rather than as props —
 * they're shared editor state, not something specific to this panel.
 */
const OverviewPanel: React.FC<OverviewPanelProps> = ({
  blog,
  isPro,
  isPublicMode,
  isReadOnlyWorkspace,
  setIsSidebarOpen,
  onAnalyze,
  isAnalyzing,
  seoScore,
  contentScore,
}) => {
  const editorContent = useEditorStore((s) => s.editorContent)
  const keywords = useEditorStore((s) => s.keywords)

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-white sticky top-0 z-10 border-gray-300">
        <div className="flex items-center justify-between">
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

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center group hover:bg-white hover:shadow-md transition-all">
            <div className="flex flex-col items-center">
              <div className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                {getWordCount(editorContent)}
              </div>
              {blog?.userDefinedLength && (
                <div className="text-[9px] font-bold text-gray-400 -mt-1">
                  Target: {blog.userDefinedLength}
                </div>
              )}
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Current Words
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
          {/* GSC Stats */}
          {(blog?.statistics?.totalGSCClicks ?? 0) > 0 && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center group hover:bg-white hover:shadow-md transition-all">
              <div className="text-2xl font-black text-gray-900 group-hover:text-green-600 transition-colors">
                {blog?.statistics?.totalGSCClicks}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Total Clicks
              </div>
            </div>
          )}
          {(blog?.statistics?.totalGSCImpressions ?? 0) > 0 && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center group hover:bg-white hover:shadow-md transition-all">
              <div className="text-2xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                {blog?.statistics?.totalGSCImpressions}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Impressions
              </div>
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="space-y-3">
          <ScoreCard title="Quality Score" score={contentScore} icon={FileText} />
          <ScoreCard title="SEO Potential" score={seoScore} icon={TrendingUp} />
        </div>

        {/* Optimization Card — spends the owner's credits, so it's gone entirely for
            read-only collaborators rather than shown disabled. */}
        {!isReadOnlyWorkspace && (
          <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h4 className="text-base font-bold text-gray-900">Boost SEO Score</h4>
            </div>
            <p className="text-sm text-gray-500 mb-4 font-medium leading-relaxed">
              Run our advanced competitive analysis to uncover keyword opportunities and improve
              rankings.
            </p>
            <button
              type="button"
              onClick={onAnalyze}
              disabled={isAnalyzing || isPublicMode}
              className={`
              w-full py-3 px-4 rounded-md text-xs font-bold transition-all
              ${
                isAnalyzing || isPublicMode
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#4C5BD6] hover:bg-[#3B4BB8] text-white"
              }
            `}
            >
              {isPublicMode
                ? "Analysis Locked"
                : isAnalyzing
                  ? "Analyzing Content..."
                  : "Run Analysis (10 Credits)"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default OverviewPanel
