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
  ExternalLink,
} from "lucide-react"
import { useAnimations } from "../hooks/useAnimations"
import type { SeoPanelProps } from "../types"
import { CompetitorsList } from "../FeatureComponents"

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
      className="flex flex-col h-full bg-white"
    >
      {/* Header */}
      <div className="p-4 border-b bg-slate-50/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/10 transition-colors" />
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-950 rounded-lg shadow-lg shadow-slate-900/10 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 tracking-tight">System Intelligence</h3>
                {isPro && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-black uppercase tracking-widest flex items-center gap-1 border border-amber-200">
                    <Crown className="w-3 h-3" />
                    Neural+
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                SEO & Export Matrix
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div variants={stagger} className="flex-1 overflow-y-auto p-4 space-y-8 custom-scroll">
        {/* SEO Metadata Section */}
        <motion.div
          variants={item}
          className="space-y-4 p-6 bg-white border border-slate-200/60 rounded-[32px] shadow-2xl shadow-slate-200/10 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Metadata Core
            </span>
            <button
              onClick={onMetadataGenerate}
              disabled={isGeneratingMetadata}
              className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-30 disabled:grayscale transition-all"
            >
              <Sparkles className="w-3 h-3" />
              {isGeneratingMetadata ? "Generating..." : "Auto-Generate"}
            </button>
          </div>
          <div className="space-y-4">
            <input
              value={metadata.title}
              onChange={e => setMetadata(p => ({ ...p, title: e.target.value }))}
              placeholder="Meta Signature Title..."
              className="w-full text-sm rounded-xl border-none outline-none ring-1 ring-slate-100 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all h-10 px-4 font-medium"
            />
            <textarea
              value={metadata.description}
              onChange={e => setMetadata(p => ({ ...p, description: e.target.value }))}
              placeholder="Abstract Summary for AI crawlers..."
              rows={4}
              className="w-full text-sm resize-none rounded-xl border-none outline-none ring-1 ring-slate-100 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all p-4 font-medium"
            />
          </div>
          <button
            onClick={onMetadataSave}
            className="w-full h-11 text-xs font-black uppercase tracking-widest rounded-xl bg-slate-950 text-white shadow-xl shadow-slate-900/10 hover:shadow-blue-600/10 hover:bg-slate-800 transition-all active:scale-95"
          >
            Deploy Metadata
          </button>
        </motion.div>

        {/* Export Section */}
        <motion.div
          variants={item}
          className="space-y-4 p-6 bg-white border border-slate-200/60 rounded-[32px] shadow-2xl shadow-slate-200/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <Download className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Data Extraction
            </span>
            {userPlan === "free" && (
              <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-black uppercase tracking-widest border border-slate-200">
                <Lock className="w-3 h-3" /> Encrypted
              </span>
            )}
          </div>

          {/* Include Images Toggle */}
          <div
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 ${
              includeImagesInExport
                ? "bg-blue-50/50 border-blue-200"
                : "bg-slate-50 border-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <ImageIcon
                className={`w-5 h-5 transition-colors ${
                  includeImagesInExport ? "text-blue-600" : "text-slate-400"
                }`}
              />
              <span
                className={`text-xs font-black uppercase tracking-widest transition-colors ${
                  includeImagesInExport ? "text-blue-900" : "text-slate-500"
                }`}
              >
                Media Assets
              </span>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={includeImagesInExport}
              onChange={e => setIncludeImagesInExport(e.target.checked)}
              disabled={userPlan === "free"}
            />
          </div>

          {includeImagesInExport && userPlan !== "free" && (
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
              <p className="text-[10px] font-bold text-blue-700 flex items-center gap-2">
                <Info className="w-3 h-3" />
                Aggregating to ZIP format with local assets
              </p>
            </div>
          )}

          <div className="grid gap-4 grid-cols-1">
            {/* Markdown */}
            <button
              onClick={onExportMarkdown}
              disabled={userPlan === "free"}
              className={`
                group flex items-center gap-4 py-4 px-6
                rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]
                border transition-all duration-500
                ${
                  userPlan === "free"
                    ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50"
                    : "bg-white text-slate-800 border-slate-100 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 active:scale-95"
                }
              `}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${userPlan === "free" ? "bg-slate-100" : "bg-blue-50 group-hover:bg-blue-100"}`}
              >
                <FileText
                  className={`w-5 h-5 ${userPlan === "free" ? "text-slate-300" : "text-blue-600"}`}
                />
              </div>
              <span>Protocol: .MD</span>
              <ExternalLink className="ml-auto w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* HTML */}
            <button
              onClick={onExportHTML}
              disabled={userPlan === "free"}
              className={`
                group flex items-center gap-4 py-4 px-6
                rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]
                border transition-all duration-500
                ${
                  userPlan === "free"
                    ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50"
                    : "bg-white text-slate-800 border-slate-100 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 active:scale-95"
                }
              `}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${userPlan === "free" ? "bg-slate-100" : "bg-emerald-50 group-hover:bg-emerald-100"}`}
              >
                <FileCode
                  className={`w-5 h-5 ${userPlan === "free" ? "text-slate-300" : "text-emerald-600"}`}
                />
              </div>
              <span>Structure: .HTML</span>
              <ExternalLink className="ml-auto w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* PDF */}
            <button
              onClick={onExportPDF}
              disabled={userPlan === "free"}
              className={`
                group flex items-center gap-4 py-4 px-6
                rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]
                border transition-all duration-500
                ${
                  userPlan === "free"
                    ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50"
                    : "bg-white text-slate-800 border-slate-100 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 active:scale-95"
                }
              `}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${userPlan === "free" ? "bg-slate-100" : "bg-rose-50 group-hover:bg-rose-100"}`}
              >
                <Download
                  className={`w-5 h-5 ${userPlan === "free" ? "text-slate-300" : "text-rose-600"}`}
                />
              </div>
              <span>Render: .PDF</span>
              <ExternalLink className="ml-auto w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {userPlan === "free" && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-[10px] text-amber-950 font-black uppercase tracking-widest text-center">
                Upgrade System to Unlock Export
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
                className="space-y-4 p-6 bg-white border border-slate-200/60 rounded-[32px] shadow-2xl shadow-slate-200/10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                    <BarChart className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
                    Heuristic Audit
                  </span>
                </div>

                <div className="space-y-4">
                  {Object.entries(analysisResult.insights.analysis).map(([category, data]) => (
                    <div
                      key={category}
                      className="collapse collapse-arrow bg-transparent rounded-none border-b border-slate-100 last:border-0 p-0"
                    >
                      <input type="checkbox" className="min-h-0" />
                      <div className="collapse-title flex items-center justify-between w-full p-4 pl-0 min-h-0">
                        <span className="font-bold text-slate-800 text-xs uppercase tracking-widest">
                          {category.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {data.score}/{data.maxScore}
                          </span>
                        </div>
                      </div>
                      <div className="collapse-content p-0 pb-4">
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                          {data.feedback}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Actionable Suggestions */}
            {analysisResult.insights?.suggestions &&
              analysisResult.insights.suggestions.length > 0 && (
                <motion.div
                  variants={item}
                  className="space-y-4 p-6 bg-white border border-slate-200/60 rounded-[32px] shadow-2xl shadow-slate-200/10"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center border border-amber-200">
                      <Lightbulb className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
                      Optimization Pulse
                    </span>
                    <span className="ml-auto text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-black border border-amber-100 leading-none">
                      {analysisResult.insights.suggestions.length}
                    </span>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto custom-scroll pr-2">
                    {analysisResult.insights.suggestions.map((suggestion, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <span className="text-[10px] font-black text-slate-900">{idx + 1}</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed flex-1 font-medium">
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
                className="space-y-4 p-6 bg-white border border-slate-200/60 rounded-[32px] shadow-2xl shadow-slate-200/10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
                    Market Rivals
                  </span>
                  <span className="ml-auto text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-black border border-blue-100 leading-none">
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
