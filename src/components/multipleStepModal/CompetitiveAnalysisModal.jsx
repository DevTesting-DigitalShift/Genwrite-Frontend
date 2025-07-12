import { useState, useEffect } from "react"
import { Loader, X } from "lucide-react"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { Collapse, Card, Progress, message, Modal, Select } from "antd"
import { motion } from "framer-motion"
import { fetchAllBlogs } from "@store/slices/blogSlice"
import { useDispatch, useSelector } from "react-redux"
import { fetchCompetitiveAnalysisThunk } from "@store/slices/analysisSlice"
import { LoadingOutlined } from "@ant-design/icons"

const { Panel } = Collapse

const CompetitiveAnalysisModal = ({ closeFnc, open, blogs }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    keywords: [],
    keywordInput: "",
    contentType: "text",
    selectedProject: null,
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)
  const { handlePopup } = useConfirmPopup()
  const dispatch = useDispatch()
  const {
    analysis,
    error: analysisError,
    loading: analysisLoading,
  } = useSelector((state) => state.analysis)

  useEffect(() => {
    dispatch(fetchAllBlogs())
  }, [dispatch])

  // Handle API response or error
  useEffect(() => {
    if (isAnalyzing && !analysisLoading) {
      if (analysis) {
        setIsAnalyzing(false)
      } else if (analysisError) {
        console.error("Analysis error:", analysisError)
        message.error(analysisError || "Failed to perform competitive analysis. Please try again.")
        setIsAnalyzing(false)
      } else {
        console.warn("Unexpected state: analysis and analysisError are both null")
        setIsAnalyzing(false) // Fallback to prevent infinite loading
      }
    }
  }, [analysis, analysisError, analysisLoading, isAnalyzing])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProjectSelect = (project) => {
    setFormData((prev) => ({
      ...prev,
      title: project.title,
      content: project.content,
      keywords: project.focusKeywords || [],
      selectedProject: project,
      contentType: "markdown",
    }))
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
      title: "Analysis the competitors",
      description: (
        <p>
          Competitors Analysis cost: <b>{getEstimatedCost("analysis.competitors")} credits</b>
          <br />
          Do you wish to proceed?
        </p>
      ),
      onConfirm: async () => {
        setIsAnalyzing(true)
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

          // Store in variable
          const analysisData = result

          setAnalysisResults(analysisData)
        } catch (err) {
          console.error("Error fetching analysis:", err)
        } finally {
          setIsAnalyzing(false)
        }
      },
    })
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto" // Cleanup on unmount
    }
  }, [open])

  return (
    <Modal
      open={open}
      title="Competitive Analysis"
      onCancel={closeFnc}
      footer={[
        <div className="flex justify-end gap-3">
          <button
            onClick={closeFnc}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
          {!analysisResults && (
            <button
              onClick={handleSubmit}
              className={`px-4 py-2 text-sm font-medium text-white bg-[#1B6FC9] rounded-md hover:bg-[#1B6FC9]/90 transition 
      ${isAnalyzing || analysisLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isAnalyzing || analysisLoading}
            >
              {isAnalyzing || analysisLoading ? "Analyzing..." : "Analyze"}
            </button>
          )}
        </div>,
      ]}
      width={800}
      bodyStyle={{
        maxHeight: "80vh", // or any height like "600px"
        overflowY: "auto",
        padding: 0, // Optional: remove default padding if you're using Tailwind padding inside
      }}
      centered
      // bodyStyle={{ maxHeight: "80vh", overflowY: "auto", padding: 0 }}
      closable={true}
      transitionName=""
      maskTransitionName=""
    >
      <div className="mt-3 p-4">
        {isAnalyzing || analysisLoading ? (
          <div className="flex flex-col justify-center items-center min-h-[70vh] bg-white">
            <div className="relative flex flex-col items-center">
              {/* Spinner with Gradient Animation */}
              <div className="relative w-16 h-16">
                {/* Spinner icon with transparent stroke */}
                <Loader
                  className="w-16 h-16 text-transparent animate-spin"
                  style={{ stroke: "url(#spinnerGradient)" }}
                />
                {/* Define gradient */}
                <svg className="absolute inset-0 w-0 h-0">
                  <defs>
                    <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1B6FC9" stopOpacity="1" />
                      <stop offset="100%" stopColor="#4C9FE8" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Optional label */}
              <p className="text-sm text-gray-500 mt-4">Analyzing your content...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!analysisResults ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Recent Project
                  </label>
                  <Select
                    className="w-full rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 max-h-[200px] overflow-y-auto"
                    onChange={(value) => {
                      const project = blogs.find((p) => p._id === value)
                      if (project) handleProjectSelect(project)
                    }}
                    value={formData.selectedProject?._id || ""}
                  >
                    <Option value="">Select a project</Option>
                    {blogs.map((project) => (
                      <Option key={project._id} value={project._id}>
                        {project.title}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blog Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your blog title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blog Content
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter your blog content in ${formData.contentType} format`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.keywordInput}
                      onChange={handleKeywordInputChange}
                      onKeyDown={handleKeyPress}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add keywords (comma-separated)"
                    />
                    <button
                      onClick={handleAddKeyword}
                      className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm hover:bg-[#1B6FC9]/90"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(index)}
                          className="ml-1.5 flex-shrink-0 text-indigo-400 hover:text-indigo-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="space-y-4"
              >
                {/* Blog Score Progress */}
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
                    strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
                    trailColor="#d1d5db"
                  />
                  <div className="text-gray-700 text-base font-semibold mb-2">Blog SEO Score</div>
                </motion.div>

                {/* Suggestions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <Card
                    title="Suggestions to Beat Competitors"
                    className="bg-gray-50 border border-gray-200 rounded-lg"
                    headStyle={{ background: "#f9fafb", fontWeight: 600 }}
                  >
                    <ul className="list-decimal pl-6 space-y-2 text-sm text-gray-700">
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

                {/* Detailed Analysis */}
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
                                <span className="text-sm text-center w-[10ch] font-semibold text-blue-700 bg-gray-100 tracking-wide px-2 py-0.5 rounded-md">
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
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default CompetitiveAnalysisModal
