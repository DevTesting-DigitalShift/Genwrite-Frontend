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
  MousePointer2,
  Eye,
  BarChart3,
  AlertCircle,
} from "lucide-react"
import toast from "@utils/toast"
import useToolsStore from "@store/useToolsStore"
import {
  useWebsiteAnalysisMutation,
  useWebsitePromptsMutation,
  useWebsiteRankingsCheckMutation,
  useWebsiteAdvancedAnalysisMutation,
  useWebsiteOrchestratorMutation,
} from "@api/queries/toolsQueries"
import ProgressLoadingScreen from "@components/UI/ProgressLoadingScreen"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const WebsiteRanking = () => {
  const [url, setUrl] = useState("")
  const [region, setRegion] = useState("USA")
  const [promptCount, setPromptCount] = useState(5)
  const [activeView, setActiveView] = useState("auto") // "auto" or "manual"

  // Individual tool states (for Manual Mode)
  const [manualStep, setManualStep] = useState(0)
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
      toast.error(err?.message || "Audit failed")
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
      toast.error(err?.message || "Analysis failed")
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
      toast.error(err?.message || "Prompt creation failed")
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
      toast.error(err?.message || "Ranking check failed")
    }
  }

  const handleAdvancedAnalysis = async () => {
    if (!analysisResult || !rankingsResult) return toast.error("Missing analysis data")
    try {
      await generateAdvancedAnalysis({ analysis: analysisResult, rankings: rankingsResult })
      toast.success("Report generated!")
    } catch (err) {
      toast.error(err?.message || "Report generation failed")
    }
  }

  // --- Renders ---

  const StrategyResultsTable = ({ results }) => {
    if (!results?.length)
      return <p className="p-8 text-center text-gray-500 italic">No ranking data available.</p>
    return (
      <div className="overflow-x-auto">
        <table className="table w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold py-4">
                Keyword Idea
              </th>
              <th className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold py-4">
                Your Rank
              </th>
              <th className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold py-4">
                Top Competitors
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="hover:bg-blue-50/30 transition-colors border-b border-gray-50">
                <td className="py-4 font-bold text-gray-900">{r.prompt}</td>
                <td className="py-4">
                  {r.rank && r.rank > 0 ? (
                    <span className="badge badge-success badge-md font-bold text-white px-3">
                      #{r.rank}
                    </span>
                  ) : (
                    <span className="badge badge-ghost badge-md font-medium text-gray-400">
                      Not listed
                    </span>
                  )}
                </td>
                <td className="py-4">
                  <div className="flex flex-wrap gap-1">
                    {r.topCompanies?.slice(0, 3).map((c, idx) => (
                      <span
                        key={idx}
                        className="badge badge-outline border-blue-100 text-blue-600 text-[10px] font-bold uppercase"
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

  const FullReportView = ({ data }) => {
    if (!data) return null
    const { url, analysis, rankings, advancedReport } = data
    const markdownContent = advancedReport?.markdownReport || advancedReport || ""
    const recommendations = advancedReport?.recommendations || []

    return (
      <div className="space-y-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-100 shadow-xs rounded-2xl p-5 col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-blue-900 tracking-tight">Analysis Target</h3>
            </div>
            <div className="flex justify-between items-start">
              <div className="max-w-[70%]">
                <p className="font-bold text-gray-800 truncate text-lg" title={url}>
                  {url}
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="badge badge-info badge-sm font-bold text-[10px] uppercase">
                    {analysis?.region || "USA"}
                  </span>
                  <span className="badge badge-ghost badge-sm font-bold text-[10px] uppercase bg-gray-200">
                    {analysis?.language || "English"}
                  </span>
                </div>
              </div>
              {rankings?.totalDomainsFound && (
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-blue-500 mb-1">Competitors</p>
                  <p className="text-2xl font-black text-blue-700">{rankings.totalDomainsFound}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 shadow-xs rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-emerald-900 tracking-tight">Global Rank</h3>
            </div>
            <p className="text-3xl font-black text-emerald-600">
              {rankings?.ourCompanyStats?.globalRank
                ? `#${rankings.ourCompanyStats.globalRank}`
                : "N/A"}
            </p>
            <p className="text-xs font-medium text-emerald-700 mt-2 italic flex items-center gap-1">
              <Rocket className="size-3" /> Among rivals
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-100 shadow-xs rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-bold text-purple-900 tracking-tight">Visibility</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-black text-purple-600">
                {rankings?.ourCompanyStats?.stats?.coverageRatio
                  ? `${Math.round(rankings.ourCompanyStats.stats.coverageRatio * 100)}`
                  : "0"}
              </p>
              <span className="text-xl font-bold text-purple-400">%</span>
            </div>
            <p className="text-xs font-medium text-purple-700 mt-2">Keyword Coverage</p>
          </div>

          <div className="bg-amber-50 border border-amber-100 shadow-xs rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-amber-900 tracking-tight">Keywords</h3>
            </div>
            <p className="text-3xl font-black text-amber-600">{rankings?.results?.length || 0}</p>
            <p className="text-xs font-medium text-amber-700 mt-2">Strategic analysis</p>
          </div>
        </div>

        {rankings?.top10?.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black flex items-center gap-3 text-gray-900">
                <Rocket className="w-6 h-6 text-orange-500" /> Competitors Leaderboard
              </h2>
              <span className="badge badge-warning badge-md font-bold py-3 px-4">
                TOP 10 ANALYSIS
              </span>
            </div>
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Domain</th>
                      <th className="px-6 py-4 text-center">Visibility Score</th>
                      <th className="px-6 py-4 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rankings.top10.slice(0, 5).map((comp, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white shadow-sm ${idx === 0 ? "bg-yellow-400" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-orange-400" : "bg-blue-100 text-blue-600"}`}
                          >
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-700">{comp.domain}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-green-100 text-green-700">
                            {Math.round((comp.totalScore || 0) * 10)} / 100
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-400 text-[10px] font-bold">
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

        {(markdownContent || recommendations.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {markdownContent && (
                <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
                    <h2 className="text-xl font-black flex items-center gap-3 text-indigo-900">
                      <FileText className="w-6 h-6 text-indigo-600" /> Strategic Roadmap
                    </h2>
                  </div>
                  <div className="p-8 prose prose-slate max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {recommendations.length > 0 && (
                <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden sticky top-4">
                  <div className="bg-linear-to-r from-emerald-50 to-white px-8 py-6 border-b border-emerald-100">
                    <h2 className="text-xl font-black flex items-center gap-3 text-emerald-900">
                      <CheckCircle className="w-6 h-6 text-emerald-600" /> Action Plan
                    </h2>
                  </div>
                  <div className="p-8 bg-emerald-50/5">
                    <ul className="space-y-6">
                      {recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-4 items-start">
                          <div className="mt-1 shrink-0">
                            <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 text-xs font-black">
                              {i + 1}
                            </div>
                          </div>
                          <span className="text-[15px] text-gray-700 leading-relaxed font-bold">
                            {rec}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
            <h2 className="text-xl font-black flex items-center gap-3">
              <List className="w-6 h-6 text-blue-600" /> Keyword Rankings
            </h2>
          </div>
          <StrategyResultsTable results={rankings?.results} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
            <Globe className="size-10 text-blue-600" /> Website{" "}
            <span className="text-blue-600">Grading</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium text-lg">
            AI-powered SEO analysis and growth strategy
          </p>
        </div>

        <div className="tabs tabs-boxed bg-white p-1 gap-1 w-fit shadow-xs border border-gray-100">
          <button
            className={`tab tab-lg px-8 rounded-xl font-bold transition-transform duration-200 ${activeView === "auto" ? "tab-active bg-blue-600! text-white!" : "text-gray-400 hover:text-gray-600"}`}
            onClick={() => setActiveView("auto")}
          >
            <Rocket className="size-4 mr-2" /> Quick Audit
          </button>
          <button
            className={`tab tab-lg px-8 rounded-xl font-bold transition-transform duration-200 ${activeView === "manual" ? "tab-active bg-blue-600! text-white!" : "text-gray-400 hover:text-gray-600"}`}
            onClick={() => setActiveView("manual")}
          >
            <List className="size-4 mr-2" /> Manual Tools
          </button>
        </div>

        {activeView === "auto" ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold text-gray-600 uppercase text-xs tracking-widest ml-1">
                    Target Website URL
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="input input-bordered h-16 rounded-2xl focus:input-primary border-gray-200 text-lg font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold text-gray-600 uppercase text-xs tracking-widest ml-1">
                      Region
                    </span>
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    className="input input-bordered h-16 rounded-2xl focus:input-primary border-gray-200 font-bold"
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold text-gray-600 uppercase text-xs tracking-widest ml-1">
                      Keywords Count
                    </span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={promptCount}
                    onChange={e => setPromptCount(Number(e.target.value))}
                    className="input input-bordered h-16 rounded-2xl focus:input-primary border-gray-200 font-bold"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleOrchestrator}
              disabled={isOrchestratorLoading}
              className="btn btn-primary w-full h-16 rounded-2xl text-xl font-black bg-linear-to-r from-blue-600 to-indigo-600 border-none text-white shadow-xl shadow-blue-200 hover:scale-[1.01] transition-all normal-case"
            >
              {isOrchestratorLoading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                <Rocket className="size-6 mr-2" />
              )}
              Start Comprehensive SEO Audit
            </button>

            {isOrchestratorLoading && (
              <div className="mt-8">
                <ProgressLoadingScreen message="Conducting comprehensive website audit..." />
              </div>
            )}

            {!isOrchestratorLoading && orchestrator.result && (
              <FullReportView data={orchestrator.result} />
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 animate-in fade-in duration-500">
            {/* Steps Progress */}
            <ul className="steps w-full mb-12">
              <li
                className={`steps step-primary font-bold ${manualStep >= 0 ? "step-primary" : ""}`}
                data-content="🔍"
              >
                Analyse
              </li>
              <li
                className={`steps font-bold ${manualStep >= 1 ? "step-primary" : ""}`}
                data-content="⚡"
              >
                Keywords
              </li>
              <li
                className={`steps font-bold ${manualStep >= 2 ? "step-primary" : ""}`}
                data-content="📊"
              >
                Rankings
              </li>
              <li
                className={`steps font-bold ${manualStep >= 3 ? "step-primary" : ""}`}
                data-content="📄"
              >
                Report
              </li>
            </ul>

            {manualStep === 0 && (
              <div className="space-y-6 max-w-2xl mx-auto text-center">
                <div className="bg-blue-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Search className="size-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900">
                  Step 1: Website Structure Analysis
                </h3>
                <p className="text-gray-500 font-medium">
                  Identify key expertise areas and SEO potential of your target site.
                </p>
                <div className="form-control">
                  <input
                    placeholder="Enter Website URL"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="input input-bordered h-16 rounded-2xl text-center text-lg font-bold focus:input-primary"
                  />
                </div>
                <button
                  onClick={handleAnalyse}
                  disabled={isAnalysing}
                  className="btn btn-primary btn-lg w-full rounded-2xl font-black shadow-lg"
                >
                  {isAnalysing && <span className="loading loading-spinner"></span>}
                  Analyse Structure
                </button>
              </div>
            )}

            {manualStep === 1 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  <Zap className="text-amber-500" /> Step 2: Strategic Keyword Discovery
                </h3>
                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-bold text-gray-700">
                    <div className="p-4 bg-white rounded-2xl shadow-xs border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-400 mb-1">Company Name</p>
                      <p className="text-lg">{analysisResult?.name}</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl shadow-xs border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-400 mb-1">Market Region</p>
                      <div className="flex gap-2">
                        <span className="badge badge-primary">{analysisResult?.region}</span>
                        <span className="badge badge-secondary">{analysisResult?.language}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-2xl shadow-xs border border-gray-100 font-bold">
                    <p className="text-[10px] uppercase text-gray-400 mb-1 tracking-widest">
                      Business Description
                    </p>
                    <p className="text-gray-700 leading-relaxed italic text-sm">
                      {analysisResult?.description}
                    </p>
                  </div>
                  <div className="font-bold">
                    <p className="text-[10px] uppercase text-gray-400 mb-3 tracking-widest ml-1">
                      Expertise Clusters
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult?.expertiseAreas?.map((area, idx) => (
                        <span
                          key={idx}
                          className="badge badge-lg py-4 px-5 font-bold bg-purple-100 text-purple-700 border-none"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCreatePrompts}
                  disabled={isCreatingPrompts}
                  className="btn btn-primary btn-lg w-full rounded-2xl font-black shadow-lg"
                >
                  {isCreatingPrompts && <span className="loading loading-spinner"></span>}
                  Generate Search Keywords
                </button>
              </div>
            )}

            {manualStep === 2 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  <BarChart2 className="text-purple-600" /> Step 3: Global Ranking Verification
                </h3>
                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                  <p className="text-[10px] uppercase text-gray-400 mb-4 font-black tracking-widest">
                    Selected Keywords for Analysis
                  </p>
                  <ul className="space-y-3">
                    {generatedPrompts.map((p, i) => (
                      <li
                        key={i}
                        className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3 font-bold text-gray-700"
                      >
                        <div className="size-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px]">
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
                  className="btn btn-primary btn-lg w-full rounded-2xl font-black shadow-lg"
                >
                  {isCheckingRankings && <span className="loading loading-spinner"></span>}
                  Execute Ranking Audit
                </button>
              </div>
            )}

            {manualStep === 3 && (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-linear-to-r from-blue-900 to-indigo-900 p-8 rounded-3xl shadow-xl text-white">
                  <div>
                    <h3 className="text-2xl font-black mb-1">Step 4: Strategic Intelligence</h3>
                    <p className="text-blue-100 font-medium">
                      Synthesize collected performance data into an actionable roadmap.
                    </p>
                  </div>
                  <button
                    onClick={handleAdvancedAnalysis}
                    disabled={isAnalyzingAdvanced}
                    className="btn btn-white btn-lg rounded-2xl font-black px-10 h-auto py-4 normal-case text-blue-900 border-none hover:bg-white/90"
                  >
                    {isAnalyzingAdvanced && <span className="loading loading-spinner"></span>}
                    <FileText className="size-5 mr-1" /> Build Strategy
                  </button>
                </div>

                {rankingsResult && (
                  <FullReportView
                    data={{ url, analysis: analysisResult, rankings: rankingsResult }}
                  />
                )}

                {advancedComp.result && (
                  <FullReportView
                    data={{
                      url,
                      analysis: analysisResult,
                      rankings: rankingsResult,
                      advancedReport: advancedComp.result,
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default WebsiteRanking
