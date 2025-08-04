import { useState, useEffect, useMemo } from "react"
import { Plus, X } from "lucide-react"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { Collapse, Card, Progress, Modal, Select, Tabs, Empty } from "antd"
import { motion } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import { fetchCompetitiveAnalysisThunk } from "@store/slices/analysisSlice"
import { LoadingOutlined } from "@ant-design/icons"
import Loading from "@components/Loading"
import { fetchBlogById } from "@store/slices/blogSlice"

const { Panel } = Collapse
const { TabPane } = Tabs

const CompetitiveAnalysisModal = ({ closeFnc, open, blogs }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    keywords: [],
    keywordInput: "",
    contentType: "markdown",
    selectedProject: null,
    generatedMetadata: null,
  })
  const [analysisResults, setAnalysisResults] = useState(null)
  const [id, setId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { handlePopup } = useConfirmPopup()
  const dispatch = useDispatch()
  const { analysis, loading: analysisLoading } = useSelector((state) => state.analysis)
  const { blog, loading: blogLoading } = useSelector((state) => state.blog)

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
        keywordInput: "",
        contentType: "markdown",
        selectedProject: null,
        generatedMetadata: null,
      })
      setAnalysisResults(null)
      setId(null)
      setIsLoading(false)
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
        .then((response) => {
          if (response?._id) {
            setFormData((prev) => ({
              ...prev,
              title: response.title,
              content: response.content || "",
              keywords: response.focusKeywords || [],
              selectedProject: response,
              contentType: "markdown",
              generatedMetadata: response.generatedMetadata || null,
            }))
          }
        })
        .catch((error) => {
          console.error("Failed to fetch blog by ID:", error)
        })
        .finally(() => setIsLoading(false))
    }
  }, [id, dispatch])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProjectSelect = (value) => {
    const foundProject = blogs.find((p) => p._id === value)
    if (foundProject) {
      setId(foundProject._id)
      setFormData((prev) => ({
        ...prev,
        title: foundProject.title,
        content: foundProject.content || "",
        keywords: foundProject.focusKeywords || [],
        selectedProject: foundProject,
        contentType: "markdown",
        generatedMetadata: null, // Reset until API fetches new data
      }))
      setAnalysisResults(null)
    }
  }

  const handleKeywordInputChange = (e) => {
    setFormData((prev) => ({ ...prev, keywordInput: e.target.value }))
  }

  const handleAddKeyword = () => {
    const inputValue = formData.keywordInput
    if (inputValue.trim() !== "") {
      const newKeywords = inputValue
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword !== "" && !formData.keywords.includes(keyword))
      if (newKeywords.length > 0) {
        setFormData((prev) => ({
          ...prev,
          keywords: [...prev.keywords, ...newKeywords],
          keywordInput: "",
        }))
      }
    }
  }

  const handleRemoveKeyword = (index) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }))
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  const handleSubmit = () => {
    if (!formData.title.trim()) return
    if (!formData.content.trim()) return
    if (formData.keywords.length === 0) return

    handlePopup({
      title: "Analyze Competitors",
      description: (
        <p>
          Competitive Analysis cost: <b>{getEstimatedCost("analysis.competitors")} credits</b>
          <br />
          Do you wish to proceed?
        </p>
      ),
      onConfirm: async () => {
        setIsLoading(true)
        try {
          const result = await dispatch(
            fetchCompetitiveAnalysisThunk({
              title: formData.title,
              content: formData.content,
              keywords: formData.keywords,
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
      },
    })
  }

  const parseSummary = (summary) => {
    if (!summary) return []
    return summary
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line, index) => (
        <p key={index} className="mb-2">
          <span
            dangerouslySetInnerHTML={{
              __html: line.trim().replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
            }}
          />
        </p>
      ))
  }

  const competitorsList = useMemo(() => {
    if (!formData?.generatedMetadata?.competitors) return null
    return (
      <Collapse accordion className="bg-white border border-gray-200 rounded-lg">
        {formData.generatedMetadata.competitors.map((competitor, index) => (
          <Panel
            key={index}
            header={
              <div className="flex justify-between items-center w-full pr-2">
                <span className="font-medium text-gray-800 truncate max-w-[60%]">
                  {competitor.title}
                </span>
                <a
                  href={competitor?.link ?? competitor?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Visit
                </a>
              </div>
            }
            className="text-sm text-gray-700 leading-relaxed"
          >
            {competitor?.content ? (
              <div>{parseSummary(competitor.content)}</div>
            ) : (
              <>
                <p className="mb-2 font-medium">{competitor.snippet || competitor.content}</p>
                <div>{parseSummary(competitor.summary)}</div>
              </>
            )}
            {competitor.score && (
              <div className="mt-2">
                <span className="text-sm font-semibold text-gray-600">
                  Score: {(competitor.score * 100).toFixed(2)}%
                </span>
              </div>
            )}
          </Panel>
        ))}
      </Collapse>
    )
  }, [formData?.generatedMetadata?.competitors])

  const outboundLinksList = useMemo(() => {
    if (!formData?.generatedMetadata?.outboundLinks) return null
    return (
      <Card
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded text-blue-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-800">Outbound Links</span>
          </div>
        }
        className="bg-white border border-gray-200 rounded-xl shadow-sm"
      >
        <Collapse accordion>
          {formData.generatedMetadata.outboundLinks.map((link, index) => (
            <Panel
              key={index}
              header={
                <div className="flex justify-between items-center w-full">
                  <span className="text-sm font-medium text-gray-800">{link.title}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(link.link, "_blank")
                    }}
                    className="text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    Visit
                  </span>
                </div>
              }
              className="text-sm text-gray-700 leading-relaxed"
            >
              <p className=" text-gray-600">{link.snippet || link.content}</p>
            </Panel>
          ))}
        </Collapse>
      </Card>
    )
  }, [formData?.generatedMetadata?.outboundLinks])

  const competitorsAnalysis = useMemo(() => {
    if (!formData?.generatedMetadata?.competitorsAnalysis) return null
    const { analysis, suggestions } = formData.generatedMetadata.competitorsAnalysis
    return (
      <Card
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 rounded text-purple-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-800">Competitors Analysis</span>
          </div>
        }
        className="bg-white border border-gray-200 rounded-xl shadow-sm"
      >
        <Collapse accordion expandIconPosition="right">
          <Panel
            header={<span className="font-semibold text-gray-800">Analysis</span>}
            key="analysis"
          >
            <Collapse accordion>
              {Object.entries(analysis).map(([key, value], index) => {
                // Match: "(number/number)" at end of string
                const match = value.match(/\((\d+\/\d+)\)$/)
                const score = match ? match[1] : null
                // Remove the score from the description
                const description = value.replace(/\s*\(\d+\/\d+\)$/, "").trim()

                return (
                  <Panel
                    key={key}
                    header={
                      <div className="flex justify-between items-center w-full pr-2">
                        <span className="font-medium text-gray-800">{key}</span>
                        {score && (
                          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                            {score.replace("/", " / ")}
                          </span>
                        )}
                      </div>
                    }
                    className="text-sm text-gray-700 leading-relaxed"
                  >
                    <p>{description}</p>
                  </Panel>
                )
              })}
            </Collapse>
          </Panel>

          <Panel
            header={<span className="font-semibold text-gray-800">Suggestions</span>}
            key="suggestions"
          >
            <ul className="list-decimal pl-6 space-y-3 text-sm text-gray-700">
              {suggestions
                .split(/(?:\d+\.\s)/)
                .filter(Boolean)
                .map((point, index) => (
                  <li key={index}>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: point.trim().replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                      }}
                    />
                  </li>
                ))}
            </ul>
          </Panel>
        </Collapse>
      </Card>
    )
  }, [formData?.generatedMetadata?.competitorsAnalysis])

  if (isLoading || blogLoading || analysisLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <Loading />
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
              width="12"
              height="12"
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
          <h2 className="text-lg font-semibold text-gray-900">Competitive Analysis Dashboard</h2>
        </motion.div>
      }
      onCancel={closeFnc}
      footer={[
        <div key="footer" className="flex justify-end gap-3">
          <button
            onClick={closeFnc}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 text-sm font-medium text-white bg-[#1B6FC9] rounded-md hover:bg-[#1B6FC9]/90 transition ${
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
          </button>
        </div>,
      ]}
      width={900}
      centered
      closable={true}
      transitionName=""
      maskTransitionName=""
      bodyStyle={{ maxHeight: "80vh", overflowY: "auto", padding: 0 }}
    >
      <div className="space-y-6">
        {!analysisResults && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Recent Project
              </label>
              <Select
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
                className="w-full rounded-md text-sm"
                onChange={handleProjectSelect}
                value={formData.selectedProject?._id || ""}
                dropdownStyle={{ maxHeight: 200, overflowY: "auto" }}
              >
                <Select.Option value="">Select a blog</Select.Option>
                {blogs.map((project) => (
                  <Select.Option key={project._id} value={project._id}>
                    {project.title.charAt(0).toUpperCase() + project.title.slice(1)}
                  </Select.Option>
                ))}
              </Select>
            </motion.div>

            {!formData.selectedProject && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 shadow-sm"
              >
                <p className="text-gray-600 text-lg">
                  Select a blog to view content and competitors
                </p>
              </motion.div>
            )}

            {formData.selectedProject && (
              <div className="space-y-6">
                {formData.content ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                  >
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-700">Content Preview</h3>
                    </div>
                    <div>
                      <div className="text-gray-700 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed p-4 rounded-md">
                        {formData.content.split("\n").map((line, index) => {
                          if (line.startsWith("### ")) {
                            return (
                              <h3 key={index} className="text-lg font-semibold mt-2">
                                {line
                                  .replace("### ", "")
                                  .replace(/[*_~>`]/g, "")
                                  .trim()}
                              </h3>
                            )
                          } else if (line.startsWith("## ")) {
                            return (
                              <h2 key={index} className="text-xl font-semibold mt-2">
                                {line
                                  .replace("## ", "")
                                  .replace(/[*_~>`]/g, "")
                                  .trim()}
                              </h2>
                            )
                          } else if (line.startsWith("# ")) {
                            return (
                              <h1 key={index} className="text-2xl font-bold mt-2">
                                {line
                                  .replace("# ", "")
                                  .replace(/[*_~>`]/g, "")
                                  .trim()}
                              </h1>
                            )
                          } else {
                            return (
                              <p key={index} className="text-base mt-2">
                                {line.replace(/[*_~>`]/g, "").trim()}
                              </p>
                            )
                          }
                        })}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 shadow-sm"
                  >
                    <p className="text-gray-600 text-lg">No content available for this blog</p>
                  </motion.div>
                )}

                {formData.keywords.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm"
                  >
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.keywords.map((keyword, i) => (
                        <motion.span
                          key={keyword}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="px-3 py-1 bg-blue-50 rounded-full text-sm text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(i)}
                            className="ml-2 text-blue-500 hover:text-blue-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </>
        )}

        {formData.generatedMetadata && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Tabs defaultActiveKey={analysisResults ? "results" : "metadata"}>
              <div className="space-y-6">
                {formData.generatedMetadata.competitors && (
                  <Card
                    title={
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-100 rounded text-indigo-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
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
                        </div>
                        <span className="text-lg font-semibold text-gray-800">Competitors</span>
                      </div>
                    }
                    className="bg-white border border-gray-200 rounded-xl shadow-sm"
                  >
                    {competitorsList || <Empty description="No competitor data available" />}
                  </Card>
                )}
                {outboundLinksList}
                {competitorsAnalysis}
              </div>
              {analysisResults && (
                <>
                  <TabPane
                    tab={
                      <span className="flex items-center gap-2">
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
                      className="space-y-6"
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="flex flex-col items-center"
                      >
                        <Progress
                          type="dashboard"
                          percent={parseInt(analysisResults.insights?.blogScore || 0)}
                          format={(percent) => `${percent} / 100`}
                          strokeColor={{ "0%": "#1B6FC9", "100%": "#4C9FE8" }}
                          trailColor="#e5e7eb"
                          size="large"
                        />
                        <div className="text-gray-800 text-lg font-semibold mt-3">
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
                            fontSize: "1.1rem",
                          }}
                        >
                          <ul className="list-decimal pl-6 space-y-3 text-sm text-gray-700">
                            {analysisResults?.insights?.suggestions
                              ?.split(/(?:\d+\.\s)/)
                              .filter(Boolean)
                              .map((point, index) => (
                                <li key={index}>
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: point
                                        .trim()
                                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                                    }}
                                  />
                                </li>
                              ))}
                          </ul>
                        </Card>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                      >
                        <Collapse
                          accordion
                          className="bg-white border border-gray-200 rounded-lg"
                          expandIconPosition="right"
                        >
                          {Object.entries(analysisResults.insights?.analysis || {}).map(
                            ([key, value]) => {
                              const match = value.match(/^(\d+\/\d+)\s+—\s+(.*)$/)
                              const score = match ? match[1] : null
                              const description = match ? match[2] : value
                              return (
                                <Panel
                                  key={key}
                                  header={
                                    <div className="flex justify-between items-center w-full pr-2">
                                      <span className="font-medium text-gray-800">{key}</span>
                                      {score && (
                                        <span className="text-sm text-center w-[10ch] font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                          {score.replace("/", " / ")}
                                        </span>
                                      )}
                                    </div>
                                  }
                                  className="text-sm text-gray-700 leading-relaxed"
                                >
                                  <p>{description}</p>
                                </Panel>
                              )
                            }
                          )}
                        </Collapse>
                      </motion.div>
                    </motion.div>
                  </TabPane>
                  <TabPane
                    tab={
                      <span className="flex items-center gap-2">
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
                    {competitorsList || <Empty description="No competitor data available" />}
                  </TabPane>
                </>
              )}
            </Tabs>
          </motion.div>
        )}
      </div>
    </Modal>
  )
}

export default CompetitiveAnalysisModal
