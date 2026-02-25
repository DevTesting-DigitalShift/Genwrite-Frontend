import { useState, useEffect, useMemo } from "react"
import {
  Activity,
  ExternalLink,
  LoaderCircle,
  Link as LinkIcon,
  AlertCircle,
  Check,
  Search,
  Info,
} from "lucide-react"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { runCompetitiveAnalysis } from "@api/analysisApi"
import { getBlogById } from "@api/blogApi"
import useAuthStore from "@store/useAuthStore"
import useBlogStore from "@store/useBlogStore"
import useAnalysisStore from "@store/useAnalysisStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import LoadingScreen from "@components/ui/LoadingScreen"
import { useQueryClient } from "@tanstack/react-query"
import { useAllBlogsQuery } from "@api/queries/blogQueries"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const CompetitiveAnalysisModal = ({ closeFnc, open }) => {
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
  const queryClient = useQueryClient()

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

  useEffect(() => {
    if (!open) {
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
      setId(null)
      setIsLoading(false)
      setActiveTab("results")
    }
  }, [open])

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
          closeFnc()
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
  const blogLoading = useBlogStore(state => state.loading)

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
          className="border rounded-lg px-4 bg-white shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between py-2">
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
              </div>
            </AccordionTrigger>
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
              className="border rounded-lg px-4 bg-white shadow-sm"
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
            className="border rounded-lg px-4 bg-white shadow-sm overflow-hidden"
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

  if (isLoading || blogLoading || analysisLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <LoadingScreen />
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && closeFnc()}>
      <DialogContent className="max-w-5xl w-[95vw] lg:w-[90vw] max-h-[90vh] overflow-y-auto p-0 border-none rounded-2xl shadow-2xl">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10 backdrop-blur-md rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Competitive Analysis
              </DialogTitle>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Benchmarking your content against the web
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6 pt-0 space-y-6 sm:space-y-8">
          {/* Blog Selection Area */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" />
              Analyze Content Performance
            </label>
            <Select onValueChange={handleProjectSelect} value={id || ""}>
              <SelectTrigger className="w-full h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500/20">
                <SelectValue placeholder="Select a blog post to begin..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {blogs.map(blog => (
                  <SelectItem
                    key={blog._id}
                    value={blog._id}
                    className="cursor-pointer py-3 transition-colors focus:bg-slate-100 focus:text-emerald-600 hover:bg-slate-100 hover:text-emerald-600 text-slate-700 font-medium"
                  >
                    {blog.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.selectedProject ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Content Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-slate-100 shadow-none bg-slate-50/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                      Title & Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 leading-tight">
                      {formData.title}
                    </h3>
                    <div
                      className="max-h-40 overflow-y-auto pr-2 custom-scroll text-sm text-slate-600 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formData.content }}
                    />
                  </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-none bg-slate-50/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                      Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {mergedKeywords.length > 0 ? (
                        mergedKeywords.map(kw => (
                          <Badge
                            key={kw}
                            variant="secondary"
                            className="bg-white border-slate-200 text-slate-700 font-medium"
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

              {/* Analysis Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-slate-100/50 p-1.5 rounded-xl h-auto mb-6 gap-1.5">
                  {hasAnalysisResults && (
                    <TabsTrigger
                      value="results"
                      className="py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Fresh Analysis
                    </TabsTrigger>
                  )}
                  {hasInitialAnalysis && (
                    <TabsTrigger
                      value="initial-analysis"
                      className="py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Build Score
                    </TabsTrigger>
                  )}
                  {hasCompetitors && (
                    <TabsTrigger
                      value="competitors"
                      className="py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Top Competitors
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="links"
                    className="py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Link Audit
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <TabsContent value="results" className="mt-0 focus-visible:ring-0">
                    {analysisResults && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <Card className="flex flex-col items-center justify-center p-6 bg-linear-to-b from-blue-50/50 to-white border-blue-100">
                            <CircularProgress score={analysisResults.insights?.blogScore || 0} />
                            <h4 className="mt-4 font-bold text-slate-800">Overall SEO Score</h4>
                            <p className="text-xs text-slate-500 text-center mt-1">
                              Relative to competitive benchmark
                            </p>
                          </Card>

                          <Card className="md:col-span-2 p-6 border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                              <Check className="w-5 h-5 text-emerald-500" />
                              Strategic Suggestions
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
                                    className="flex gap-3 text-sm text-slate-600 leading-relaxed items-start p-2 hover:bg-slate-50 rounded-lg transition-colors"
                                  >
                                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
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
                        <div className="space-y-3">
                          <h3 className="text-lg font-bold text-slate-800">
                            Competitive Breakdown
                          </h3>
                          {renderAnalysisBreakdown(analysisResults.insights)}
                        </div>
                      </motion.div>
                    )}
                  </TabsContent>

                  <TabsContent value="initial-analysis" className="mt-0">
                    {hasInitialAnalysis && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100/50 text-amber-900">
                          <div className="flex items-center gap-2 font-bold mb-3">
                            <Info className="w-5 h-5" />
                            Pre-Generation Analysis
                          </div>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
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
                      "Internal Potential",
                      <LinkIcon className="w-5 h-5 text-emerald-500" />
                    )}
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Analysis Required</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2">
                Select a blog post above to unlock deep competitive insights and SEO optimization
                tips.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50/80 border-t border-gray-300 sticky bottom-0 z-10 backdrop-blur-md rounded-b-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-3 py-2 rounded-full border border-slate-200">
                    Cost:{" "}
                    <span className="text-blue-600">
                      {getEstimatedCost("analysis.competitors")} credits
                    </span>
                    <Info className="w-3 h-3 cursor-help" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Based on current API usage</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={closeFnc}
                className="flex-1 sm:flex-none h-11 px-8 rounded-lg border-slate-200 font-bold"
              >
                Dismiss
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.selectedProject || isLoading || analysisLoading}
                className="flex-1 sm:flex-none h-11 px-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200"
              >
                {isLoading || analysisLoading ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                    Deep Scanning...
                  </span>
                ) : analysisResults ? (
                  "Re-Analyze Web"
                ) : (
                  "Run Live Analysis"
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CompetitiveAnalysisModal
