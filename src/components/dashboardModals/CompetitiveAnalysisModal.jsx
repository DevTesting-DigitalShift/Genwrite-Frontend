import { useState, useEffect, useMemo } from "react"
import { Activity, ExternalLink } from "lucide-react"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import {
  Collapse,
  Card,
  Progress,
  Modal,
  Select,
  Tabs,
  Empty,
  Button,
  Tag,
  Input,
  message,
  Tooltip,
} from "antd"
import { motion } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { fetchCompetitiveAnalysisThunk } from "@store/slices/analysisSlice"
import { LoadingOutlined } from "@ant-design/icons"
import { Link as LinkIcon } from "lucide-react"
import { fetchBlogById, fetchBlogs } from "@store/slices/blogSlice"
import { selectUser } from "@store/slices/authSlice"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import LoadingScreen from "@components/UI/LoadingScreen"

const { Panel } = Collapse

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
  const [collapseKey, setCollapseKey] = useState(0) // Used to reset Collapse
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const { handlePopup } = useConfirmPopup()
  const { analysis, loading: analysisLoading } = useSelector(state => state.analysis)
  const { allBlogs: blogs, loading: blogLoading } = useSelector(state => state.blog)

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
      setCollapseKey(0)
    } else {
      dispatch(fetchBlogs())
    }
  }, [open])

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
      dispatch(fetchBlogById(id))
        .unwrap()
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
        })
        .finally(() => setIsLoading(false))
    }
  }, [id, dispatch])

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

  const handleProjectSelect = value => {
    const foundProject = blogs?.find(p => p._id === value)
    if (foundProject) {
      setId(foundProject._id)
      setAnalysisResults(null)
      setCollapseKey(prev => prev + 1) // Reset Collapse
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return
    if (!formData.content.trim()) return
    if (formData.keywords.length === 0 && formData.focusKeywords.length === 0) return

    if (formData.content.length < 500) {
      message.warning("Your content is too short. This may affect competitive analysis accuracy.")
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
    try {
      const result = await dispatch(
        fetchCompetitiveAnalysisThunk({
          title: formData.title,
          content: formData.content,
          keywords: [...new Set([...formData.keywords, ...formData.focusKeywords])], // Combine and deduplicate
          contentType: formData.contentType,
          blogId: formData?.selectedProject?._id,
        })
      ).unwrap()
      setAnalysisResults(result)
    } catch (err) {
      console.error("Error fetching analysis:", err)
    } finally {
      setIsLoading(false)
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

  const renderCompetitorsList = competitors => {
    if (!competitors || competitors.length === 0) return null
    return (
      <Collapse key={collapseKey} accordion className="bg-white border border-gray-200 rounded-lg">
        {competitors.map((competitor, index) => (
          <Panel
            key={index}
            header={
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full pr-2">
                <span className="font-medium text-gray-800 truncate max-w-[80%] sm:max-w-[60%] text-sm md:text-base">
                  {cleanMarkdown(competitor.title)}
                </span>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Tooltip title="Relatable Score">
                    {competitor.score && (
                      <Tag color="blue">{(competitor.score * 100).toFixed(2)}%</Tag>
                    )}
                  </Tooltip>
                  <a
                    href={competitor?.link ?? competitor?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                    onClick={e => e.stopPropagation()}
                  >
                    Visit <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            }
            className="text-sm md:text-base text-gray-700 leading-relaxed"
          >
            {competitor?.content ? (
              <div>{parseSummary(competitor.content)}</div>
            ) : (
              <>
                <p className="mb-2 font-medium">
                  {cleanMarkdown(competitor.snippet || competitor.content)}
                </p>
                <div>{parseSummary(competitor.summary)}</div>
              </>
            )}
          </Panel>
        ))}
      </Collapse>
    )
  }

  const renderOutboundLinksList = (links, title) => {
    if (!links || links.length === 0) return null
    return (
      <Card
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded text-blue-500">
              <LinkIcon size={20} strokeWidth={2} />
            </div>
            <span className="text-base md:text-lg font-semibold text-gray-800">{title}</span>
          </div>
        }
        className="bg-white border border-gray-200 rounded-xl shadow-sm"
      >
        <Collapse key={collapseKey} accordion>
          {links.map((link, index) => (
            <Panel
              key={index}
              header={
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full">
                  <span className="text-sm md:text-base font-medium text-gray-800">
                    {cleanMarkdown(link.title)}
                  </span>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <Tooltip title="Relatable Score">
                      {link.score && <Tag color="blue">{(link.score * 100).toFixed(2)}%</Tag>}
                    </Tooltip>
                    <a
                      href={link.link || link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      Visit <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              }
              className="text-sm md:text-base text-gray-700 leading-relaxed"
            >
              <p className="text-gray-600">{cleanMarkdown(link.snippet || link.content)}</p>
              {link.summary && <div>{parseSummary(link.summary)}</div>}
            </Panel>
          ))}
        </Collapse>
      </Card>
    )
  }

  const renderCompetitorsAnalysis = competitorsAnalysis => {
    if (!competitorsAnalysis) return null
    const { analysis, suggestions } = competitorsAnalysis
    return (
      <Card
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 rounded text-purple-500">
              <Activity size={20} strokeWidth={2} />
            </div>
            <span className="text-base md:text-lg font-semibold text-gray-800">
              Competitors Analysis
            </span>
          </div>
        }
        className="bg-white border border-gray-200 rounded-xl shadow-sm"
      >
        <Collapse key={collapseKey} accordion expandIconPosition="right">
          <Panel
            header={
              <span className="font-semibold text-gray-800 text-sm md:text-base">Analysis</span>
            }
            key="analysis"
          >
            <Collapse accordion>
              {Object.entries(analysis).map(([key, value], index) => {
                const { score, maxScore, feedback } = value
                const description = cleanMarkdown(
                  value?.feedback?.replace(/\s*\(\d+\/\d+\)$/, "").trim()
                )
                return (
                  <Panel
                    key={key}
                    header={
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full pr-2">
                        <span className="font-medium text-gray-800 text-sm md:text-base">
                          {cleanMarkdown(key)}
                        </span>
                        <Tooltip title="Relatable Score">
                          {score && maxScore && (
                            <Tag color="blue">
                              {score}/{maxScore}
                            </Tag>
                          )}
                        </Tooltip>
                      </div>
                    }
                    className="text-sm md:text-base text-gray-700 leading-relaxed"
                  >
                    <p>{description}</p>
                  </Panel>
                )
              })}
            </Collapse>
          </Panel>
          <Panel
            header={
              <span className="font-semibold text-gray-800 text-sm md:text-base">Suggestions</span>
            }
            key="suggestions"
          >
            <ul className="list-decimal pl-6 space-y-3 text-sm md:text-base text-gray-700">
              {(Array.isArray(suggestions) ? suggestions : suggestions.split(/(?:\d+\.\s)/))
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
          </Panel>
        </Collapse>
      </Card>
    )
  }

  const mergedCompetitors = useMemo(() => {
    const blogCompetitors = formData?.generatedMetadata?.competitors || []
    const analysisCompetitors = analysisResults?.competitors || []
    const uniqueCompetitors = []
    const seenUrls = new Set()

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

  if (isLoading || blogLoading || analysisLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <LoadingScreen />
      </div>
    )
  }

  return (
    <Modal
      open={open}
      title={
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 bg-blue-500 rounded-lg text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            Competitive Analysis Dashboard
          </h2>
        </motion.div>
      }
      onCancel={closeFnc}
      footer={[
        <div key="footer" className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Estimated Cost:</span>
            <span className="font-bold text-blue-600">
              {getEstimatedCost("analysis.competitors")} credits
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={closeFnc}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={handleSubmit}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition w-full sm:w-auto ${
                isLoading || blogLoading || analysisLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isLoading || blogLoading || analysisLoading}
            >
              {isLoading || blogLoading || analysisLoading ? (
                <span className="flex items-center gap-2">
                  <LoadingOutlined />
                  {analysisResults ? "Re-Analyzing..." : "Analyzing..."}
                </span>
              ) : analysisResults ? (
                "Re-Run Analysis"
              ) : (
                "Run Competitive Analysis"
              )}
            </Button>
          </div>
        </div>,
      ]}
      width="100%"
      className="w-full max-w-[90vw] md:max-w-3xl lg:max-w-4xl"
      centered
      closable={true}
      transitionName=""
      maskTransitionName=""
      styles={{ body: { maxHeight: "80vh", overflowY: "auto", padding: "12px sm:16px" } }}
    >
      <div className="space-y-4 sm:space-y-6 p-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
            Select Blog Post
          </label>
          <Select
            showSearch
            filterOption={(input, option) =>
              option?.children?.toLowerCase().includes(input.toLowerCase())
            }
            className="w-full rounded-md text-sm md:text-base"
            onChange={handleProjectSelect}
            value={formData.selectedProject?._id || ""}
            placeholder="Select a blog"
          >
            <Select.Option value="">Select a blog</Select.Option>
            {blogs?.map(project => (
              <Select.Option key={project._id} value={project._id}>
                {project.title.charAt(0).toUpperCase() + project.title.slice(1)}
              </Select.Option>
            ))}
          </Select>
        </motion.div>

        {formData.selectedProject && (
          <div className="space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-gray-200 rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-base md:text-lg font-semibold text-gray-700">Blog Details</h3>
              </div>
              <div className="p-3 sm:p-4">
                <div className="mb-3 sm:mb-4">
                  <label className="block text-sm md:text-base font-medium text-gray-600 mb-1">
                    Title
                  </label>
                  <Input
                    name="title"
                    value={formData.title}
                    readOnly
                    className="w-full bg-gray-100 cursor-not-allowed text-sm md:text-base"
                  />
                </div>
                {mergedKeywords.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <label className="block text-sm md:text-base font-medium text-gray-600 mb-1">
                      Keywords
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {mergedKeywords.map((keyword, i) => (
                        <Tag
                          key={keyword}
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-100 text-sm"
                        >
                          {cleanMarkdown(keyword)}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
                {formData.content ? (
                  <div className="text-gray-700 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed p-3 sm:p-4 bg-gray-50 rounded-md text-sm md:text-base">
                    {cleanMarkdown(formData.content)
                      .split("\n")
                      .map((line, index) => (
                        <p key={index} className="mt-2">
                          {line.trim()}
                        </p>
                      ))}
                  </div>
                ) : (
                  <Empty description="No content available for this blog" />
                )}
              </div>
            </motion.div>

            {formData.generatedMetadata?.seo_meta && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="border border-gray-200 rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-base md:text-lg font-semibold text-gray-700">SEO Metadata</h3>
                </div>
                <div className="p-3 sm:p-4">
                  <p className="text-sm md:text-base text-gray-600">
                    <strong>Title:</strong>{" "}
                    {cleanMarkdown(formData.generatedMetadata.seo_meta.title)}
                  </p>
                  <p className="text-sm md:text-base text-gray-600 mt-2">
                    <strong>Description:</strong>{" "}
                    {cleanMarkdown(formData.generatedMetadata.seo_meta.description)}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {!formData.selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 sm:py-10 bg-gray-50 rounded-xl border border-gray-200 shadow-sm"
          >
            <p className="text-gray-600 text-sm md:text-lg">
              Select a blog to view details and analysis
            </p>
          </motion.div>
        )}

        {(hasCompetitors ||
          hasOutboundLinks ||
          hasInternalLinks ||
          hasAnalysisResults ||
          hasInitialAnalysis) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={key => {
                setActiveTab(key)
                setCollapseKey(prev => prev + 1) // Reset Collapse when tab changes
              }}
              type="card"
              className="w-full"
            >
              {hasAnalysisResults && (
                <div
                  tab={
                    <span className="flex items-center gap-2 text-sm md:text-base">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 3v18h18" />
                        <path d="m19 9-5 5-4-4-3 3" />
                      </svg>
                      Analysis Results
                    </span>
                  }
                  key="results"
                >
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="space-y-4 sm:space-y-6"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="flex flex-col items-center my-10"
                    >
                      <Progress
                        type="dashboard"
                        percent={Number(analysisResults.insights?.blogScore ?? 0)}
                        width={120}
                        format={percent => `${percent} / 100`}
                        strokeColor={{ "0%": "#1B6FC9", "100%": "#4C9FE8" }}
                        trailColor="#e5e7eb"
                      />

                      <div className="text-gray-800 text-base md:text-lg font-semibold mt-3">
                        Blog SEO Score
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                    >
                      <Card
                        title="Suggestions to Beat Competitors"
                        className="bg-white border border-gray-200 rounded-lg shadow-sm"
                        headStyle={{
                          background: "#f9fafb",
                          fontWeight: 600,
                          fontSize: "0.9rem sm:1.1rem",
                        }}
                      >
                        <ul className="list-decimal pl-6 space-y-3 text-sm md:text-base text-gray-700">
                          {(Array.isArray(analysisResults?.insights?.suggestions)
                            ? analysisResults?.insights?.suggestions
                            : analysisResults?.insights?.suggestions?.split(/(?:\d+\.\s)/)
                          )
                            ?.filter(Boolean)
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
                      </Card>
                    </motion.div>
                    {renderCompetitorsAnalysis(analysisResults?.insights)}
                  </motion.div>
                </div>
              )}
              {hasCompetitors && (
                <div
                  tab={
                    <span className="flex items-center gap-2 text-sm md:text-base">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      Competitors
                    </span>
                  }
                  key="competitors"
                >
                  {renderCompetitorsList(mergedCompetitors)}
                </div>
              )}
              {(hasOutboundLinks || hasInternalLinks) && (
                <div
                  tab={
                    <span className="flex items-center gap-2 text-sm md:text-base">
                      <Activity size={20} strokeWidth={2} />
                      Links
                    </span>
                  }
                  key="links"
                >
                  <div className="space-y-4 sm:space-y-6">
                    {renderOutboundLinksList(
                      formData?.generatedMetadata?.outboundLinks,
                      "Outbound Links"
                    )}
                    {renderOutboundLinksList(
                      formData?.generatedMetadata?.internalLinks,
                      "Internal Links"
                    )}
                  </div>
                </div>
              )}
              {hasInitialAnalysis && (
                <div
                  tab={
                    <span className="flex items-center gap-2 text-sm md:text-base">
                      <Activity size={20} strokeWidth={2} />
                      Initial Analysis
                    </span>
                  }
                  key="initial-analysis"
                >
                  {renderCompetitorsAnalysis(formData?.generatedMetadata?.competitorsAnalysis)}
                </div>
              )}
            </Tabs>
          </motion.div>
        )}
      </div>
    </Modal>
  )
}

export default CompetitiveAnalysisModal
