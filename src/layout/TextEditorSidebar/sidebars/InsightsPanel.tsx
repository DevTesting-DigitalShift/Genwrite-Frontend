import { useState } from "react"
import { motion } from "framer-motion"
import {
  Lightbulb,
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  MousePointerClick,
  Eye,
  Target,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  RefreshCw,
} from "lucide-react"
import { useAnimations } from "../hooks/useAnimations"
import useViewport from "@/hooks/useViewport"
import type { InsightsPanelProps, InsightSuggestion } from "../types"
import { COSTS } from "@/data/blogData"

const PRIORITY_STYLES: Record<InsightSuggestion["priority"], string> = {
  high: "bg-red-50 text-red-600 border-red-100",
  medium: "bg-amber-50 text-amber-600 border-amber-100",
  low: "bg-blue-50 text-blue-600 border-blue-100",
}

const PRIORITY_ORDER: Record<InsightSuggestion["priority"], number> = { high: 0, medium: 1, low: 2 }

/**
 * Highest-impact work first, and anything already applied sinks to the bottom —
 * the model returns suggestions in no particular order.
 */
const sortSuggestions = (suggestions: InsightSuggestion[]) =>
  [...suggestions].sort((a, b) => {
    const aDone = a.status === "applied" ? 1 : 0
    const bDone = b.status === "applied" ? 1 : 0
    if (aDone !== bDone) return aDone - bDone
    return (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3)
  })

const TREND_DISPLAY = {
  // Lower position number = better ranking, so "up" is the good direction.
  up: { icon: TrendingUp, label: "Improving", className: "text-emerald-600" },
  down: { icon: TrendingDown, label: "Declining", className: "text-red-600" },
  flat: { icon: Minus, label: "Steady", className: "text-gray-500" },
  unknown: { icon: HelpCircle, label: "No trend", className: "text-gray-400" },
} as const

const MetricTile = ({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType
  value: string | number
  label: string
}) => (
  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center">
    <Icon className="w-4 h-4 text-gray-400 mb-1.5" />
    <div className="text-lg font-black text-gray-900 leading-none">{value}</div>
    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">
      {label}
    </div>
  </div>
)

/**
 * A single suggestion card. Keeps its own scope/republish choice so each
 * suggestion can be applied differently without a shared form.
 */
