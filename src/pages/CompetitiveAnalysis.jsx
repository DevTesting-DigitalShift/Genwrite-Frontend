import { useState, useEffect, useMemo } from "react"
import {
  Activity,
  ExternalLink,
  LoaderCircle,
  Link as LinkIcon,
  Search,
  Info,
  Check,
  Globe,
  RefreshCw,
} from "lucide-react"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { runCompetitiveAnalysis } from "@api/analysisApi"
import { getBlogById } from "@api/blogApi"
import useAuthStore from "@store/useAuthStore"
import useAnalysisStore from "@store/useAnalysisStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import LoadingScreen from "@components/ui/LoadingScreen"
import { useAllBlogsQuery } from "@api/queries/blogQueries"
import { toast } from "sonner"
import { Helmet } from "react-helmet"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const CompetitiveAnalysis = () => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    keywords: [],
    focusKeywords: [],
    contentType: "markdown",
    selectedProject: null,
    generatedMetadata: null,
  })
  const [analysisResults, setAnalysisResults] = useState(null)
  const [id, setId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("results")

  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { handlePopup } = useConfirmPopup()

  const {
    analysisResult,
    loading: analysisLoading,
    setAnalysisResult,
    setLoading: setAnalysisLoading,
  } = useAnalysisStore()

  const analysis = analysisResult?.[formData?.selectedProject?._id]

  useEffect(() => {
    if (!analysisLoading && analysis) {
      setAnalysisResults(analysis)
    }
  }, [analysis, analysisLoading])

  const { data: allBlogsData } = useAllBlogsQuery()
  const blogs = Array.isArray(allBlogsData) ? allBlogsData : allBlogsData?.blogs || []

  useEffect(() => {
    if (id) {
      setIsLoading(true)
      getBlogById(id)
        .then(response => {
          if (response?._id) {
            setFormData(prev => ({
              ...prev,
              title: response.title,
              content: response.content || "",
              keywords: response.keywords || [],
              focusKeywords: response.focusKeywords || [],
              selectedProject: response,
              contentType: "markdown",
              generatedMetadata: response.generatedMetadata || null,
            }))
          }
        })
        .catch(error => {
          console.error("Failed to fetch blog by ID:", error)
          toast.error("Failed to fetch blog details")
        })
        .finally(() => setIsLoading(false))
    }
  }, [id])

  useEffect(() => {
    const hasCompetitors = mergedCompetitors.length > 0
    const hasAnalysisResults = !!analysisResults
    const hasInitialAnalysis = !!formData?.generatedMetadata?.competitorsAnalysis

    if (hasAnalysisResults) {
      setActiveTab("results")
    } else if (hasInitialAnalysis) {
      setActiveTab("initial-analysis")
    } else if (hasCompetitors) {
      setActiveTab("competitors")
    }
  }, [analysisResults, formData?.generatedMetadata])

  const handleProjectSelect = value => {
    const foundProject = blogs?.find(p => p._id === value)
    if (foundProject) {
      setId(foundProject._id)
      setAnalysisResults(null)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return

    if (formData.content.length < 500) {
      toast.error("Your content is too short (min 500 characters) for accurate analysis.")
      return
    }

    const estimatedCost = getEstimatedCost("analysis.competitors")
    const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

    if (userCredits < estimatedCost) {
      handlePopup({
        title: "Insufficient Credits",
        description: (
          <div className="space-y-1 mt-2">
            <p>
              Required: <span className="font-bold">{estimatedCost} credits</span>
            </p>
            <p>
              Available: <span className="font-bold">{userCredits} credits</span>
            </p>
          </div>
        ),
        okText: "Buy Credits",
        onConfirm: () => {
          navigate("/pricing")
        },
      })
      return
    }

    setIsLoading(true)
    setAnalysisLoading(true)
    try {
      const result = await runCompetitiveAnalysis({
        title: formData.title,
        content: formData.content,
        keywords: [...new Set([...formData.keywords, ...formData.focusKeywords])],
        contentType: formData.contentType,
        blogId: formData?.selectedProject?._id,
      })
      setAnalysisResult(formData?.selectedProject?._id, result)
      setAnalysisResults(result)
      toast.success("Analysis completed successfully!")
    } catch (err) {
      console.error("Error fetching analysis:", err)
      toast.error("Failed to run competitive analysis")
    } finally {
      setIsLoading(false)
      setAnalysisLoading(false)
    }
  }

  const handleReset = () => {
    setId(null)
    setFormData({
      title: "",
      content: "",
      keywords: [],
      focusKeywords: [],
      contentType: "markdown",
      selectedProject: null,
      generatedMetadata: null,
    })
    setAnalysisResults(null)
    toast.info("Content reset")
  }

  const cleanMarkdown = text => {
    if (!text) return ""
    return text
      .replace(/#{1,3}\s/g, "")
      .replace(/[\*_~`]/g, "")
      .replace(/\n+/g, "\n")
      .trim()
  }

  const parseSummary = text => {
    if (!text) return []
    return cleanMarkdown(text)
      .split("\n")
      .filter(line => line.trim() !== "")
      .map((line, index) => (
        <p key={index} className="mb-2 text-sm leading-relaxed">
          <span
            dangerouslySetInnerHTML={{
              __html: line.trim().replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
            }}
          />
        </p>
      ))
  }

  const mergedCompetitors = useMemo(() => {
    const blogCompetitors = formData?.generatedMetadata?.competitors || []
    const analysisCompetitors = analysisResults?.competitors || []
    const uniqueCompetitors = []
    const seenUrls = new Set()

    ;[...blogCompetitors, ...analysisCompetitors].forEach(competitor => {
      const url = competitor.url || competitor.link
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url)
        uniqueCompetitors.push(competitor)
      }
    })

    return uniqueCompetitors
  }, [formData?.generatedMetadata?.competitors, analysisResults?.competitors])

  const mergedKeywords = useMemo(() => {
    return [...new Set([...formData.keywords, ...formData.focusKeywords])]
  }, [formData.keywords, formData.focusKeywords])

  const hasCompetitors = mergedCompetitors.length > 0
  const hasAnalysisResults = !!analysisResults
  const hasInitialAnalysis = !!formData?.generatedMetadata?.competitorsAnalysis

  const CircularProgress = ({ score }) => {
    const radius = 45
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference

    return (
      <div className="relative flex items-center justify-center w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-100"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-blue-600 transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute text-2xl font-bold text-slate-800">{score}%</span>
      </div>
    )
  }

  const renderCompetitorsList = competitors => (
    <Accordion type="single" collapsible className="w-full space-y-2">
      {competitors.map((competitor, idx) => (
        <AccordionItem
          key={idx}
          value={`item-${idx}`}
          className="border border-gray-300 rounded-lg px-4 overflow-hidden"
        >
          <div className="py-2">
            <AccordionTrigger className="hover:no-underline py-2 flex-1 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pr-4">
                <span className="font-semibold text-slate-800 line-clamp-1">
                  {cleanMarkdown(competitor.title)}
                </span>
                {competitor.score && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none w-fit"
                  >
                    {(competitor.score * 100).toFixed(0)}% Match
                  </Badge>
                )}
                <a
                  href={competitor.link || competitor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </AccordionTrigger>
          </div>
          <AccordionContent className="pt-2 pb-4 text-slate-600 border-t border-slate-50">
            {competitor.content ? (
              <div className="space-y-2">{parseSummary(competitor.content)}</div>
            ) : (
              <div className="space-y-3">
                <p className="font-medium text-slate-800">{cleanMarkdown(competitor.snippet)}</p>
                {parseSummary(competitor.summary)}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )

  const renderLinksSection = (links, title, icon) => (
    <Card className="border-none shadow-none bg-slate-50/50">
      <CardHeader className="px-0 pb-4">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-lg font-bold text-slate-800">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Accordion type="single" collapsible className="space-y-2">
          {links.map((link, idx) => (
            <AccordionItem
              key={idx}
              value={`link-${idx}`}
              className="border border-gray-300 rounded-lg px-4 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between">
                <AccordionTrigger className="hover:no-underline py-4 flex-1 text-left">
                  <span className="font-medium text-slate-700 pr-4 line-clamp-1">
                    {cleanMarkdown(link.title)}
                  </span>
                </AccordionTrigger>
                <a
                  href={link.link || link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm flex items-center gap-1 shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  Visit <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <AccordionContent className="pb-4 text-slate-600">
                <p className="text-sm mb-2">{cleanMarkdown(link.snippet || link.content)}</p>
                {link.summary && (
                  <div className="p-3 bg-slate-50 rounded-lg text-xs italic">
                    {parseSummary(link.summary)}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )

  const renderAnalysisBreakdown = analysisData => {
    if (!analysisData?.analysis) return null
    return (
      <Accordion type="single" collapsible className="w-full space-y-2">
        {Object.entries(analysisData.analysis).map(([key, value], idx) => (
          <AccordionItem
            key={idx}
            value={`analysis-${idx}`}
            className="border border-gray-300 rounded-lg px-4 bg-white shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center justify-between w-full pr-6">
                <span className="font-semibold text-slate-800">{cleanMarkdown(key)}</span>
                {value.score && (
                  <Badge
                    variant="outline"
                    className="ml-2 border-blue-200 text-blue-600 bg-blue-50/50"
                  >
                    {value.score}/{value.maxScore}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-slate-600 border-t border-slate-50 pt-3">
              <p className="leading-relaxed">
                {cleanMarkdown(value.feedback?.replace(/\s*\(\d+\/\d+\)$/, ""))}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    )
  }

  if (isLoading || analysisLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
      <Helmet>
        <title>Competitive Analysis | GenWrite</title>
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-6 p-3 md:p-10 mt-6 md:mt-0">
        {/* Page Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  Competitive Analysis
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Benchmark your content against top-performing competitors.
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="shrink-0 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Project Selection Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Choose Project</h2>
          </div>
          <Select onValueChange={handleProjectSelect} value={id || ""}>
            <SelectTrigger className="w-full h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-blue-500/20">
              <SelectValue placeholder="Select a blog from your library..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] border-gray-300">
              {blogs.map(blog => (
                <SelectItem
                  key={blog._id}
                  value={blog._id}
                  className="cursor-pointer py-3 focus:bg-blue-50 focus:text-blue-600"
                >
                  {blog.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!formData.selectedProject ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
              <Globe className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Analysis Required</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2 font-medium">
              Choose a project to unlock competitive insights and SEO optimization tips.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Cost Indicator */}
            <div className="flex justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                      Run Live Analysis:{" "}
                      <span className="text-blue-600">
                        {getEstimatedCost("analysis.competitors")} credits
                      </span>
                      <Info className="w-3 h-3 cursor-help" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Credits only deducted for fresh scans</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-slate-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Title & Content Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">
                    {formData.title}
                  </h3>
                  <div
                    className="max-h-100 overflow-y-auto pr-2 custom-scroll text-sm text-slate-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Detected Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {mergedKeywords.length > 0 ? (
                      mergedKeywords.map(kw => (
                        <Badge
                          key={kw}
                          variant="secondary"
                          className="bg-blue-50/50 border-blue-100 text-blue-700 font-medium"
                        >
                          {cleanMarkdown(kw)}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No keywords detected</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Analysis Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-slate-50 p-1 rounded-xl h-auto mb-8">
                  {hasAnalysisResults && (
                    <TabsTrigger
                      value="results"
                      className="py-3 text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Fresh Analysis
                    </TabsTrigger>
                  )}
                  {hasInitialAnalysis && (
                    <TabsTrigger
                      value="initial-analysis"
                      className="py-3 text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Build Score
                    </TabsTrigger>
                  )}
                  {hasCompetitors && (
                    <TabsTrigger
                      value="competitors"
                      className="py-3 text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Competitors
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="links"
                    className="py-3 text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Audit
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <TabsContent value="results" className="mt-0 focus-visible:ring-0">
                    {analysisResults ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <Card className="flex flex-col items-center justify-center p-6 bg-linear-to-b from-blue-50/30 to-white border-blue-50">
                            <CircularProgress score={analysisResults.insights?.blogScore || 0} />
                            <h4 className="mt-4 font-bold text-slate-800">SEO Health</h4>
                            <p className="text-[10px] text-slate-400 text-center mt-1 uppercase font-bold">
                              Compared to web average
                            </p>
                          </Card>

                          <Card className="md:col-span-2 p-6 border-slate-100 bg-slate-50/30">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                              <Activity className="w-5 h-5 text-blue-600" />
                              Strategic Recommendations
                            </h3>
                            <div className="space-y-3">
                              {(Array.isArray(analysisResults.insights?.suggestions)
                                ? analysisResults.insights.suggestions
                                : analysisResults.insights?.suggestions?.split?.(/(?:\d+\.\s)/)
                              )
                                ?.filter(Boolean)
                                .map((s, idx) => (
                                  <div
                                    key={idx}
                                    className="flex gap-3 text-sm text-slate-600 leading-relaxed items-start p-3 bg-white rounded-xl border border-slate-100 shadow-sm"
                                  >
                                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 shadow-sm">
                                      {idx + 1}
                                    </span>
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: cleanMarkdown(s).replace(
                                          /\*\*(.*?)\*\*/g,
                                          "<strong>$1</strong>"
                                        ),
                                      }}
                                    />
                                  </div>
                                ))}
                            </div>
                          </Card>
                        </div>
                        <div className="pt-4">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">
                            Metric Breakdown
                          </h3>
                          {renderAnalysisBreakdown(analysisResults.insights)}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-center py-12">
                        <Button
                          onClick={handleSubmit}
                          disabled={isLoading || analysisLoading}
                          className="px-10 h-14 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-blue-200 transition-all hover:scale-105 active:scale-95"
                        >
                          Run Deep Analysis
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="initial-analysis" className="mt-0">
                    {hasInitialAnalysis && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 text-amber-900 shadow-sm">
                          <div className="flex items-center gap-2 font-bold mb-4 text-base">
                            <Info className="w-5 h-5" />
                            Pre-Generation Insights
                          </div>
                          <ul className="space-y-3">
                            {(Array.isArray(
                              formData.generatedMetadata.competitorsAnalysis?.suggestions
                            )
                              ? formData.generatedMetadata.competitorsAnalysis.suggestions
                              : formData.generatedMetadata.competitorsAnalysis.suggestions?.split?.(
                                  /(?:\d+\.\s)/
                                )
                            )
                              ?.filter(Boolean)
                              .map((s, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm leading-relaxed pl-4 border-l-2 border-amber-300"
                                  dangerouslySetInnerHTML={{
                                    __html: cleanMarkdown(s).replace(
                                      /\*\*(.*?)\*\*/g,
                                      "<strong>$1</strong>"
                                    ),
                                  }}
                                />
                              ))}
                          </ul>
                        </div>
                        {renderAnalysisBreakdown(formData.generatedMetadata.competitorsAnalysis)}
                      </motion.div>
                    )}
                  </TabsContent>

                  <TabsContent value="competitors" className="mt-0">
                    {renderCompetitorsList(mergedCompetitors)}
                  </TabsContent>

                  <TabsContent value="links" className="mt-0 space-y-8">
                    {renderLinksSection(
                      formData.generatedMetadata?.outboundLinks || [],
                      "Outbound Authority",
                      <ExternalLink className="w-5 h-5 text-indigo-500" />
                    )}
                    {renderLinksSection(
                      formData.generatedMetadata?.internalLinks || [],
                      "Internal Architecture",
                      <LinkIcon className="w-5 h-5 text-emerald-500" />
                    )}
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </div>

            {/* Final Action Bar */}
            <div className="flex justify-center pt-6 pb-12">
              <Button
                onClick={handleSubmit}
                disabled={isLoading || analysisLoading}
                className="px-12 h-16 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg text-lg"
              >
                {isLoading || analysisLoading ? (
                  <span className="flex items-center gap-3">
                    <LoaderCircle className="w-6 h-6 animate-spin" />
                    Scanning Competitors...
                  </span>
                ) : analysisResults ? (
                  "Re-Run Live Audit"
                ) : (
                  "Perform Competitive Scan"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompetitiveAnalysis
