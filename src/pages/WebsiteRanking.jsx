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

  const renderOrchestratorResult = () => {
    const res = orchestrator.result
    if (!res) return null

    return (
      <div className="space-y-8 mt-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-2">Website</h3>
            <p className="text-gray-700 font-medium">{res.url}</p>
            <p className="text-sm text-gray-500">{res.analysis?.name}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <h3 className="font-bold text-green-800 mb-2">Global Rank</h3>
            <p className="text-2xl font-bold text-green-700">
              {res.rankings?.ourCompanyStats?.globalRank
                ? `#${res.rankings.ourCompanyStats.globalRank}`
                : "N/A"}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
            <h3 className="font-bold text-purple-800 mb-2">Keywords Checked</h3>
            <p className="text-2xl font-bold text-purple-700">
              {res.generatedPrompts?.length || 0}
            </p>
          </div>
        </div>

        {/* Detailed Marketing Report */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Strategic Analysis Report
            </h2>
          </div>
          <div className="p-6 prose prose-indigo max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {res.advancedReport?.markdownReport || res.advancedReport}
            </ReactMarkdown>
          </div>
        </div>

        {/* Rankings Table (Simplified) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Keyword Ranking Details
            </h2>
          </div>
          <div className="p-6">
            <StrategyResultsTable results={res.rankings?.results} />
          </div>
        </div>
      </div>
    )
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
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 4: Strategic Report</h3>
                  {rankingsResult && (
                    <Alert
                      message={`Found ${rankingsResult.totalDomainsFound} competitor domains`}
                      type="info"
                      showIcon
                    />
                  )}
                  <Button
                    type="primary"
                    onClick={handleAdvancedAnalysis}
                    loading={advancedComp.loading}
                    size="large"
                  >
                    Generate Final Strategy
                  </Button>
                </div>
              )}

              {/* Final Result Display for Manual Mode */}
              {advancedComp.result && (
                <div className="mt-8 p-6 border border-gray-200 rounded-xl bg-gray-50">
                  <ReactMarkdown className="prose">
                    {advancedComp.result.markdownReport}
                  </ReactMarkdown>
                </div>
              )}
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </div>
  )
}

export default WebsiteRanking
