import { useState, useEffect, useMemo } from "react"
import {
  Activity,
  ExternalLink,
  Link as LinkIcon,
  AlertCircle,
  X,
  Check,
  Loader2,
  ChevronDown,
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
import LoadingScreen from "@components/UI/LoadingScreen"
import { useQueryClient } from "@tanstack/react-query"
import { useAllBlogsQuery } from "@api/queries/blogQueries"
import toast from "@utils/toast"

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
  const [activeTab, setActiveTab] = useState(null)
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

  // Handle analysis results
  useEffect(() => {
    if (!analysisLoading && analysis) {
      setAnalysisResults(analysis)
    }
  }, [analysis, analysisLoading])

  // Reset form and results when modal closes
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
      setActiveTab(null)
    }
  }, [open])

  // Fetch all blogs for the dropdown
  const { data: allBlogsData } = useAllBlogsQuery()
  const blogs = Array.isArray(allBlogsData) ? allBlogsData : allBlogsData?.blogs || []

  // Handle body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [open])

  // Fetch blog data when id changes
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

  // Determine first available tab
  useEffect(() => {
    const hasCompetitors = mergedCompetitors.length > 0
    const hasOutboundLinks = formData?.generatedMetadata?.outboundLinks?.length > 0
    const hasInternalLinks = formData?.generatedMetadata?.internalLinks?.length > 0
    const hasAnalysisResults = !!analysisResults
    const hasInitialAnalysis = !!formData?.generatedMetadata?.competitorsAnalysis

    if (hasAnalysisResults) {
      setActiveTab("results")
    } else if (hasCompetitors) {
      setActiveTab("competitors")
    } else if (hasOutboundLinks || hasInternalLinks) {
      setActiveTab("links")
    } else if (hasInitialAnalysis) {
      setActiveTab("initial-analysis")
    } else {
      setActiveTab(null)
    }
  }, [
    analysisResults,
    formData?.generatedMetadata?.competitors,
    formData?.generatedMetadata?.outboundLinks,
    formData?.generatedMetadata?.internalLinks,
    formData?.generatedMetadata?.competitorsAnalysis,
  ])

  const handleProjectSelect = e => {
    const value = e.target.value
    const foundProject = blogs?.find(p => p._id === value)
    if (foundProject) {
      setId(foundProject._id)
      setAnalysisResults(null)
    } else {
      setId(null)
      setAnalysisResults(null)
      setFormData({
        title: "",
        content: "",
        keywords: [],
        focusKeywords: [],
        contentType: "markdown",
        selectedProject: null,
        generatedMetadata: null,
      })
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return
    if (!formData.content.trim()) return
    if (formData.keywords.length === 0 && formData.focusKeywords.length === 0) return

    if (formData.content.length < 500) {
      toast.error("Your content is too short. This may affect competitive analysis accuracy.")
      return
    }

    // Check if user has sufficient credits
    const estimatedCost = getEstimatedCost("analysis.competitors")
    const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

    if (userCredits < estimatedCost) {
      handlePopup({
        title: "Insufficient Credits",
        description: (
          <div>
            <p>You don't have enough credits to run this competitive analysis.</p>
            <p className="mt-2">
              <strong>Required:</strong> {estimatedCost} credits
            </p>
            <p>
              <strong>Available:</strong> {userCredits} credits
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
        keywords: [...new Set([...formData.keywords, ...formData.focusKeywords])], // Combine and deduplicate
        contentType: formData.contentType,
        blogId: formData?.selectedProject?._id,
      })
      setAnalysisResult(formData?.selectedProject?._id, result)
      setAnalysisResults(result)
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
      .replace(/#{1,3}\s/g, "") // Remove markdown headers
      .replace(/[\*_~`]/g, "") // Remove markdown formatting (*, _, ~, `)
      .replace(/\n+/g, "\n") // Normalize newlines
      .trim()
  }

  const parseSummary = text => {
    if (!text) return []
    return cleanMarkdown(text)
      .split("\n")
      .filter(line => line.trim() !== "")
      .map((line, index) => (
        <p key={index} className="mb-2 text-sm md:text-base">
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
    const seenUrls = new Set()
    const uniqueCompetitors = []

    ;[...blogCompetitors, ...analysisCompetitors].forEach(competitor => {
      const url = competitor.url || competitor.link
      if (!seenUrls.has(url)) {
        seenUrls.add(url)
        uniqueCompetitors.push(competitor)
      }
    })

    return uniqueCompetitors
  }, [formData?.generatedMetadata?.competitors, analysisResults?.competitors])

  const mergedKeywords = useMemo(() => {
    return [...new Set([...formData.keywords, ...formData.focusKeywords])] // Combine and deduplicate
  }, [formData.keywords, formData.focusKeywords])

  const hasCompetitors = mergedCompetitors.length > 0
  const hasOutboundLinks = formData?.generatedMetadata?.outboundLinks?.length > 0
  const hasInternalLinks = formData?.generatedMetadata?.internalLinks?.length > 0
  const hasAnalysisResults = !!analysisResults
  const hasInitialAnalysis = !!formData?.generatedMetadata?.competitorsAnalysis

  const blogLoading = useBlogStore(state => state.loading)

  if (!open) return null

  if (isLoading || blogLoading || analysisLoading) {
    return (
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <LoadingScreen />
      </div>
    )
  }

  // Helper component for DaisyUI collapse
  const CollapsibleSection = ({ title, children, defaultOpen = false, topRightContent }) => {
    return (
      <div className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-lg shadow-sm mb-2">
        <input type="checkbox" defaultChecked={defaultOpen} />
        <div className="collapse-title text-base font-medium flex justify-between items-center pr-12 min-h-14 py-3">
          <span className="truncate mr-2">{title}</span>
          {topRightContent && <div onClick={e => e.stopPropagation()}>{topRightContent}</div>}
        </div>
        <div className="collapse-content bg-base-50 text-sm">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={closeFnc}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white">
              <Activity size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Competitive Analysis Dashboard</h2>
          </div>
          <button
            onClick={closeFnc}
            className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50 custom-scrollbar">
          {/* Blog Selection */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm"
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
              Select Blog Post
            </label>
            <div className="relative">
              <select
                className="select bg-white text-black w-full h-12 text-base rounded-lg border border-gray-300 outline-0 pl-4 pr-10"
                onChange={handleProjectSelect}
                value={formData.selectedProject?._id || ""}
              >
                <option disabled>Choose a blog to analyze...</option>
                {blogs?.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </motion.div>

          {formData.selectedProject ? (
            <div className="space-y-6">
              {/* Blog Details Summary */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                    Blog Details
                  </h3>
                </div>
                <div className="p-5 space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                      Title
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-800 font-medium border border-gray-200/60 text-sm">
                      {formData.title}
                    </div>
                  </div>

                  {mergedKeywords.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                        Keywords
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {mergedKeywords.map(keyword => (
                          <span
                            key={keyword}
                            className="badge badge-lg bg-blue-50 text-blue-700 border border-blue-100 px-3 py-3 h-auto text-sm font-medium"
                          >
                            {cleanMarkdown(keyword)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                      Content Preview
                    </label>
                    {formData.content ? (
                      <div className="max-h-48 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200/60 text-sm text-gray-600 leading-relaxed custom-scrollbar prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: formData.content }} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400">
                        <AlertCircle size={24} className="mb-2 opacity-50" />
                        <span className="text-sm">No content available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SEO Meta */}
              {formData.generatedMetadata?.seo_meta && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                      SEO Metadata
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                        Meta Title
                      </span>
                      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200/60">
                        {cleanMarkdown(formData.generatedMetadata.seo_meta.title)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                        Meta Description
                      </span>
                      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200/60">
                        {cleanMarkdown(formData.generatedMetadata.seo_meta.description)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Section */}
              {(hasCompetitors ||
                hasOutboundLinks ||
                hasInternalLinks ||
                hasAnalysisResults ||
                hasInitialAnalysis) && (
                <div className="mt-8">
                  <div className="flex overflow-x-auto pb-2 mb-4 scrollbar-hide gap-1">
                    {hasAnalysisResults && (
                      <button
                        onClick={() => setActiveTab("results")}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2
                                            ${activeTab === "results" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
                      >
                        <Activity size={16} /> Results
                      </button>
                    )}
                    {hasCompetitors && (
                      <button
                        onClick={() => setActiveTab("competitors")}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2
                                            ${activeTab === "competitors" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
                      >
                        <ExternalLink size={16} /> Competitors
                      </button>
                    )}
                    {(hasOutboundLinks || hasInternalLinks) && (
                      <button
                        onClick={() => setActiveTab("links")}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2
                                            ${activeTab === "links" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
                      >
                        <LinkIcon size={16} /> links
                      </button>
                    )}
                    {hasInitialAnalysis && (
                      <button
                        onClick={() => setActiveTab("initial-analysis")}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2
                                            ${activeTab === "initial-analysis" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
                      >
                        <Activity size={16} /> Initial Analysis
                      </button>
                    )}
                  </div>

                  <div className="min-h-[300px]">
                    {activeTab === "results" && hasAnalysisResults && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center text-center shadow-sm">
                          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                            <div
                              className="radial-progress text-blue-600"
                              style={{
                                "--value": Number(analysisResults.insights?.blogScore ?? 0),
                                "--size": "8rem",
                                "--thickness": "0.8rem",
                              }}
                            >
                              <span className="text-2xl font-semibold text-gray-800">
                                {Number(analysisResults.insights?.blogScore ?? 0)}%
                              </span>
                            </div>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-1">
                            Blog SEO Score
                          </h4>
                          <p className="text-sm text-gray-500">Based on competitive analysis</p>
                        </div>

                        <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-6 shadow-sm">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <div className="p-1.5 bg-green-100 rounded-lg text-green-700 shadow-sm">
                              <Check size={18} />
                            </div>
                            Suggestions to Beat Competitors
                          </h3>
                          <div className="bg-white/60 rounded-xl p-4 border border-green-100/50">
                            <ul className="space-y-3">
                              {(Array.isArray(analysisResults?.insights?.suggestions)
                                ? analysisResults?.insights?.suggestions
                                : analysisResults?.insights?.suggestions?.split(/(?:\d+\.\s)/)
                              )
                                ?.filter(Boolean)
                                .map((point, index) => (
                                  <li
                                    key={index}
                                    className="flex gap-3 text-sm text-gray-700 items-start"
                                  >
                                    <span className="text-green-500 font-semibold mt-0.5">•</span>
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: cleanMarkdown(point.trim()).replace(
                                          /\*\*(.*?)\*\*/g,
                                          "<strong>$1</strong>"
                                        ),
                                      }}
                                    />
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </div>

                        {/* Competitors Analysis Accordion */}
                        {analysisResults?.insights?.analysis && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-800">
                                Detailed Breakdown
                              </h3>
                              <div className="h-px flex-1 bg-gray-200"></div>
                            </div>
                            {Object.entries(analysisResults.insights.analysis).map(
                              ([key, value], index) => (
                                <CollapsibleSection
                                  key={key}
                                  title={cleanMarkdown(key)}
                                  topRightContent={
                                    value.score &&
                                    value.maxScore && (
                                      <div className="badge badge-sm bg-blue-100 text-blue-600 border border-blue-400 rounded-md font-semibold">
                                        {value.score}/{value.maxScore}
                                      </div>
                                    )
                                  }
                                >
                                  <p className="text-gray-600 text-sm leading-relaxed">
                                    {cleanMarkdown(
                                      value?.feedback?.replace(/\s*\(\d+\/\d+\)$/, "").trim()
                                    )}
                                  </p>
                                </CollapsibleSection>
                              )
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "competitors" && (
                      <div className="space-y-3">
                        {mergedCompetitors.map((competitor, index) => (
                          <CollapsibleSection
                            key={index}
                            title={cleanMarkdown(competitor.title)}
                            topRightContent={
                              <div className="flex items-center gap-2">
                                {competitor.score && (
                                  <span className="badge badge-info badge-sm text-white font-medium">
                                    {(competitor.score * 100).toFixed(0)}% Match
                                  </span>
                                )}
                                <a
                                  href={competitor?.link ?? competitor?.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-xs btn-ghost btn-square text-blue-600 hover:bg-blue-50"
                                >
                                  <ExternalLink size={14} />
                                </a>
                              </div>
                            }
                          >
                            <div className="prose prose-sm max-w-none text-gray-600">
                              {competitor?.content ? (
                                <div>{parseSummary(competitor.content)}</div>
                              ) : (
                                <>
                                  <p className="font-medium text-gray-800 mb-2">
                                    {cleanMarkdown(competitor.snippet || competitor.content)}
                                  </p>
                                  <div>{parseSummary(competitor.summary)}</div>
                                </>
                              )}
                            </div>
                          </CollapsibleSection>
                        ))}
                      </div>
                    )}

                    {activeTab === "links" && (
                      <div className="space-y-6">
                        {[
                          {
                            title: "Outbound Links",
                            data: formData?.generatedMetadata?.outboundLinks,
                            color: "text-blue-600",
                            bg: "bg-blue-100",
                          },
                          {
                            title: "Internal Links",
                            data: formData?.generatedMetadata?.internalLinks,
                            color: "text-purple-600",
                            bg: "bg-purple-100",
                          },
                        ].map(
                          (section, idx) =>
                            section.data?.length > 0 && (
                              <div
                                key={idx}
                                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                              >
                                <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                                  <div
                                    className={`p-1.5 rounded-lg ${section.bg} ${section.color}`}
                                  >
                                    <LinkIcon size={16} />
                                  </div>
                                  <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
                                    {section.title}
                                  </h3>
                                </div>
                                <div className="p-4 space-y-2">
                                  {section.data.map((link, i) => (
                                    <CollapsibleSection
                                      key={i}
                                      title={cleanMarkdown(link.title)}
                                      topRightContent={
                                        <a
                                          href={link.link || link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="btn btn-xs btn-ghost text-blue-600 flex items-center gap-1 font-normal"
                                        >
                                          Visit <ExternalLink size={12} />
                                        </a>
                                      }
                                    >
                                      <p className="text-gray-600 text-sm mb-2">
                                        {cleanMarkdown(link.snippet || link.content)}
                                      </p>
                                      {link.summary && (
                                        <div className="text-gray-500 text-xs italic bg-gray-50 p-2 rounded border border-gray-100">
                                          {parseSummary(link.summary)}
                                        </div>
                                      )}
                                    </CollapsibleSection>
                                  ))}
                                </div>
                              </div>
                            )
                        )}
                      </div>
                    )}

                    {activeTab === "initial-analysis" && hasInitialAnalysis && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          {Object.entries(
                            formData?.generatedMetadata?.competitorsAnalysis?.analysis || {}
                          ).map(([key, value]) => (
                            <CollapsibleSection
                              key={key}
                              title={cleanMarkdown(key)}
                              topRightContent={
                                value.score &&
                                value.maxScore && (
                                  <div className="badge badge-outline badge-sm">
                                    {value.score}/{value.maxScore}
                                  </div>
                                )
                              }
                            >
                              <p className="text-gray-600 text-sm">
                                {cleanMarkdown(
                                  value?.feedback?.replace(/\s*\(\d+\/\d+\)$/, "").trim()
                                )}
                              </p>
                            </CollapsibleSection>
                          ))}
                        </div>
                        {/* Suggestions */}
                        {formData?.generatedMetadata?.competitorsAnalysis?.suggestions && (
                          <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
                            <h3 className="text-amber-800 font-semibold mb-3 flex items-center gap-2">
                              <Activity size={18} /> Initial Suggestions
                            </h3>
                            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 marker:text-amber-500">
                              {(Array.isArray(
                                formData.generatedMetadata.competitorsAnalysis.suggestions
                              )
                                ? formData.generatedMetadata.competitorsAnalysis.suggestions
                                : formData.generatedMetadata.competitorsAnalysis.suggestions.split(
                                    /(?:\d+\.\s)/
                                  )
                              )
                                .filter(Boolean)
                                .map((point, index) => (
                                  <li key={index}>
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: cleanMarkdown(point.trim()).replace(
                                          /\*\*(.*?)\*\*/g,
                                          "<strong>$1</strong>"
                                        ),
                                      }}
                                    />
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                <Activity size={32} className="text-blue-500/50" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Blog Selected</h3>
              <p className="text-gray-500 max-w-sm text-sm">
                Please select a blog post from the dropdown above to view details and run
                competitive analysis.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            <span className="text-gray-500 font-medium">Estimated Cost:</span>
            <span className="font-semibold text-blue-600">
              {getEstimatedCost("analysis.competitors")} credits
            </span>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <button
              onClick={closeFnc}
              className="btn btn-ghost border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 rounded-lg flex-1 sm:flex-none font-medium"
            >
              Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || blogLoading || analysisLoading || !formData.selectedProject}
              className="btn bg-blue-600 hover:bg-blue-700 text-white border-none flex-1 sm:flex-none rounded-lg font-semibold px-6"
            >
              {isLoading || blogLoading || analysisLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Analyzing...
                </>
              ) : analysisResults ? (
                "Re-Run Analysis"
              ) : (
                "Run Analysis"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default CompetitiveAnalysisModal
