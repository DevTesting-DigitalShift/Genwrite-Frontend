import { useState } from "react"
import {
  BarChart,
  Download,
  FileCode,
  FileText,
  ImageIcon,
  Info,
  Lightbulb,
  Lock,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react"
import useEditorStore from "@store/useEditorStore"
import type { SeoPanelProps } from "../types"
import { CompetitorsList } from "../FeatureComponents"

/**
 * SEO & Export panel — metadata editing (backed by `useEditorStore.seoMetadata`, shared
 * with the accept/reject modal that lives in TextEditorSidebar) plus one-off exports.
 * `includeImagesInExport` is a purely local toggle: nothing outside this panel reads it,
 * so it isn't worth a store field — it's just threaded through the export callbacks.
 */
/**
 * The analysis API has returned each criterion both as a plain sentence and as a
 * `{ score, maxScore, feedback }` object (the generated schema types lag the
 * backend), so accept either. Rendering the object directly crashes React.
 */
const normalizeCriterion = (
  data: unknown,
): { score?: number; maxScore?: number; feedback: string } => {
  if (data && typeof data === "object") {
    const { score, maxScore, feedback } = data as {
      score?: number
      maxScore?: number
      feedback?: string
    }
    return { score, maxScore, feedback: feedback ?? "" }
  }
  return { feedback: data == null ? "" : String(data) }
}

/** Suggestions arrive as a string[] (current) or one paragraph (older responses). */
const normalizeSuggestions = (suggestions: unknown): string[] => {
  if (Array.isArray(suggestions)) return suggestions.map(String).filter(Boolean)
  if (typeof suggestions === "string" && suggestions.trim()) return [suggestions]
  return []
}

const SeoPanel: React.FC<SeoPanelProps> = ({
  blog,
  userPlan,
  isPro,
  isPublicMode,
  isReadOnlyWorkspace,
  isLocked,
  setIsSidebarOpen,
  onMetadataGenerate,
  onMetadataSave,
  isGeneratingMetadata,
  analysisResult,
  onExportMarkdown,
  onExportHTML,
  onExportPDF,
}) => {
  const metadata = useEditorStore((s) => s.seoMetadata)
  const setMetadata = useEditorStore((s) => s.setSeoMetadata)
  const [includeImagesInExport, setIncludeImagesInExport] = useState(false)

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-white sticky top-0 z-10 border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">SEO & Export</h3>
                {isPro && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg font-bold">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Metadata & Assets
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

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* SEO Metadata Section */}
        <div className="space-y-3 p-3 bg-white border border-gray-300 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              SEO Metadata
            </span>
            {!isReadOnlyWorkspace && (
              <button
                type="button"
                onClick={onMetadataGenerate}
                disabled={blog?.isArchived || isPublicMode || isGeneratingMetadata}
                className={`text-xs font-medium flex items-center gap-1 ${
                  blog?.isArchived || isPublicMode || isGeneratingMetadata
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-600 hover:text-blue-700 hover:underline"
                }`}
              >
                <Sparkles className="w-3 h-3" />{" "}
                {isPublicMode ? "Locked" : isGeneratingMetadata ? "Generating..." : "Generate"}
              </button>
            )}
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => setMetadata((p) => ({ ...p, title: e.target.value }))}
              placeholder="Meta title..."
              disabled={isLocked}
              className="input input-bordered input-sm w-full disabled:bg-gray-50 disabled:text-gray-500"
            />
            <textarea
              value={metadata.description}
              onChange={(e) => setMetadata((p) => ({ ...p, description: e.target.value }))}
              placeholder="Meta description..."
              rows={4}
              disabled={isLocked}
              className="textarea textarea-bordered w-full text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          {/* Nothing to save when the fields above can't be edited */}
          {!isReadOnlyWorkspace && (
            <button
              type="button"
              onClick={onMetadataSave}
              disabled={blog?.isArchived || isPublicMode}
              className={`w-full py-2 text-sm font-semibold rounded-lg transition-all ${
                blog?.isArchived || isPublicMode
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow hover:shadow-md"
              }`}
            >
              {isPublicMode ? "Metadata Locked" : "Save Metadata"}
            </button>
          )}
        </div>

        {/* Export Section */}
        <div className="space-y-3 p-3 bg-white border border-gray-300 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-900">Export Blog</span>
            {userPlan === "free" && (
              <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" /> Pro
              </span>
            )}
          </div>

          {/* Include Images Toggle */}
          <div
            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
              includeImagesInExport ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <ImageIcon
                className={`w-4 h-4 transition-colors ${
                  includeImagesInExport ? "text-blue-600" : "text-gray-500"
                }`}
              />
              <span
                className={`text-sm font-medium transition-colors ${
                  includeImagesInExport ? "text-blue-900" : ""
                }`}
              >
                Include Images
              </span>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm"
              checked={includeImagesInExport}
              onChange={(e) => setIncludeImagesInExport(e.target.checked)}
              disabled={userPlan === "free"}
            />
          </div>
          {includeImagesInExport && userPlan !== "free" && (
            <div className="px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-700 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Downloads as ZIP with images included
              </p>
            </div>
          )}

          <div
            className="
    grid gap-3
    grid-cols-1
    sm:grid-cols-2
    lg:grid-cols-3
  "
          >
            {/* Markdown */}
            <button
              type="button"
              onClick={() => onExportMarkdown(includeImagesInExport)}
              disabled={userPlan === "free"}
              className={`
      group flex flex-col items-center justify-center gap-2
      py-4 px-3
      rounded-xl text-sm font-semibold
      border-2 transition-all duration-300
      ${
        userPlan === "free"
          ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
          : `
            bg-linear-to-br from-blue-50 to-indigo-50
            hover:from-blue-100 hover:to-indigo-100
            text-blue-700 border-blue-200
            hover:border-blue-300 hover:shadow-lg
            active:scale-[0.98] sm:hover:scale-105
          `
      }
    `}
            >
              <FileText
                className={`
        w-6 h-6
        ${userPlan !== "free" && "sm:group-hover:scale-110 transition-transform"}
      `}
              />
              <span>Markdown</span>
            </button>

            {/* HTML */}
            <button
              type="button"
              onClick={() => onExportHTML(includeImagesInExport)}
              disabled={userPlan === "free"}
              className={`
      group flex flex-col items-center justify-center gap-2
      py-4 px-3
      rounded-xl text-sm font-semibold
      border-2 transition-all duration-300
      ${
        userPlan === "free"
          ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
          : `
            bg-linear-to-br from-purple-50 to-pink-50
            hover:from-purple-100 hover:to-pink-100
            text-purple-700 border-purple-200
            hover:border-purple-300 hover:shadow-lg
            active:scale-[0.98] sm:hover:scale-105
          `
      }
    `}
            >
              <FileCode
                className={`
        w-6 h-6
        ${userPlan !== "free" && "sm:group-hover:scale-110 transition-transform"}
      `}
              />
              <span>HTML</span>
            </button>

            {/* PDF — withheld from read-only collaborators */}
            {!isReadOnlyWorkspace && (
              <button
                type="button"
                onClick={() => onExportPDF(includeImagesInExport)}
                disabled={userPlan === "free"}
                className={`
      group flex flex-col items-center justify-center gap-2
      py-4 px-3
      rounded-xl text-sm font-semibold
      border-2 transition-all duration-300
      ${
        userPlan === "free"
          ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
          : `
            bg-linear-to-br from-green-50 to-emerald-50
            hover:from-green-100 hover:to-emerald-100
            text-green-700 border-green-200
            hover:border-green-300 hover:shadow-lg
            active:scale-[0.98] sm:hover:scale-105
          `
      }
    `}
              >
                <Download
                  className={`
        w-6 h-6
        ${userPlan !== "free" && "sm:group-hover:scale-110 transition-transform"}
      `}
                />
                <span>PDF</span>
              </button>
            )}
          </div>

          {userPlan === "free" && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 text-center font-medium">
                🔒 Upgrade to export your blogs in multiple formats
              </p>
            </div>
          )}
        </div>

        {analysisResult && (
          <div className="space-y-4">
            {/* Detailed Analysis Breakdown */}
            {analysisResult.insights?.analysis && (
              <div className="space-y-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-900">Detailed Analysis</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(analysisResult.insights.analysis).map(([category, data]) => {
                    const { score, maxScore, feedback } = normalizeCriterion(data)
                    return (
                      <div
                        key={category}
                        className="collapse collapse-arrow bg-transparent border border-gray-100 rounded-xl"
                      >
                        <input type="checkbox" className="peer" />
                        <div className="collapse-title flex items-center justify-between gap-2 pr-8">
                          <span className="font-medium text-gray-800 text-sm">{category}</span>
                          {score != null && (
                            <span className="shrink-0 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                              {score}
                              {maxScore != null && `/${maxScore}`}
                            </span>
                          )}
                        </div>
                        <div className="collapse-content">
                          <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                            {feedback}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Actionable Suggestions */}
            {normalizeSuggestions(analysisResult.insights?.suggestions).length > 0 && (
              <div className="space-y-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-gray-900">Suggestions</span>
                </div>
                <ul className="p-2.5 bg-amber-50 rounded-lg border border-amber-100 max-h-64 overflow-y-auto custom-scroll space-y-2 list-disc pl-6">
                  {normalizeSuggestions(analysisResult.insights?.suggestions).map((tip, i) => (
                    <li key={i} className="text-xs text-amber-900 leading-relaxed">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Competitors Analysis */}
            {analysisResult.competitors && analysisResult.competitors.length > 0 && (
              <div className="space-y-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">Top Competitors</span>
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {analysisResult.competitors.length}
                  </span>
                </div>
                <CompetitorsList competitors={analysisResult.competitors} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SeoPanel
