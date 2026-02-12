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
import { Button, Input, Tabs, Card, Tag, message, Steps, Spin, Alert } from "antd"
import { useDispatch, useSelector } from "react-redux"
import {
  analyseWebsite,
  createWebsitePrompts,
  checkWebsiteRankings,
  generateAdvancedAnalysis,
  websiteRankingOrchestrator,
  resetWebsiteRanking,
} from "@store/slices/toolsSlice"
import ProgressLoadingScreen from "@components/UI/ProgressLoadingScreen"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const { TabPane } = Tabs

const WebsiteRanking = () => {
  const dispatch = useDispatch()
  const [url, setUrl] = useState("")
  const [region, setRegion] = useState("USA")
  const [promptCount, setPromptCount] = useState(5)

  // Individual tool states (for Manual Mode)
  const [manualStep, setManualStep] = useState(0)
  const [generatedPrompts, setGeneratedPrompts] = useState([])
  const [analysisResult, setAnalysisResult] = useState(null)
  const [rankingsResult, setRankingsResult] = useState(null)

  const { analyser, prompts, rankings, advancedComp, orchestrator } = useSelector(
    state => state.tools.websiteRanking
  )

  useEffect(() => {
    return () => {
      dispatch(resetWebsiteRanking())
    }
  }, [dispatch])

  // --- handlers for Orchestrator ---
  const handleOrchestrator = async () => {
    if (!url) return message.error("Please enter a URL")
    try {
      await dispatch(websiteRankingOrchestrator({ url, region, promptCount })).unwrap()
      message.success("Full audit completed!")
    } catch (err) {
      console.error(err)
      message.error(err?.message || "Audit failed")
    }
  }

  // --- handlers for Manual Flow ---
  const handleAnalyse = async () => {
    if (!url) return message.error("Please enter a URL")
    try {
      const res = await dispatch(analyseWebsite({ url })).unwrap()
      setAnalysisResult(res)
      setManualStep(1)
      message.success("Website analyzed!")
    } catch (err) {
      message.error(err?.message || "Analysis failed")
    }
  }

  const handleCreatePrompts = async () => {
    if (!analysisResult?.expertiseAreas) return message.error("No expertise areas found")
    try {
      const res = await dispatch(
        createWebsitePrompts({
          expertiseAreas: analysisResult.expertiseAreas,
          region,
          count: promptCount,
        })
      ).unwrap()
      setGeneratedPrompts(res)
      setManualStep(2)
      message.success("Prompts created!")
    } catch (err) {
      message.error(err?.message || "Prompt creation failed")
    }
  }

  const handleCheckRankings = async () => {
    if (!url || !generatedPrompts.length) return message.error("Missing URL or prompts")
    try {
      const res = await dispatch(
        checkWebsiteRankings({ url, prompts: generatedPrompts, region })
      ).unwrap()
      setRankingsResult(res)
      setManualStep(3)
      message.success("Rankings checked!")
    } catch (err) {
      message.error(err?.message || "Ranking check failed")
    }
  }

  const handleAdvancedAnalysis = async () => {
    if (!analysisResult || !rankingsResult) return message.error("Missing analysis data")
    try {
      await dispatch(
        generateAdvancedAnalysis({ analysis: analysisResult, rankings: rankingsResult })
      ).unwrap()
      message.success("Report generated!")
    } catch (err) {
      message.error(err?.message || "Report generation failed")
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
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
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
                  <div className="bg-gradient-to-r from-emerald-50 to-white px-6 py-4 border-b border-emerald-100">
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
              <tr key={i} className="bg-white border-b hover:bg-gray-50">
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="text-blue-600" /> Website Grading & SEO Strategy
          </h1>
          <p className="text-gray-500 mt-2">
            AI-powered analysis to check your website's health, rankings, and generate actionable
            growth strategies.
          </p>
        </div>

        <Tabs defaultActiveKey="1" type="card" className="custom-tabs">
          {/* ORCHESTRATOR TAB */}
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <Rocket className="w-4 h-4" /> Quick Audit (Auto)
              </span>
            }
            key="1"
          >
            <Card className="rounded-xl shadow-sm border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="font-semibold text-gray-700">Target Website URL</label>
                  <Input
                    placeholder="https://example.com"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    size="large"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-semibold text-gray-700">Region</label>
                    <Input value={region} onChange={e => setRegion(e.target.value)} size="large" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-semibold text-gray-700">Keywords to Check</label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={promptCount}
                      onChange={e => setPromptCount(Number(e.target.value))}
                      size="large"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                onClick={handleOrchestrator}
                loading={orchestrator.loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 border-none h-12 text-lg font-semibold"
                icon={<Rocket className="w-5 h-5" />}
              >
                Start Full Audit
              </Button>

              {orchestrator.loading && (
                <div className="mt-8">
                  <ProgressLoadingScreen message="Conducting comprehensive website audit..." />
                </div>
              )}

              {!orchestrator.loading && renderOrchestratorResult()}
            </Card>
          </TabPane>

          {/* MANUAL TOOLS TAB */}
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <List className="w-4 h-4" /> Manual Tools
              </span>
            }
            key="2"
          >
            <Card className="rounded-xl shadow-sm border-gray-200">
              <Steps current={manualStep} className="mb-8">
                <Steps.Step title="Analyse" icon={<Search />} />
                <Steps.Step title="Keywords" icon={<Zap />} />
                <Steps.Step title="Rankings" icon={<BarChart2 />} />
                <Steps.Step title="Report" icon={<FileText />} />
              </Steps>

              {/* Step 0: Analyse */}
              {manualStep === 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 1: Website Reconnaissance</h3>
                  <Input
                    placeholder="Enter Website URL"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    size="large"
                  />
                  <Button
                    type="primary"
                    onClick={handleAnalyse}
                    loading={analyser.loading}
                    size="large"
                  >
                    Analyse Structure
                  </Button>
                </div>
              )}

              {/* Step 1: Prompts */}
              {manualStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 2: Generate Keywords</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Website Name</p>
                        <p className="font-semibold">{analysisResult?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Region & Language</p>
                        <Tag color="blue">{analysisResult?.region}</Tag>
                        <Tag color="cyan">{analysisResult?.language}</Tag>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="text-gray-700">{analysisResult?.description}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Identified Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult?.expertiseAreas?.map((area, idx) => (
                          <Tag key={idx} color="purple">
                            {area}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    onClick={handleCreatePrompts}
                    loading={prompts.loading}
                    size="large"
                  >
                    Generate Search Prompts
                  </Button>
                </div>
              )}

              {/* Step 2: Rankings */}
              {manualStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 3: Check Rankings</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>
                      <strong>Generated Prompts:</strong>
                    </p>
                    <ul className="list-disc pl-5 mt-2">
                      {generatedPrompts.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    type="primary"
                    onClick={handleCheckRankings}
                    loading={rankings.loading}
                    size="large"
                  >
                    Check Search Rankings
                  </Button>
                </div>
              )}

              {/* Step 3: Advanced Analysis */}
              {manualStep === 3 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        Step 3 Review: Rankings Data
                      </h3>
                      <p className="text-sm text-gray-500">
                        Review collected SEO data before generating the final strategy report.
                      </p>
                    </div>
                    <Button
                      type="primary"
                      onClick={handleAdvancedAnalysis}
                      loading={advancedComp.loading}
                      size="large"
                      icon={<FileText className="w-4 h-4" />}
                    >
                      Generate Final Strategy
                    </Button>
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
          </TabPane>
        </Tabs>
      </div>
    </div>
  )
}

export default WebsiteRanking
