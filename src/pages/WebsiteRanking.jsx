import React, { useState, useEffect } from "react"
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
} from "lucide-react"
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

/* --- Custom UI Components replacing antd --- */

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}
  >
    <div className="p-6">{children}</div>
  </div>
)

const Tag = ({ children, color, className = "" }) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  }
  const colorClass = colorMap[color] || "bg-gray-50 text-gray-600 border-gray-100"
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border ${colorClass} ${className}`}
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
                  ? "border-blue-600 bg-blue-600 text-white"
                  : isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-gray-200 bg-white text-gray-400"
              }`}
            >
              {isCompleted ? <CheckCircle className="w-5 h-5" /> : item.icon}
            </div>
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-blue-600" : isCompleted ? "text-emerald-600" : "text-gray-400"}`}
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
      <div className="flex gap-2 p-1 bg-gray-100/50 rounded-xl w-fit border border-gray-200">
        {items.map(item => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeKey === item.key
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
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

const WebsiteRanking = () => {
  const [url, setUrl] = useState("")
  const [region, setRegion] = useState("USA")
  const [promptCount, setPromptCount] = useState(5)

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

  useEffect(() => {
    return () => {
      resetWebsiteRanking()
    }
  }, [resetWebsiteRanking])

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
      setManualStep(1)
      toast.success("Website analyzed!")
    } catch (err) {
      toast.error(err?.toast || "Analysis failed")
    }
  }

  const handleCreatePrompts = async () => {
    if (!analysisResult?.expertiseAreas) return toast.error("No expertise areas found")
    try {
      const res = await createWebsitePrompts({
        expertiseAreas: analysisResult.expertiseAreas,
        region,
        count: promptCount,
      })
      setGeneratedPrompts(res)
      setManualStep(2)
      toast.success("Prompts created!")
    } catch (err) {
      toast.error(err?.toast || "Prompt creation failed")
    }
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
    // In Orchestrator: data = { url, analysis, rankings, advancedReport: { markdownReport, recommendations } }
    // In Manual: constructed similarly below
    const { url, analysis, rankings, advancedReport } = data
    const markdownContent = advancedReport?.markdownReport || advancedReport || ""
    const recommendations = advancedReport?.recommendations || []

    return (
      <div className="space-y-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* 1. High-Level Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-blue-50 border-blue-100 shadow-sm col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-900">Analysis Target</h3>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800 truncate" title={url}>
                  {url}
                </p>
                <div className="flex gap-2 mt-2">
                  <Tag color="blue" className="text-[10px] uppercase font-bold tracking-wider m-0">
                    {analysis?.region || "USA"}
                  </Tag>
                  <Tag
                    color="cyan"
                    className="text-[10px] ui-monospace font-bold tracking-wider m-0"
                  >
                    {analysis?.language || "English"}
                  </Tag>
                </div>
              </div>
              {rankings?.totalDomainsFound && (
                <div className="text-right">
                  <p className="text-xs text-blue-600 font-semibold mb-1">Competitors Found</p>
                  <p className="text-xl font-bold text-blue-700">{rankings.totalDomainsFound}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-emerald-900">Global Rank</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              {rankings?.ourCompanyStats?.globalRank
                ? `#${rankings.ourCompanyStats.globalRank}`
                : "0"}
            </p>
            <p className="text-xs text-emerald-700 mt-1">Among competitors</p>
          </Card>

          <Card className="bg-purple-50 border-purple-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-purple-900">Visibility Score</h3>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-purple-600">
                {rankings?.ourCompanyStats?.stats?.coverageRatio
                  ? `${Math.round(rankings.ourCompanyStats.stats.coverageRatio * 100)}%`
                  : "0%"}
              </p>
            </div>
            <p className="text-xs text-purple-700 mt-1">Keyword Coverage</p>
          </Card>

          <Card className="bg-amber-50 border-amber-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-amber-900">Keywords</h3>
            </div>
            <p className="text-3xl font-bold text-amber-600">{rankings?.results?.length || 0}</p>
            <p className="text-xs text-amber-700 mt-1">Analyzed</p>
          </Card>
        </div>

        {/* 2. Top Competitors Leaderboard */}
        {rankings?.top10?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-linear-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <Rocket className="w-5 h-5 text-orange-500" />
                Top Competitors Leaderboard
              </h2>
              <Tag color="orange">Top 10</Tag>
            </div>
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Rank</th>
                      <th className="px-6 py-3">Domain</th>
                      <th className="px-6 py-3 text-center">Visibility Score</th>
                      <th className="px-6 py-3 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rankings.top10.slice(0, 5).map((comp, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                              idx === 0
                                ? "bg-yellow-400"
                                : idx === 1
                                  ? "bg-gray-400"
                                  : idx === 2
                                    ? "bg-orange-400"
                                    : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-700">{comp.domain}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {Math.round((comp.totalScore || 0) * 10)}/100
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-400 text-xs">
                          Ranked on {comp.ranks?.length || 0} keywords
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
            {/* Main Report Column */}
            {markdownContent && (
              <div className="space-y-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-900">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      Strategic Analysis & Roadmap
                    </h2>
                  </div>
                  <div className="p-8">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1 className="text-2xl font-bold mt-6 mb-4 text-indigo-900" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2
                            className="text-xl font-bold mt-8 mb-4 text-indigo-800 border-b border-indigo-100 pb-2"
                            {...props}
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-lg font-bold mt-6 mb-3 text-indigo-700" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p
                            className="mb-4 text-gray-700 leading-relaxed text-[15px]"
                            {...props}
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            className="list-decimal pl-5 mb-4 text-gray-700 space-y-2"
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                        strong: ({ node, ...props }) => (
                          <strong className="font-bold text-indigo-900" {...props} />
                        ),
                        a: ({ node, ...props }) => (
                          <a className="text-blue-600 hover:underline font-medium" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            className="border-l-4 border-indigo-200 pl-4 italic my-6 text-gray-600 bg-gray-50 py-2 pr-2 rounded-r"
                            {...props}
                          />
                        ),
                        code: ({ node, inline, ...props }) =>
                          inline ? (
                            <code
                              className="bg-gray-100 text-pink-600 px-1 py-0.5 rounded text-sm font-mono"
                              {...props}
                            />
                          ) : (
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                              <code {...props} />
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

            {/* Sidebar: Recommendations & Stats */}
            <div className="space-y-6">
              {/* Quick Actions / Recommendations List */}
              {recommendations.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-4">
                  <div className="bg-linear-to-r from-emerald-50 to-white px-6 py-4 border-b border-emerald-100">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-900">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      Action Plan
                    </h2>
                  </div>
                  <div className="p-6 bg-emerald-50/10">
                    <ul className="space-y-4">
                      {recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <div className="mt-1 min-w-[20px]">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">
                              {i + 1}
                            </div>
                          </div>
                          <span className="text-sm text-gray-700 leading-relaxed font-medium">
                            {rec}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Target Keywords Summary */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-700">Analyzed Keywords</h3>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <List className="w-5 h-5 text-blue-600" />
              Detailed Keyword Rankings
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
    // Orchestrator result usually contains the full needed structure
    return <FullReportView data={orchestrator.result} />
  }

  const StrategyResultsTable = ({ results }) => {
    if (!results?.length) return <p>No ranking data available.</p>
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Keyword Idea</th>
              <th className="px-6 py-3">Your Rank</th>
              <th className="px-6 py-3">Top Competitors</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="bg-white border-b border-gray-300 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{r.prompt}</td>
                <td className="px-6 py-4">
                  {r.rank && r.rank > 0 ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-bold">
                      #{r.rank}
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">Not listed</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {r.topCompanies?.slice(0, 3).map((c, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded border border-blue-100"
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
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="text-blue-600" /> Website Grading & SEO Strategy
          </h1>
          <p className="text-gray-500 mt-2">
            AI-powered analysis to check your website's health, rankings, and generate actionable
            growth strategies.
          </p>
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
                <Card className="rounded-xl shadow-sm border-gray-200 p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Target Website URL
                      </label>
                      <input
                        placeholder="https://example.com"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        className="w-full mt-2 p-3 border border-gray-200 rounded-lg outline-none placeholder-gray-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Region</label>
                        <input
                          value={region}
                          onChange={e => setRegion(e.target.value)}
                          className="w-full mt-2 p-3 border border-gray-200 rounded-lg outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Keywords to Check
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={promptCount}
                          onChange={e => setPromptCount(Number(e.target.value))}
                          className="w-full mt-2 p-3 border border-gray-200 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleOrchestrator}
                    disabled={isOrchestratorLoading}
                    className="w-full rounded-lg text-white flex items-center justify-center bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed p-3"
                  >
                    {isOrchestratorLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Rocket className="w-5 h-5" />
                    )}
                    Start Full Audit
                  </button>

                  {isOrchestratorLoading && (
                    <div className="mt-8">
                      <ProgressLoadingScreen toast="Conducting comprehensive website audit..." />
                    </div>
                  )}

                  {!isOrchestratorLoading && renderOrchestratorResult()}
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
                <Card className="rounded-xl shadow-sm border-gray-200 p-0">
                  <Steps
                    current={manualStep}
                    items={[
                      { title: "Analyse", icon: <Search className="w-5 h-5" /> },
                      { title: "Keywords", icon: <Zap className="w-5 h-5" /> },
                      { title: "Rankings", icon: <BarChart2 className="w-5 h-5" /> },
                      { title: "Report", icon: <FileText className="w-5 h-5" /> },
                    ]}
                  />

                  {/* Step 0: Analyse */}
                  {manualStep === 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        Step 1: Website Reconnaissance
                      </h3>

                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="https://example.com"
                          value={url}
                          onChange={e => setUrl(e.target.value)}
                          className="input w-full focus:outline-none rounded-lg border border-gray-300"
                        />

                        <button
                          onClick={handleAnalyse}
                          disabled={!url || isAnalysing}
                          className={`btn px-6 rounded-lg shadow-sm transition-all duration-200 ${
                            isAnalysing
                              ? "btn-disabled"
                              : "bg-linear-to-r from-indigo-600 to-violet-600 text-white hover:scale-105"
                          }`}
                        >
                          {isAnalysing ? (
                            <span className="loading loading-spinner loading-sm"></span>
                          ) : (
                            "Analyse"
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 1: Prompts */}
                  {manualStep === 1 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Zap className="text-amber-500" /> Step 2: Generate Keywords
                      </h3>
                      <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-xs">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">
                              Website Name
                            </p>
                            <p className="font-bold text-gray-800">{analysisResult?.name}</p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-xs">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">
                              Region & Language
                            </p>
                            <div className="flex gap-2">
                              <Tag color="blue">{analysisResult?.region}</Tag>
                              <Tag color="cyan">{analysisResult?.language}</Tag>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-xs">
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">
                            Description
                          </p>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {analysisResult?.description}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 px-1">
                            Identified Expertise
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult?.expertiseAreas?.map((area, idx) => (
                              <Tag key={idx} color="purple">
                                {area}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleCreatePrompts}
                        disabled={isCreatingPrompts}
                        className="w-full bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white py-4 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isCreatingPrompts && <RefreshCw className="w-5 h-5 animate-spin" />}
                        Generate Search Prompts
                      </button>
                    </div>
                  )}

                  {/* Step 2: Rankings */}
                  {manualStep === 2 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <BarChart2 className="text-indigo-600" /> Step 3: Check Rankings
                      </h3>
                      <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">
                          Generated Keywords
                        </p>
                        <ul className="space-y-2">
                          {generatedPrompts.map((p, i) => (
                            <li
                              key={i}
                              className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 font-bold text-gray-700 text-sm"
                            >
                              <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px]">
                                {i + 1}
                              </div>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        onClick={handleCheckRankings}
                        disabled={isCheckingRankings}
                        className="w-full bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white py-4 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isCheckingRankings && <RefreshCw className="w-5 h-5 animate-spin" />}
                        Check Search Rankings
                      </button>
                    </div>
                  )}

                  {/* Step 3: Advanced Analysis */}
                  {manualStep === 3 && (
                    <div className="space-y-6">
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 shadow-sm">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">
                            Final Step: Growth Strategy
                          </h3>
                          <p className="text-sm text-slate-400 mt-1">
                            Generate a comprehensive strategic roadmap based on aggregated insights.
                          </p>
                        </div>

                        <button
                          onClick={handleAdvancedAnalysis}
                          disabled={isAnalyzingAdvanced}
                          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-semibold  ${
                            isAnalyzingAdvanced
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-[#1B6FC9] text-white hover:bg-[#1B6FC9]/90"
                          }`}
                        >
                          {isAnalyzingAdvanced ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          Build Strategy
                        </button>
                      </div>

                      {rankingsResult && (
                        <FullReportView
                          data={{ url, analysis: analysisResult, rankings: rankingsResult }}
                        />
                      )}
                    </div>
                  )}

                  {/* Final Result Display for Manual Mode */}
                  {manualStep === 3 && advancedComp.result && (
                    <FullReportView
                      data={{
                        url,
                        analysis: analysisResult,
                        rankings: rankingsResult,
                        advancedReport: advancedComp.result,
                      }}
                    />
                  )}
                </Card>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}

export default WebsiteRanking
