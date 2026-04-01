import React, { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import {
  Search,
  Zap,
  BarChart2,
  List,
  FileText,
  Globe,
  RefreshCw,
  Rocket,
  ShieldCheck,
  TrendingUp,
  CheckCircle,
  Plus,
  Minus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import useToolsStore from "@store/useToolsStore"
import {
  useWebsiteAnalysisMutation,
  useWebsitePromptsMutation,
  useWebsiteRankingsCheckMutation,
  useWebsiteAdvancedAnalysisMutation,
  useWebsiteOrchestratorMutation,
} from "@api/queries/toolsQueries"
import ProgressLoadingScreen from "@components/ui/ProgressLoadingScreen"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"
import ConnectedTools from "@components/ConnectedTools"
import { COSTS } from "@/data/blogData"

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden ${className}`}
  >
    <div className="p-6 md:p-8">{children}</div>
  </div>
)

const Tag = ({ children, color, className = "" }) => {
  const colorMap = {
    blue: "bg-blue-50/50 text-blue-600 border-blue-100/50",
    cyan: "bg-cyan-50/50 text-cyan-600 border-cyan-100/50",
    orange: "bg-orange-50/50 text-orange-600 border-orange-100/50",
    purple: "bg-purple-50/50 text-purple-600 border-purple-100/50",
    emerald: "bg-emerald-50/50 text-emerald-600 border-emerald-100/50",
  }
  const colorClass = colorMap[color] || "bg-gray-50/50 text-gray-600 border-gray-100/50"
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colorClass} ${className}`}
    >
      {children}
    </span>
  )
}

