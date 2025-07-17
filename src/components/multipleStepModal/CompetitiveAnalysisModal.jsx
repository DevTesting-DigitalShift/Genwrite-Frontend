import { useState, useEffect, useMemo } from "react"
import { Plus, X } from "lucide-react"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { Collapse, Card, Progress, message, Modal, Select, Tabs } from "antd"
import { motion } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import { fetchCompetitiveAnalysisThunk } from "@store/slices/analysisSlice"
import { LoadingOutlined } from "@ant-design/icons"
import Loading from "@components/Loading"

const { Panel } = Collapse
const { TabPane } = Tabs

const CompetitiveAnalysisModal = ({ closeFnc, open, blogs }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    keywords: [],
    keywordInput: "",
    contentType: "text",
    selectedProject: null,
  })
  const [analysisResults, setAnalysisResults] = useState(null)
  const { handlePopup } = useConfirmPopup()
  const dispatch = useDispatch()
  const {
    analysis,
    error: analysisError,
    loading: analysisLoading,
  } = useSelector((state) => state.analysis)

  // Handle API response or error
  useEffect(() => {
    if (!analysisLoading) {
      if (analysis) {
        setAnalysisResults(analysis)
      } else if (analysisError) {
        console.error("Analysis error:", analysisError)
        message.error(analysisError || "Failed to perform competitive analysis. Please try again.")
      } else {
        console.warn("Unexpected state: analysis and analysisError are both null")
      }
    }
  }, [analysis, analysisError, analysisLoading])

  // Reset form and results when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        title: "",
        content: "",
        keywords: [],
        keywordInput: "",
        contentType: "text",
        selectedProject: null,
      })
      setAnalysisResults(null)
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProjectSelect = (value) => {
    const project = blogs.data.find((p) => p._id === value)
    if (project) {
      setFormData((prev) => ({
        ...prev,
        title: project.title,
        content: project.content,
        keywords: project.focusKeywords || [],
        selectedProject: project,
        contentType: "markdown",
      }))
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
    if (!formData.title.trim()) return message.error("Please enter a blog title")
    if (!formData.content.trim()) return message.error("Please enter blog content")
    if (formData.keywords.length === 0) return message.error("Please add at least one keyword")

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
        }
      },
    })
  }

  // Parse competitor summary into paragraphs with bold text
  const parseSummary = (summary) => {
    if (!summary) return []
    // Split by newlines, filter out empty strings, and process bold text
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

  // Memoized competitors list
  const competitorsList = useMemo(() => {
    if (!analysisResults?.competitors) return null
    return (
      <Collapse accordion className="bg-white border border-gray-200 rounded-lg">
        {analysisResults.competitors.map((competitor, index) => (
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
                <p className="mb-2 font-medium">{competitor.snippet}</p>
                <div>{parseSummary(competitor.summary)}</div>
              </>
            )}
          </Panel>
        ))}
      </Collapse>
    )
  }, [analysisResults])

  if (analysisLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <Modal
      open={open}
      title={<div className="text-xl font-semibold text-gray-900">Competitive Analysis</div>}
      onCancel={closeFnc}
      footer={[
        <div key="footer" className="flex justify-end gap-3">
          <button
            onClick={closeFnc}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
          >
            Close
          </button>
          {!analysisResults && (
            <button
              onClick={handleSubmit}
              className={`px-4 py-2 text-sm font-medium text-white bg-[#1B6FC9]  rounded-md hover:bg-[#1B6FC9]/90 transition ${
                analysisLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={analysisLoading}
            >
              {analysisLoading ? (
                <span className="flex items-center gap-2">
                  <LoadingOutlined />
                  Analyzing...
                </span>
              ) : (
                "Analyze"
              )}
            </button>
          )}
        </div>,
      ]}
      width={900}
      centered
      closable={true}
      transitionName=""
      maskTransitionName=""
      bodyStyle={{ maxHeight: "80vh", overflowY: "auto", padding: 0 }}
    >
      <div className="p-2">
        {analysisResults ? (
          <Tabs defaultActiveKey="results">
            <TabPane tab="Analysis Results" key="results">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, easement: "easeOut" }}
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
                    percent={parseInt(analysisResults.insights.blogScore || 0)}
                    format={(percent) => `${percent} / 100`}
                    strokeColor={{ "0%": "#1B6FC9", "100%": "#4C9FE8" }}
                    trailColor="#e5e7eb"
                    size="large"
                  />
                  <div className="text-gray-800 text-lg font-semibold mt-3">Blog SEO Score</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <Card
                    title="Suggestions to Beat Competitors"
                    className="bg-white border border-gray-200 rounded-lg shadow-sm"
                    headStyle={{ background: "#f9fafb", fontWeight: 600, fontSize: "1.1rem" }}
                  >
                    <ul className="list-decimal pl-6 space-y-3 text-sm text-gray-700">
                      {analysisResults?.insights.suggestions
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
                    {Object.entries(analysisResults.insights.analysis).map(([key, value]) => {
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
                    })}
                  </Collapse>
                </motion.div>
              </motion.div>
            </TabPane>

            <TabPane tab="Competitors" key="competitors">
              {competitorsList || <Empty description="No competitor data available" />}
            </TabPane>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Recent Project
              </label>
              <Select
                className="w-full rounded-md text-sm"
                onChange={handleProjectSelect}
                value={formData.selectedProject?._id || ""}
                dropdownStyle={{ maxHeight: 200, overflowY: "auto" }}
              >
                <Select.Option value="">Select a project</Select.Option>
                {blogs?.data
                  ?.filter(
                    (project) => project.status === "complete" && project.isArchived === false
                  )
                  .map((project) => (
                    <Select.Option key={project._id} value={project._id}>
                      {project.title.charAt(0).toUpperCase() + project.title.slice(1)}
                    </Select.Option>
                  ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blog Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter your blog title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blog Content</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="w-full h-40 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder={`Enter your blog content in ${formData.contentType} format`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={formData.keywordInput}
                  onChange={handleKeywordInputChange}
                  onKeyDown={handleKeyPress}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Add keywords (comma-separated)"
                />
                <button
                  onClick={handleAddKeyword}
                  className="px-4 py-2 bg-[#1B6FC9]  text-white rounded-md text-sm hover:bg-[#1B6FC9]/90 transition"
                >
                  <Plus />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-500"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(index)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default CompetitiveAnalysisModal
