import { motion } from "framer-motion"
import {
  TrendingUp,
  Sparkles,
  Download,
  FileText,
  FileCode,
  Lock,
  ImageIcon,
  Info,
  BarChart,
  Target,
  Lightbulb,
  Crown,
} from "lucide-react"
import { Input, Switch, Collapse } from "antd"
import { useAnimations } from "../hooks/useAnimations"
import type { SeoPanelProps } from "../types"
import { CompetitorsList } from "../FeatureComponents"

const { TextArea } = Input

const SeoPanel: React.FC<SeoPanelProps> = ({
  userPlan,
  isPro,
  metadata,
  setMetadata,
  onMetadataGenerate,
  onMetadataSave,
  isGeneratingMetadata,
  analysisResult,
  includeImagesInExport,
  setIncludeImagesInExport,
  onExportMarkdown,
  onExportHTML,
  onExportPDF,
}) => {
  const { panel, item, stagger } = useAnimations()

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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">SEO & Export</h3>
                {isPro && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Metadata, analysis & export options
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div variants={stagger} className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* SEO Metadata Section */}
        <motion.div variants={item} className="space-y-3 p-3 bg-white border rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              SEO Metadata
            </span>
            <button
              onClick={onMetadataGenerate}
              disabled={isGeneratingMetadata}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3 h-3" />
              {isGeneratingMetadata ? "Generating..." : "Generate"}
            </button>
          </div>
          <div className="space-y-3">
            <Input
              value={metadata.title}
              onChange={e => setMetadata(p => ({ ...p, title: e.target.value }))}
              placeholder="Meta title..."
              size="small"
            />
            <TextArea
              value={metadata.description}
              onChange={e => setMetadata(p => ({ ...p, description: e.target.value }))}
              placeholder="Meta description..."
              rows={4}
              className="resize-none!"
            />
          </div>
          <button
            onClick={onMetadataSave}
            className="w-full py-2 text-sm font-semibold rounded-lg bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow hover:shadow-md transition-all"
          >
            Save Metadata
          </button>
        </motion.div>

        {/* Export Section */}
        <motion.div variants={item} className="space-y-3 p-3 bg-white border rounded-xl shadow-sm">
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
                  includeImagesInExport ? "text-blue-900" : "text-gray-700"
                }`}
              >
                Include Images
              </span>
            </div>
            <Switch
              checked={includeImagesInExport}
              onChange={setIncludeImagesInExport}
              disabled={userPlan === "free"}
              size="small"
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

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Markdown */}
            <button
              onClick={onExportMarkdown}
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
                className={`w-6 h-6 ${userPlan !== "free" && "sm:group-hover:scale-110 transition-transform"}`}
              />
              <span>Markdown</span>
            </button>

            {/* HTML */}
            <button
              onClick={onExportHTML}
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
                className={`w-6 h-6 ${userPlan !== "free" && "sm:group-hover:scale-110 transition-transform"}`}
              />
              <span>HTML</span>
            </button>

            {/* PDF */}
            <button
              onClick={onExportPDF}
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
                className={`w-6 h-6 ${userPlan !== "free" && "sm:group-hover:scale-110 transition-transform"}`}
              />
              <span>PDF</span>
            </button>
          </div>

          {userPlan === "free" && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 text-center font-medium">
                🔒 Upgrade to export your blogs in multiple formats
              </p>
            </div>
          )}
        </motion.div>

        {/* Analysis Results */}
        {analysisResult && (
          <>
            {/* Detailed Analysis Breakdown */}
            {analysisResult.insights?.analysis && (
              <motion.div
                variants={item}
                className="space-y-3 p-3 bg-white border rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <BarChart className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-900">Detailed Analysis</span>
                </div>
                <Collapse
                  ghost
                  className="bg-transparent"
                  items={Object.entries(analysisResult.insights.analysis).map(
                    ([category, data]) => ({
                      key: category,
                      label: (
                        <div className="flex items-center justify-between w-full pr-2">
                          <span className="font-medium text-gray-800 text-sm">
                            {category.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-600">
                              {data.score}/{data.maxScore}
                            </span>
                          </div>
                        </div>
                      ),
                      children: (
                        <div>
                          <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                            {data.feedback}
                          </p>
                        </div>
                      ),
                    })
                  )}
                />
              </motion.div>
            )}

            {/* Actionable Suggestions */}
            {analysisResult.insights?.suggestions &&
              analysisResult.insights.suggestions.length > 0 && (
                <motion.div
                  variants={item}
                  className="space-y-3 p-3 bg-white border rounded-xl shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      Actionable Suggestions
                    </span>
                    <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {analysisResult.insights.suggestions.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scroll">
                    {analysisResult.insights.suggestions.map((suggestion, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100"
                      >
                        <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-amber-700">{idx + 1}</span>
                        </div>
                        <p className="text-xs text-amber-900 leading-relaxed flex-1">
                          {suggestion}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

            {/* Competitors Analysis */}
            {analysisResult.competitors && analysisResult.competitors.length > 0 && (
              <motion.div
                variants={item}
                className="space-y-3 p-3 bg-white border rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">Top Competitors</span>
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {analysisResult.competitors.length}
                  </span>
                </div>
                <CompetitorsList competitors={analysisResult.competitors} />
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default SeoPanel