const SuggestionCard = ({
  suggestion,
  onApply,
  isApplying,
  isBusy,
}: {
  suggestion: InsightSuggestion
  onApply: (options: { scope: "section" | "whole"; republish: boolean }) => void
  isApplying: boolean
  isBusy: boolean
}) => {
  const [scope, setScope] = useState<"section" | "whole">("section")
  const [republish, setRepublish] = useState(false)

  const isApplied = suggestion.status === "applied"

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isApplied ? "bg-emerald-50/40 border-emerald-100" : "bg-white border-gray-100 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h5 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">
          {suggestion.sectionTitle || "Untitled section"}
        </h5>
        <span
          className={`shrink-0 text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border ${
            PRIORITY_STYLES[suggestion.priority]
          }`}
        >
          {suggestion.priority}
        </span>
      </div>

      <div className="space-y-2.5 mb-3">
        <div className="flex gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-600 leading-relaxed">{suggestion.issue}</p>
        </div>
        <div className="flex gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
            {suggestion.recommendation}
          </p>
        </div>
      </div>

      {suggestion.targetKeywords?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {suggestion.targetKeywords.map((keyword) => (
            <span
              key={keyword}
              className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg font-medium"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      {isApplied ? (
        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600">
          <CheckCircle2 className="w-4 h-4" />
          Applied to your content
        </div>
      ) : (
        <div className="space-y-2.5 pt-3 border-t border-gray-100">
          <div className="flex gap-1.5">
            {(["section", "whole"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setScope(option)}
                disabled={isBusy}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border disabled:opacity-50 ${
                  scope === option
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                {option === "section" ? "This section" : "Whole blog"}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={republish}
              onChange={(e) => setRepublish(e.target.checked)}
              disabled={isBusy}
              className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600 disabled:opacity-50"
            />
            <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
              <Send className="w-3 h-3" />
              Republish after rewrite
            </span>
          </label>

          <button
            type="button"
            onClick={() => onApply({ scope, republish })}
            disabled={isBusy}
            className={`w-full py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${
              isBusy
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-linear-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg active:scale-[0.98]"
            }`}
          >
            {isApplying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Rewriting...
              </>
            ) : (
              `Apply Fix (${COSTS.BLOG_INSIGHT.APPLY} Credits)`
            )}
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Insights Panel — AI performance review of a published blog, driven by its
 * Search Console data, with one-click rewrites for each suggestion.
 */
const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insight,
  isAnalyzing,
  onAnalyze,
  onApplySuggestion,
  applyingSuggestionId,
  hasPublishedLinks,
  setIsSidebarOpen,
}) => {
  const { panel, item, stagger } = useAnimations()
  const { isMobile } = useViewport()

  const isBusy = isAnalyzing || applyingSuggestionId !== null
  const trend = TREND_DISPLAY[insight?.metricsSnapshot?.trend || "unknown"]
  const TrendIcon = trend.icon

  const pendingCount = insight?.suggestions?.filter((s) => s.status !== "applied").length || 0

  return (
    <motion.div
      variants={panel}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.15 }}
      className="flex flex-col h-full bg-white"
    >
      {/* Header */}
      <div className="p-4 border-b bg-white sticky top-0 z-10 border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-linear-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-100">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Performance Insights</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Search Console driven
              </p>
            </div>
          </div>
          {setIsSidebarOpen && isMobile && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Not published yet — analysis needs live search data, so there is nothing to run */}
      {!hasPublishedLinks ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
            <Send className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Not Published Yet</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Performance insights are based on real Search Console data. Publish this blog first,
            then come back once it has been live for a few days.
          </p>
        </div>
      ) : (
        <motion.div
          variants={stagger}
          className="flex-1 overflow-y-auto p-4 space-y-5 custom-scroll"
        >
          {/* Empty state — analysis never run for this blog */}
          {!insight && !isAnalyzing && (
            <motion.div
              variants={item}
              className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm text-center"
            >
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <Lightbulb className="w-7 h-7 text-indigo-500" />
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-2">Review this blog</h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                We'll pull this blog's Search Console performance since it went live and suggest
                section-level rewrites to lift its rankings.
              </p>
              <button
                type="button"
                onClick={onAnalyze}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-linear-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg active:scale-[0.98] transition-all"
              >
                Analyze Performance ({COSTS.BLOG_INSIGHT.ANALYZE} Credits)
              </button>
            </motion.div>
          )}

          {/* Analysis in flight — this call is slow (GSC fetch + AI), so be explicit */}
          {isAnalyzing && (
            <motion.div
              variants={item}
              className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm text-center"
            >
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
              <h4 className="text-sm font-bold text-gray-900 mb-1">Analyzing performance</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Pulling Search Console data and reviewing every section. This can take a minute.
              </p>
            </motion.div>
          )}

          {insight && !isAnalyzing && (
            <>
              {/* Metrics snapshot */}
              <motion.div variants={item} className="grid grid-cols-3 gap-2.5">
                <MetricTile
                  icon={MousePointerClick}
                  value={insight.metricsSnapshot?.totalClicks ?? 0}
                  label="Clicks"
                />
                <MetricTile
                  icon={Eye}
                  value={insight.metricsSnapshot?.totalImpressions ?? 0}
                  label="Impressions"
                />
                <MetricTile
                  icon={Target}
                  value={insight.metricsSnapshot?.avgPosition || "—"}
                  label="Avg Pos"
                />
              </motion.div>

              <motion.div
                variants={item}
                className={`flex items-center gap-2 text-[11px] font-bold ${trend.className}`}
              >
                <TrendIcon className="w-4 h-4" />
                {trend.label}
                <span className="text-gray-400 font-medium ml-auto">
                  {new Date(insight.generatedAt).toLocaleDateString()}
                </span>
              </motion.div>

              {/* Indexing note — set when there was no search data to work with */}
              {insight.indexingNote && (
                <motion.div
                  variants={item}
                  className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {insight.indexingNote}
                  </p>
                </motion.div>
              )}

              {/* Overall summary */}
              {insight.overallSummary && (
                <motion.div
                  variants={item}
                  className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      Summary
                    </h4>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{insight.overallSummary}</p>
                </motion.div>
              )}

              {/* Suggestions */}
              <motion.div variants={item} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Suggestions
                  </h4>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                    {pendingCount} pending
                  </span>
                </div>

                {insight.suggestions?.length ? (
                  sortSuggestions(insight.suggestions).map((suggestion) => (
                    <SuggestionCard
                      key={suggestion._id}
                      suggestion={suggestion}
                      isApplying={applyingSuggestionId === suggestion._id}
                      isBusy={isBusy}
                      onApply={(options) => onApplySuggestion(suggestion, options)}
                    />
                  ))
                ) : (
                  <p className="text-[11px] text-gray-400 text-center py-4">
                    No suggestions — this blog is performing well as written.
                  </p>
                )}
              </motion.div>

              {/* Re-run */}
              <motion.div variants={item}>
                <button
                  type="button"
                  onClick={onAnalyze}
                  disabled={isBusy}
                  className="w-full py-2.5 px-4 rounded-xl text-[11px] font-bold border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-analyze ({COSTS.BLOG_INSIGHT.ANALYZE} Credits)
                </button>
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

export default InsightsPanel