const Steps = ({ current, items = [] }) => {
  return (
    <div className="flex items-center justify-between w-full mb-12 relative px-2">
      <div className="absolute top-5 left-0 w-full h-px bg-gray-200 z-0" />
      {items.map((item, idx) => {
        const isActive = idx === current
        const isCompleted = idx < current
        return (
          <div key={idx} className="flex flex-col items-center gap-3 relative z-10 bg-white px-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isActive
                  ? "border-primary bg-primary text-white"
                  : isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-gray-200 bg-white text-gray-400"
              }`}
            >
              {isCompleted ? <CheckCircle className="w-5 h-5" /> : item.icon}
            </div>
            <span
              className={`text-xs font-medium ${isActive ? "text-primary" : isCompleted ? "text-emerald-600" : "text-gray-400"}`}
            >
              {item.title}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const CustomTabs = ({ items, activeKey, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 bg-gray-100/40 rounded-2xl w-fit border border-gray-200/50 backdrop-blur-sm">
        {items.map(item => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeKey === item.key
                ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div>{items.find(item => item.key === activeKey)?.children}</div>
    </div>
  )
}

const NumberStepper = ({ value, onChange, min = 1, max = 25, label }) => {
  const [direction, setDirection] = useState(1) // 1 for up, -1 for down

  const handleUpdate = newValue => {
    if (newValue > value) setDirection(1)
    else if (newValue < value) setDirection(-1)
    onChange(newValue)
  }

  const variants = {
    initial: d => ({ y: d > 0 ? 15 : -15, opacity: 0 }),
    animate: { y: 0, opacity: 1 },
    exit: d => ({ y: d > 0 ? -15 : 15, opacity: 0 }),
  }

  return (
    <div className="space-y-4">
      {label && (
        <label className="text-sm font-medium text-gray-500 ml-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleUpdate(Math.max(min, value - 1))}
          className="w-10 h-10 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-all active:scale-95"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="relative flex-1 group h-10 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center gap-2">
          <div className="relative h-6 w-8 overflow-hidden">
            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.div
                key={value}
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute inset-0 flex items-center justify-center font-bold text-gray-800 text-sm"
              >
                {value}
              </motion.div>
            </AnimatePresence>
          </div>
          <span className="text-[10px] font-bold text-primary/40">Qty</span>
        </div>
        <button
          onClick={() => handleUpdate(Math.min(max, value + 1))}
          className="w-10 h-10 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

const WebsiteRanking = () => {
  const location = useLocation()
  const [url, setUrl] = useState(location.state?.transferValue || "")
  const [region, setRegion] = useState("USA")
  const [promptCount, setPromptCount] = useState(5)
  const [selectedExpertise, setSelectedExpertise] = useState([])
  const [manualTopic, setManualTopic] = useState("")

  // Individual tool states (for Manual Mode)
  const [manualStep, setManualStep] = useState(0)
  const [activeTab, setActiveTab] = useState("1")
  const [generatedPrompts, setGeneratedPrompts] = useState([])
  const [analysisResult, setAnalysisResult] = useState(null)
  const [rankingsResult, setRankingsResult] = useState(null)

  const { websiteRanking, resetWebsiteRanking } = useToolsStore()
  const { analyser, prompts, rankings, advancedComp, orchestrator } = websiteRanking

  // Mutations
  const { mutateAsync: analyseWebsite, isPending: isAnalysing } = useWebsiteAnalysisMutation()
  const { mutateAsync: createWebsitePrompts, isPending: isCreatingPrompts } =
    useWebsitePromptsMutation()
  const { mutateAsync: checkWebsiteRankings, isPending: isCheckingRankings } =
    useWebsiteRankingsCheckMutation()
  const { mutateAsync: generateAdvancedAnalysis, isPending: isAnalyzingAdvanced } =
    useWebsiteAdvancedAnalysisMutation()
  const { mutateAsync: websiteRankingOrchestrator, isPending: isOrchestratorLoading } =
    useWebsiteOrchestratorMutation()

  const isLoading =
    isOrchestratorLoading ||
    isAnalysing ||
    isCreatingPrompts ||
    isCheckingRankings ||
    isAnalyzingAdvanced

  const getLoadingMessage = () => {
    if (isOrchestratorLoading)
      return "Deploying AI scouts to crawl target infrastructure and analyze SEO signals..."
    if (isAnalysing) return "Conducting initial site reconnaissance and extracting core metadata..."
    if (isCreatingPrompts)
      return "Synthesizing high-intent search queries based on your core topics..."
    if (isCheckingRankings) return "Querying search indexes and mapping market share distribution..."
    if (isAnalyzingAdvanced) return "Drafting strategic roadmap and executive recommendations..."
    return "Processing infrastructure data..."
  }

  const getLoadingScenario = () => {
    return isCreatingPrompts || isAnalyzingAdvanced ? "writing" : "analysis"
  }

  useEffect(() => {
    return () => {
      resetWebsiteRanking()
    }
  }, [resetWebsiteRanking])

  const handleExportMD = data => {
    if (!data) return
    const { url: auditUrl, analysis, rankings, advancedReport, strategicRecommendations } = data
    const markdownContent =
      typeof advancedReport === "string" ? advancedReport : advancedReport?.markdownReport || ""

    // Construct the full document
    let fullMD = `# SEO Audit Report: ${auditUrl}\n\n`
    fullMD += `## Executive Summary\n`
    fullMD += `- **URL**: ${auditUrl}\n`
    fullMD += `- **Region**: ${analysis?.region || "USA"}\n`
    fullMD += `- **Global Rank**: ${rankings?.ourCompanyStats?.globalRank || "N/A"}\n`
    fullMD += `- **Visibility Score**: ${
      rankings?.ourCompanyStats?.stats?.coverageRatio
        ? Math.round(rankings.ourCompanyStats.stats.coverageRatio * 100) + "%"
        : "0%"
    }\n\n`

    fullMD += `## Strategic Analysis\n${markdownContent}\n\n`

    const recs = strategicRecommendations || data.recommendations || []
    if (recs.length > 0) {
      fullMD += `## Strategic Recommendations\n`
      recs.forEach((r, i) => {
        fullMD += `${i + 1}. ${r}\n`
      })
      fullMD += `\n`
    }

    if (rankings?.results?.length) {
      fullMD += `## Keyword Rankings\n`
      fullMD += `| Keyword | Rank | Top Competitors |\n`
      fullMD += `|---------|------|----------------|\n`
      rankings.results.forEach(r => {
        const rank = r.rank && r.rank > 0 ? `#${r.rank}` : "Not listed"
        const comps = r.topCompanies?.slice(0, 3).join(", ") || ""
        fullMD += `| ${r.prompt} | ${rank} | ${comps} |\n`
      })
    }

    const blob = new Blob([fullMD], { type: "text/markdown" })
    const reportUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = reportUrl
    const fileName = `seo-audit-${auditUrl.replace(/https?:\/\//, "").replace(/[^a-z0-9]/gi, "-")}.md`
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Report exported as ${fileName}`)
  }

  const handleResetManual = () => {
    setManualStep(0)
    setAnalysisResult(null)
    setGeneratedPrompts([])
    setRankingsResult(null)
    toast.info("Manual tools reset")
  }

  // Cost calculation based on backend logic
  const getOrchestratorCost = () =>
    COSTS.WEBSITE_RANKING.ORCHESTRATOR_BASE +
    promptCount * COSTS.WEBSITE_RANKING.RANK_CHECKER_PER_PROMPT
  const getManualRankingsCost = () =>
    generatedPrompts.length * COSTS.WEBSITE_RANKING.RANK_CHECKER_PER_PROMPT

  // --- handlers for Orchestrator ---
  const handleOrchestrator = async () => {
    if (!url) return toast.error("Please enter a URL")
    try {
      await websiteRankingOrchestrator({ url, region, promptCount })
      toast.success("Full audit completed!")
    } catch (err) {
      console.error(err)
      toast.error(err?.toast || "Audit failed")
    }
  }

  // --- handlers for Manual Flow ---
  const handleAnalyse = async () => {
    if (!url) return toast.error("Please enter a URL")
    try {
      const res = await analyseWebsite({ url })
      setAnalysisResult(res)
      setSelectedExpertise(res.expertiseAreas || [])
      setManualStep(1)
      toast.success("Analysis complete!")
    } catch (err) {
      toast.error(err?.toast || "Analysis failed")
    }
  }

  const addManualTopic = () => {
    if (!manualTopic.trim()) return
    if (selectedExpertise.includes(manualTopic.trim())) {
      return toast.error("Topic already exists")
    }
    if (selectedExpertise.length >= 10) {
      return toast.warning("Maximum 10 topics allowed")
    }
    setSelectedExpertise(prev => [...prev, manualTopic.trim()])
    setManualTopic("")
  }

  const toggleExpertise = area => {
    setSelectedExpertise(prev => {
      if (prev.includes(area)) {
        return prev.filter(a => a !== area)
      }
      if (prev.length >= 10) {
        toast.warning("Maximum 10 topics allowed")
        return prev
      }
      return [...prev, area]
    })
  }

  const handleCreatePrompts = async () => {
    if (!selectedExpertise.length) return toast.error("Please select at least one topic")
    try {
      const res = await createWebsitePrompts({
        expertiseAreas: selectedExpertise,
        region,
        count: promptCount,
      })
      setGeneratedPrompts(res)
      setManualStep(2)
      toast.success("Keywords generated!")
    } catch (err) {
      toast.error(err?.toast || "Keyword generation failed")
    }
  }

  const handleKeywordEdit = (index, value) => {
    const updated = [...generatedPrompts]
    updated[index] = value
    setGeneratedPrompts(updated)
  }

  const handleCheckRankings = async () => {
    if (!url || !generatedPrompts.length) return toast.error("Missing URL or prompts")
    try {
      const res = await checkWebsiteRankings({ url, prompts: generatedPrompts, region })
      setRankingsResult(res)
      setManualStep(3)
      toast.success("Rankings checked!")
    } catch (err) {
      toast.error(err?.toast || "Ranking check failed")
    }
  }

  const handleAdvancedAnalysis = async () => {
    if (!analysisResult || !rankingsResult) return toast.error("Missing analysis data")
    try {
      await generateAdvancedAnalysis({ analysis: analysisResult, rankings: rankingsResult })
      toast.success("Report generated!")
    } catch (err) {
      toast.error(err?.toast || "Report generation failed")
    }
  }

  // --- Renders ---

  const FullReportView = ({ data }) => {
    if (!data) return null

    // Helper to safely access nested report data
    const { url, analysis, rankings, advancedReport, recommendations: topLevelRecs } = data
    const markdownContent =
      typeof advancedReport === "string" ? advancedReport : advancedReport?.markdownReport || ""

    const recommendations = topLevelRecs || advancedReport?.strategicRecommendations || []

    return (
      <div className="space-y-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-primary rounded-full" />
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Audit Report</h2>
              <p className="text-xs text-gray-400 font-medium">
                Generated by AI Engine
              </p>
            </div>
          </div>
          <button
            onClick={() => handleExportMD(data)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-[#3B4BB8] transition-all active:scale-95 shadow-lg shadow-primary/10"
          >
            <FileText className="w-4 h-4" />
            Export as MD
          </button>
        </div>
        {/* 1. High-Level Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-primary/5 border-primary/20 shadow-none col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-primary/90">Analysis Target</h3>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800 truncate" title={url}>
                  {url}
                </p>
                <div className="flex gap-2 mt-2">
                  <Tag color="blue" className="text-xs font-semibold m-0">
                    {analysis?.region || "USA"}
                  </Tag>
                  <Tag
                    color="cyan"
                    className="text-xs ui-monospace font-semibold m-0"
                  >
                    {analysis?.language || "English"}
                  </Tag>
                </div>
              </div>
              {rankings?.totalDomainsFound && (
                <div className="text-right">
                  <p className="text-xs text-primary/60 font-bold mb-1">Competitors Found</p>
                  <p className="text-xl font-bold text-primary">{rankings.totalDomainsFound}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-emerald-50/30 border-emerald-100 shadow-sm col-span-1 md:col-span-1">
            <div className="flex flex-col justify-between h-full">
              <div className="p-3 bg-white w-fit rounded-xl border border-emerald-100/50 shadow-sm mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-600">
                  Global Rank
                </span>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  {rankings?.ourCompanyStats?.globalRank
                    ? `#${rankings.ourCompanyStats.globalRank}`
                    : "0"}
                </p>
                <p className="text-[10px] text-emerald-700/60 font-bold mt-2">
                  Niche Competitiveness
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-white border-gray-100 shadow-sm col-span-1 md:col-span-1">
            <div className="flex flex-col justify-between h-full">
              <div className="p-3 bg-gray-50 w-fit rounded-xl border border-gray-100 shadow-sm mb-4">
                <ShieldCheck className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400">
                  Visibility Index
                </span>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  {rankings?.ourCompanyStats?.stats?.coverageRatio
                    ? `${Math.round(rankings.ourCompanyStats.stats.coverageRatio * 100)}%`
                    : "0%"}
                </p>
                <p className="text-[10px] text-gray-400 font-bold mt-2">Search Presence</p>
              </div>
            </div>
          </Card>

          <Card className="bg-white border-gray-100 shadow-sm col-span-1 md:col-span-1">
            <div className="flex flex-col justify-between h-full">
              <div className="p-3 bg-gray-50 w-fit rounded-xl border border-gray-100 shadow-sm mb-4">
                <Zap className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400">
                  Data Points
                </span>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  {rankings?.results?.length || 0}
                </p>
                <p className="text-[10px] text-gray-400 font-bold mt-2">Keywords Analyzed</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 2. Top Competitors Leaderboard */}
        {rankings?.top10?.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  Market Competitors
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Benchmarked against top 10 players
                </p>
              </div>
            </div>
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#FAFBFD] text-gray-400 font-semibold text-[11px]">
                    <tr>
                      <th className="px-8 py-5">Rank</th>
                      <th className="px-8 py-5">Domain Authority</th>
                      <th className="px-8 py-5 text-center">Market Share</th>
                      <th className="px-8 py-5 text-right pr-12">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rankings.top10.slice(0, 5).map((comp, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="px-8 py-5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-transform group-hover:scale-110 ${
                              idx === 0
                                ? "bg-gray-900 text-white shadow-xl shadow-black/10"
                                : "bg-gray-50 text-gray-400 border border-gray-100"
                            }`}
                          >
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="font-bold text-gray-900 text-base">{comp.domain}</span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-primary text-white shadow-lg shadow-primary/5">
                            {Math.round((comp.totalScore || 0) * 10)}%
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right pr-12">
                          <span className="text-xs font-semibold text-gray-400">
                            {comp.ranks?.length || 0} Key Rankings
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. Detailed Strategic Report & Recommendations */}
        {(markdownContent || recommendations.length > 0) && (
          <div className="grid grid-cols-1 gap-8">
            {markdownContent && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-none border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                      <FileText className="w-5 h-5 text-primary" />
                      Strategic Analysis & Roadmap
                    </h2>
                  </div>
                  <div className="p-8">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1
                            className="text-3xl font-black mt-10 mb-6 text-gray-900 tracking-tight"
                            {...props}
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2
                            className="text-2xl font-black mt-12 mb-6 text-gray-900 border-b border-gray-100 pb-3 tracking-tight"
                            {...props}
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3
                            className="text-xl font-black mt-8 mb-4 text-gray-800 tracking-tight"
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p
                            className="mb-6 leading-relaxed text-[15px] text-gray-600 font-medium"
                            {...props}
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            className="list-disc pl-6 mb-6 space-y-3 text-gray-600 font-medium"
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            className="list-decimal pl-6 mb-6 space-y-3 text-gray-600 font-medium"
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => <li className="pl-2" {...props} />,
                        strong: ({ node, ...props }) => (
                          <strong className="font-extrabold text-gray-900" {...props} />
                        ),
                        a: ({ node, ...props }) => (
                          <a
                            className="text-gray-900 underline underline-offset-4 decoration-2 decoration-black/10 hover:decoration-black transition-all font-bold"
                            {...props}
                          />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            className="border-l-[6px] border-gray-900 pl-6 italic my-10 text-gray-700 bg-gray-50/50 py-6 pr-6 rounded-r-2xl font-medium text-lg leading-relaxed shadow-sm"
                            {...props}
                          />
                        ),
                        code: ({ node, inline, ...props }) =>
                          inline ? (
                            <code
                              className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded-md text-[13px] font-black"
                              {...props}
                            />
                          ) : (
                            <pre className="bg-gray-950 text-white p-6 rounded-2xl overflow-x-auto mb-8 shadow-xl shadow-black/10">
                              <code
                                {...props}
                                className="font-medium text-[13px] leading-relaxed"
                              />
                            </pre>
                          ),
                      }}
                    >
                      {markdownContent}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {recommendations.length > 0 && (
                <div className="bg-white rounded-xl shadow-none border border-gray-200 overflow-hidden sticky top-4">
                  <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-900">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      Action Plan
                    </h2>
                  </div>
                  <div className="p-6 bg-emerald-50/5">
                    <ul className="space-y-4">
                      {recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <div className="mt-1 min-w-[20px]">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">
                              {i + 1}
                            </div>
                          </div>
                          <span className="text-sm  leading-relaxed font-medium">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-none border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold ">Analyzed Keywords</h3>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {rankings?.results?.map((r, i) => (
                    <Tag key={i} className="m-0 bg-gray-50 border-gray-200 text-gray-600">
                      {r.prompt}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Full Rankings Table */}
        <div className="bg-white rounded-xl shadow-none border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
              <List className="w-5 h-5 text-primary" />
              Detailed Search Audit Results
            </h2>
          </div>
          <div className="p-0">
            <StrategyResultsTable results={rankings?.results} />
          </div>
        </div>
      </div>
    )
  }

  const renderOrchestratorResult = () => {
    return <FullReportView data={orchestrator.result} />
  }

  const StrategyResultsTable = ({ results }) => {
    if (!results?.length)
      return <p className="p-8 text-center text-gray-400 font-bold">No ranking data available.</p>
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="text-[11px] bg-[#FAFBFD] text-gray-400 font-semibold border-b border-gray-50">
            <tr>
              <th className="px-8 py-5">Qualified Keyword</th>
              <th className="px-8 py-5">Organic Rank</th>
              <th className="px-8 py-5">Top Performers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {results.map((r, i) => (
              <tr key={i} className="bg-white hover:bg-gray-50/40 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-base">{r.prompt}</span>
                    <span className="text-xs text-gray-400 font-medium mt-1">
                      Niche Target
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  {r.rank && r.rank > 0 ? (
                    <span className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-primary/5">
                      #{r.rank}
                    </span>
                  ) : (
                    <span className="text-gray-400 font-semibold text-xs tracking-tight">
                      Unlisted
                    </span>
                  )}
                </td>
                <td className="px-8 py-5 text-right pr-12">
                  <div className="flex flex-wrap gap-2">
                    {r.topCompanies?.slice(0, 3).map((c, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-50 text-gray-600 text-xs px-3 py-1 rounded-lg border border-gray-100 font-semibold"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-9999 bg-white/80 backdrop-blur-md flex items-center justify-center p-6"
            >
              <div className="w-full max-w-2xl bg-white p-12 rounded-3xl shadow-2xl border border-gray-100 text-center">
                <ProgressLoadingScreen
                  message={getLoadingMessage()}
                  scenario={getLoadingScenario()}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-xl border border-gray-200 shadow-none p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0 border border-primary/10">
                <Globe className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AU Website Ranker</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Analyze performance, SEO health, and growth opportunities with AI.
                </p>
              </div>
            </div>
            <button
              onClick={handleResetManual}
              className="shrink-0 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
              title="Reset Analysis"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        <CustomTabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "1",
              label: (
                <span className="flex items-center gap-2">
                  <Rocket className="w-4 h-4" /> Quick Audit (Auto)
                </span>
              ),
              children: (
                <Card className="rounded-3xl shadow-sm border border-gray-100">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-3 space-y-4">
                        <label className="text-sm font-medium text-gray-500 ml-1">
                          Target Website URL
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gray-900 transition-colors">
                            <Globe size={18} />
                          </div>
                          <input
                            placeholder="https://yourwebsite.com"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-md outline-none focus:border-gray-900 focus:ring-4 focus:ring-black/2 transition-all placeholder-gray-400 font-medium text-gray-900"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-sm font-medium text-gray-500 ml-1">
                          Region
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gray-900 transition-colors">
                            <Zap size={18} />
                          </div>
                          <input
                            placeholder="USA, UK, IN..."
                            value={region}
                            onChange={e => setRegion(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-md outline-none focus:border-gray-900 focus:ring-4 focus:ring-black/2 transition-all placeholder-gray-400 font-medium text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="w-full md:w-80">
                        <NumberStepper
                          label="Target Keywords"
                          value={promptCount}
                          onChange={setPromptCount}
                          max={25}
                        />
                      </div>
                      <div className="flex items-center gap-4 px-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-xs">
                        <div className="p-2.5 bg-gray-50 rounded-xl">
                          <Zap size={20} className="text-gray-900" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-400">
                            Audit Investment
                          </span>
                          <span className="text-xl font-black text-gray-900">
                            {getOrchestratorCost()} Credits
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleOrchestrator}
                    disabled={isOrchestratorLoading}
                    className="w-full bg-primary hover:bg-[#3B4BB8] text-white px-8 py-5 rounded-md font-black text-lg transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-primary/10 mt-8"
                  >
                    {isOrchestratorLoading ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Rocket className="w-6 h-6" />
                    )}
                    Run Intelligence Audit
                  </button>

                  {!isOrchestratorLoading && orchestrator.result && renderOrchestratorResult()}
                </Card>
              ),
            },
            {
              key: "2",
              label: (
                <span className="flex items-center gap-2">
                  <List className="w-4 h-4" /> Manual Tools
                </span>
              ),
              children: (
                <Card className="rounded-xl shadow-none border-gray-200 p-0">
                  <div className="flex justify-between items-center mb-6 px-2">
                    <Steps
                      current={manualStep}
                      items={[
                        { title: "Identify Site", icon: <Search className="w-5 h-5" /> },
                        { title: "Keywords", icon: <Zap className="w-5 h-5" /> },
                        { title: "Check Rankings", icon: <BarChart2 className="w-5 h-5" /> },
                        { title: "View Strategy", icon: <FileText className="w-5 h-5" /> },
                      ]}
                    />
                  </div>

                  {manualStep === 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-slate-800">
                          Step 1: Analyze Website
                        </h3>
                        <div className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-md text-xs font-semibold">
                          Cost: {COSTS.WEBSITE_RANKING.ANALYSER} Credits
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <input
                          type="text"
                          placeholder="https://example.com"
                          value={url}
                          onChange={e => setUrl(e.target.value)}
                          className="flex-1 p-4 border border-gray-200 bg-gray-50 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-300 text-gray-800 placeholder-gray-400 font-medium"
                        />

                        <button
                          onClick={handleAnalyse}
                          disabled={!url || isAnalysing}
                          className={`btn h-[58px] min-h-0 px-8 rounded-md transition-all duration-200 font-black text-md ${
                            isAnalysing
                              ? "btn-disabled"
                              : "bg-primary hover:bg-[#3B4BB8] text-white"
                          }`}
                        >
                          {isAnalysing ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Analyse"}
                        </button>
                      </div>
                    </div>
                  )}

                  {manualStep === 1 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <Zap className="text-amber-500" /> Step 2: Extract Keywords
                        </h3>
                        <div className="px-3 py-1 bg-primary/5 text-primary border border-primary/20 rounded-md text-xs font-semibold">
                          Suggestion: {COSTS.WEBSITE_RANKING.PROMPT_CREATOR} Credits
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-none">
                          <p className="text-xs font-medium text-gray-400 mb-1">
                            Website Name
                          </p>
                          <p className="font-bold text-gray-800">{analysisResult?.name}</p>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-none">
                          <p className="text-xs font-medium text-gray-400 mb-1">
                            Region & Language
                          </p>
                          <div className="flex gap-2">
                            {analysisResult?.region && (
                              <Tag color="blue">{analysisResult.region}</Tag>
                            )}
                            {analysisResult?.language && (
                              <Tag color="cyan">{analysisResult.language}</Tag>
                            )}
                          </div>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-none">
                          <NumberStepper
                            label="Search Prompt Count"
                            value={promptCount}
                            onChange={setPromptCount}
                            max={25}
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-none">
                        <p className="text-xs font-medium text-gray-400 mb-1">
                          Site Description
                        </p>
                        <p className=" text-sm leading-relaxed text-gray-600">
                          {analysisResult?.description}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-xs font-medium text-gray-400">
                            Core Topics to Target ({selectedExpertise.length}/10)
                          </p>
                          <span className="text-[10px] text-primary font-bold">Minimum 1 required</span>
                        </div>

                        <div className="flex gap-2">
                          <input
                            value={manualTopic}
                            onChange={e => setManualTopic(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addManualTopic()}
                            placeholder="Add a custom topic..."
                            className="flex-1 p-2.5 border border-gray-200 bg-white rounded-md text-sm outline-none focus:border-primary transition-all"
                          />
                          <button
                            onClick={addManualTopic}
                            className="p-2.5 bg-primary text-white rounded-md hover:bg-[#3B4BB8] transition-all"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {selectedExpertise.map((area, idx) => (
                            <motion.button
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              key={`selected-${idx}`}
                              onClick={() => toggleExpertise(area)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white border border-primary flex items-center gap-2 hover:bg-[#3B4BB8] transition-all"
                            >
                              {area}
                              <Plus className="w-3 h-3 rotate-45" />
                            </motion.button>
                          ))}
                          {analysisResult?.expertiseAreas
                            ?.filter(area => !selectedExpertise.includes(area))
                            .map((area, idx) => (
                              <motion.button
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                key={`suggestion-${idx}`}
                                onClick={() => toggleExpertise(area)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 text-gray-400 border border-gray-200 hover:border-gray-300 hover:text-gray-600 transition-all"
                              >
                                {area}
                              </motion.button>
                            ))}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setManualStep(0)}
                          className="px-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md font-bold transition-all"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleCreatePrompts}
                          disabled={isCreatingPrompts}
                          className="flex-1 bg-primary hover:bg-[#3B4BB8] text-white py-4 rounded-md font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isCreatingPrompts && <RefreshCw className="w-5 h-5 animate-spin" />}
                          Suggest Keywords
                        </button>
                      </div>
                    </div>
                  )}

                  {manualStep === 2 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <BarChart2 className="text-indigo-600" /> Step 3: Check Search Rankings
                        </h3>
                        <div className="px-3 py-1 bg-primary/5 text-primary border border-primary/20 rounded-md text-xs font-semibold">
                          Cost: {getManualRankingsCost()} Credits
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl">
                        <p className="text-xs font-medium text-gray-400 mb-4">
                          Edit Your Search Prompts
                        </p>
                        <ul className="space-y-3">
                          {generatedPrompts.map((p, i) => (
                            <li
                              key={i}
                              className="bg-white p-3 rounded-md border border-gray-100 flex items-center gap-3 transition-all focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary"
                            >
                              <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center text-[10px] font-bold border border-gray-100">
                                {i + 1}
                              </div>
                              <input
                                value={p}
                                onChange={e => handleKeywordEdit(i, e.target.value)}
                                className="flex-1 bg-transparent border-0 outline-none text-sm font-bold text-gray-700"
                                placeholder="Enter keyword..."
                              />
                              <Edit2 className="w-4 h-4 text-gray-300" />
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setManualStep(1)}
                          className="px-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md font-bold transition-all"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleCheckRankings}
                          disabled={isCheckingRankings}
                          className="flex-1 bg-primary hover:bg-[#3B4BB8] text-white py-4 rounded-md font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isCheckingRankings && <RefreshCw className="w-5 h-5 animate-spin" />}
                          Check All Rankings
                        </button>
                      </div>
                    </div>
                  )}

                  {manualStep === 3 && (
                    <div className="space-y-6">
                      {!advancedComp.result && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 shadow-sm">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-lg font-semibold text-slate-800">
                                Final Step: Download Report
                              </h3>
                              <div className="px-3 py-1 bg-primary/5 text-primary border border-primary/20 rounded-md text-xs font-semibold">
                                Cost: {COSTS.WEBSITE_RANKING.ADVANCED_ANALYSIS} Credits
                              </div>
                            </div>
                            <p className="text-sm text-slate-400">
                              Generate a comprehensive strategic roadmap based on aggregated insights.
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setManualStep(2)}
                              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md text-sm font-bold transition-all"
                            >
                              Back
                            </button>
                            <button
                              onClick={handleAdvancedAnalysis}
                              disabled={isAnalyzingAdvanced}
                              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-bold transition-all ${
                                isAnalyzingAdvanced
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                  : "bg-primary text-white hover:bg-[#3B4BB8]"
                              }`}
                            >
                              {isAnalyzingAdvanced ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                              Generate Report
                            </button>
                          </div>
                        </div>
                      )}

                      {advancedComp.result ? (
                        <FullReportView
                          data={{
                            url,
                            analysis: analysisResult,
                            rankings: rankingsResult,
                            advancedReport: advancedComp.result,
                          }}
                        />
                      ) : (
                        rankingsResult && (
                          <FullReportView
                            data={{ url, analysis: analysisResult, rankings: rankingsResult }}
                          />
                        )
                      )}
                    </div>
                  )}
                </Card>
              ),
            },
          ]}
        />
        {(orchestrator.result || advancedComp.result) && (
          <div className="mt-8">
            <ConnectedTools currentToolId="ranking" transferValue={url} />
          </div>
        )}
      </div>
    </div>
  )
}

export default WebsiteRanking
