import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { toast } from "react-toastify"
import axiosInstance from "../../api"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { Collapse, Card, Progress } from "antd"
import { motion } from "framer-motion"

// Ensure axiosInstance always sends the auth token
if (typeof window !== "undefined" && axiosInstance && !axiosInstance._authInterceptorSet) {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers = config.headers || {}
        config.headers["Authorization"] = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )
  axiosInstance._authInterceptorSet = true
}

const { Panel } = Collapse

const CompetitiveAnalysisModal = ({ closefnc }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    keywords: [],
    keywordInput: "",
    contentType: "text", // or "markdown"
    selectedProject: null,
  })

  const [recentProjects, setRecentProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)

  const { handlePopup } = useConfirmPopup()
  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        const response = await axiosInstance.get("/blogs")
        const allBlogs = response.data
        const recentBlogs = allBlogs.slice(-10).reverse()
        setRecentProjects(recentBlogs)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching recent projects:", error)
        toast.error("Failed to load recent projects")
        setIsLoading(false)
      }
    }

    fetchRecentProjects()
  }, [])

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
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a blog title")
      return
    }
    if (!formData.content.trim()) {
      toast.error("Please enter blog content")
      return
    }
    if (formData.keywords.length === 0) {
      toast.error("Please add at least one keyword")
      return
    }

    handlePopup({
      title: "Analyse the competitors",
      description: (
        <p>
          Competitors Analysis cost: <b>{getEstimatedCost("analysis.competitors")} credits</b>
          <br />
          Do you wish to proceed ?
        </p>
      ),
      onConfirm: async () => {
        setIsAnalyzing(true)
        try {
          const response = await axiosInstance.post("/analysis/run", {
            title: formData.title,
            content: formData.content,
            keywords: formData.keywords,
            contentType: formData.contentType,
            blogId: formData?.selectedProject?._id,
          })

          if (response.data) {
            console.log(response.data)
            setAnalysisResults(response.data)
            toast.success("Analysis completed successfully!")
          }
        } catch (error) {
          console.error("Error performing competitive analysis:", error)
          toast.error("Failed to perform competitive analysis")
        } finally {
          setIsAnalyzing(false)
        }
      },
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="w-[800px] bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Competitive Analysis</h2>
          <button onClick={closefnc} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto">
          <div className="space-y-6">
            {!analysisResults ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Recent Project
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 max-h-[200px] overflow-y-auto"
                    onChange={(e) => {
                      const project = recentProjects.find((p) => p._id === e.target.value)
                      if (project) handleProjectSelect(project)
                    }}
                    value={formData.selectedProject?._id || ""}
                  >
                    <option value="">Select a project</option>
                    {recentProjects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
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
                    percent={parseInt(analysisResults.blogScore || 0)}
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
                    <p className="text-gray-700 text-sm whitespace-pre-line">
                      {analysisResults.suggestions}
                    </p>
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
                    {Object.entries(analysisResults.analysis).map(([key, value]) => {
                      // Extract "16/20" and description
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
                                  {score?.replace("/", " / ")}
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
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={closefnc}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          {!analysisResults && (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CompetitiveAnalysisModal
