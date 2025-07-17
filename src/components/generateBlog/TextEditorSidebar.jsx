import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Plus,
  Gem,
  Sparkles,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Zap,
  Target,
  BarChart3,
  Crown,
  SlidersHorizontal,
} from "lucide-react"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { Button, Modal, Tooltip, message } from "antd"
import { fetchProofreadingSuggestions } from "@store/slices/blogSlice"
import { fetchCompetitiveAnalysisThunk } from "@store/slices/analysisSlice"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import { SettingTwoTone } from "@ant-design/icons"
import { ImEqualizer } from "react-icons/im"

// Popular WordPress categories (limited to 15 for relevance)
const POPULAR_CATEGORIES = [
  "Blogging",
  "Technology",
  "Lifestyle",
  "Travel",
  "Food & Drink",
  "Health & Wellness",
  "Fashion",
  "Business",
  "Education",
  "Entertainment",
  "Photography",
  "Fitness",
  "Marketing",
  "Finance",
  "DIY & Crafts",
]

const AUTO_GENERATED_CATEGORIES = ["AI Trends", "Wellness Tips", "Investment", "Online Learning"]

const TextEditorSidebar = ({
  blog,
  keywords,
  setKeywords,
  onPost,
  activeTab,
  handleReplace,
  setProofreadingResults,
  proofreadingResults,
  handleSave,
  posted,
  isPosting,
  formData,
  setFormData,
}) => {
  const [newKeyword, setNewKeyword] = useState("")
  const [isAnalyzingProofreading, setIsAnalyzingProofreading] = useState(false)
  const [competitiveAnalysisResults, setCompetitiveAnalysisResults] = useState(null)
  const [shouldRunCompetitive, setShouldRunCompetitive] = useState(false)
  const [seoScore, setSeoScore] = useState()
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [errors, setErrors] = useState({ category: false })
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { handlePopup } = useConfirmPopup()
  const { loading: isAnalyzingCompetitive } = useSelector((state) => state.analysis)
  const [open, setOpen] = useState(false)

  const fetchCompetitiveAnalysis = async () => {
    if (!blog || !blog.title || !blog.content) {
      message.error("Blog data is incomplete for analysis.")
      return
    }

    const validKeywords =
      keywords && keywords.length > 0 ? keywords : blog?.focusKeywords || blog.keywords

    try {
      const resultAction = await dispatch(
        fetchCompetitiveAnalysisThunk({
          blogId: blog._id,
          title: blog.title,
          content: blog.content,
          keywords: validKeywords,
        })
      )

      const data = fetchCompetitiveAnalysisThunk.fulfilled.match(resultAction)
        ? resultAction.payload
        : null

      setSeoScore(data?.blogScore)
      setCompetitiveAnalysisResults(data)
    } catch (err) {
      console.error("Failed to fetch competitive analysis:", err)
    }
  }

  useEffect(() => {
    if (shouldRunCompetitive) {
      fetchCompetitiveAnalysis()
      setShouldRunCompetitive(false)
    }
  }, [shouldRunCompetitive])

  useEffect(() => {
    if (blog?.seoScore || blog?.generatedMetadata?.competitorsAnalysis) {
      setCompetitiveAnalysisResults({
        blogScore: blog.seoScore,
        ...blog?.generatedMetadata?.competitorsAnalysis,
      })
    }
  }, [blog])

  const removeKeyword = (keyword) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  const addKeywords = () => {
    if (newKeyword.trim()) {
      const keywordsToAdd = newKeyword
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k && !keywords.includes(k))
      setKeywords([...keywords, ...keywordsToAdd])
      setNewKeyword("")
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeywords()
    }
  }

  const handleProofreadingClick = async () => {
    if (!blog || !blog.content) {
      message.error("Blog content is required for proofreading.")
      return
    }

    if (isAnalyzingCompetitive) {
      message.error(
        "Please wait for Competitive Analysis to complete before starting Proofreading."
      )
      return
    }

    setIsAnalyzingProofreading(true)

    try {
      const result = await dispatch(
        fetchProofreadingSuggestions({
          id: blog._id,
        })
      ).unwrap()
      setProofreadingResults(result)
    } catch (error) {
      console.error("Error fetching proofreading suggestions:", error)
      message.error("Failed to fetch proofreading suggestions.")
    } finally {
      setIsAnalyzingProofreading(false)
    }
  }

  const handleApplyAllSuggestions = () => {
    if (proofreadingResults.length === 0) {
      message.info("No suggestions available to apply.")
      return
    }

    proofreadingResults.forEach((suggestion) => {
      handleReplace(suggestion.original, suggestion.change)
    })
    setProofreadingResults([])
    message.success("All proofreading suggestions applied successfully!")
  }

  const handleAnalyzing = () => {
    if (userPlan === "free" || userPlan === "basic") {
      handlePopup({
        title: "Upgrade Required",
        description: "Competitor Analysis is only available for Pro and Enterprise users.",
        confirmText: "Buy Now",
        cancelText: "Cancel",
        onConfirm: () => navigate("/pricing"),
      })
    } else {
      handlePopup({
        title: "Competitive Analysis",
        description: `Do you really want to run competitive analysis?\nIt will cost 10 credits.`,
        onConfirm: () => setShouldRunCompetitive(true),
      })
    }
  }

  const handleProofreadingBlog = () => {
    if (userPlan === "free" || userPlan === "basic") {
      handlePopup({
        title: "Upgrade Required",
        description: "AI Proofreading is only available for Pro and Enterprise users.",
        confirmText: "Buy Now",
        cancelText: "Cancel",
        onConfirm: () => navigate("/pricing"),
      })
    } else {
      handlePopup({
        title: "AI Proofreading",
        description: `Do you really want to proofread the blog? \nIt will cost ${getEstimatedCost(
          "blog.proofread"
        )} credits.`,
        onConfirm: handleProofreadingClick,
      })
    }
  }

  const handleKeywordRewrite = () => {
    handlePopup({
      title: "Rewrite Keywords",
      description:
        "Do you want to rewrite the entire content with added keywords? You can rewrite only 3 times.",
      onConfirm: handleSave,
    })
  }

  const handleCategoryAdd = (category) => {
    setFormData({ category })
    setErrors({ category: false })
  }

  const handleCategoryRemove = () => {
    setFormData({ category: "" })
  }

  const handlePostClick = () => {
    setIsCategoryModalOpen(true)
  }

  const handleCategorySubmit = () => {
    if (!formData.category) {
      setErrors({ category: true })
      message.error("Please select a category.")
      return
    }
    onPost()
    setIsCategoryModalOpen(false)
    setFormData({ category: "", includeTableOfContents: false }) // Reset formData
    setErrors({ category: false })
  }

  function getScoreColor(score) {
    if (score >= 80) return "bg-green-100 text-green-700"
    if (score >= 60) return "bg-yellow-100 text-yellow-700"
    return "bg-red-100 text-red-700"
  }

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: checked,
    }))
  }

  const FeatureCard = ({ title, description, isPro, isLoading, onClick, buttonText }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        {isPro && (
          <span className="flex items-center gap-1 text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-2 rounded-full">
            <Crown size={15} />
          </span>
        )}
      </div>
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`w-full py-2 text-sm px-4 rounded-lg font-medium transition-all duration-200 ${
          isLoading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
        }`}
      >
        {isLoading ? "Processing..." : buttonText}
      </button>
    </div>
  )

  return (
    <>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-80 h-full bg-gradient-to-b from-gray-50 to-white border-l border-gray-200 shadow-xl overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-1">
            <div>
              <div className="flex justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">Content Analysis</h2>
                <Tooltip title="Content Enhancements Summary">
                  <SlidersHorizontal
                    className="cursor-pointer text-blue-500"
                    size={20}
                    onClick={() => setOpen(true)}
                  />
                </Tooltip>
                <Modal
                  title="Content Enhancements Summary"
                  open={open}
                  onCancel={() => setOpen(false)}
                  footer={null}
                  centered
                >
                  <FeatureSettingsModal features={blog?.options} />
                </Modal>
              </div>
              <p className="text-sm text-gray-600">Optimize your content for better performance</p>
            </div>
          </div>
        </div>

        <div className="p-6 pb-0 space-y-8 bg-white">
          {/* Keywords Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Keywords</h3>
              </div>
              {keywords.length > 0 && (
                <Tooltip title="Rewrite Keywords">
                  <button
                    onClick={() => {
                      if (userPlan === "free") {
                        openUpgradePopup({ featureName: "Keyword Optimization", navigate })
                      } else {
                        handleKeywordRewrite()
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-opacity-80 transition-colors text-sm font-medium
                    ${
                      userPlan === "free"
                        ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    {userPlan === "free" ? <Crown size={15} /> : <Sparkles className="w-4 h-4" />}
                    Optimize
                  </button>
                </Tooltip>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {keywords.map((keyword, index) => (
                  <motion.div
                    key={keyword}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="ml-2 text-white hover:text-red-200 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add keywords (comma-separated)"
                className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addKeywords}
                className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Scores Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Performance Metrics
            </h3>

            <div className="space-y-4">
              {/* Content Score */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Content Score
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(
                      blog?.blogScore || 0
                    )}`}
                  >
                    {blog?.blogScore || 0}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      (blog?.blogScore || 0) >= 80
                        ? "bg-green-500"
                        : (blog?.blogScore || 0) >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${blog?.blogScore || 0}%` }}
                  />
                </div>
              </div>

              {/* SEO Score */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    SEO Score
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(
                      seoScore || blog?.seoScore || 0
                    )}`}
                  >
                    {seoScore || blog?.seoScore || 0}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      (seoScore || blog?.seoScore || 0) >= 80
                        ? "bg-green-500"
                        : (seoScore || blog?.seoScore || 0) >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${seoScore || blog?.seoScore || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Tools */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              AI Tools
            </h3>

            <FeatureCard
              title="Competitive Analysis"
              description="Analyze against competitors"
              isPro={["free", "basic"].includes(userPlan?.toLowerCase?.())}
              isLoading={isAnalyzingCompetitive}
              onClick={handleAnalyzing}
              buttonText={isAnalyzingCompetitive ? "Analyzing..." : "Run Competitive Analysis"}
            />

            {activeTab === "normal" && (
              <FeatureCard
                title="AI Proofreading"
                description="Improve grammar and style"
                isPro={["free", "basic"].includes(userPlan?.toLowerCase?.())}
                isLoading={isAnalyzingProofreading}
                onClick={handleProofreadingBlog}
                buttonText="Proofread Content"
              />
            )}
          </div>

          {/* Analysis Results */}
          {competitiveAnalysisResults && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Analysis Results</h3>
              {blog.referenceLinks.length > 0 && (
                <div className="bg-white shadow-md p-3 rounded-lg border border-gray-200">
                  <span className="text-sm font-medium">Reference Links :</span>
                  <ul className="list-disc mt-2 list-inside space-y-1 text-sm text-gray-700">
                    {blog.referenceLinks.map((link, index) => (
                      <li
                        key={index}
                        className="hover:underline hover:text-blue-500 text-blue-600 transition"
                      >
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="space-y-3">
                  {Object.entries(
                    competitiveAnalysisResults?.insights?.analysis ||
                      competitiveAnalysisResults?.analysis
                  ).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {key.replace(/([A-Z])/g, " $1")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {typeof value === "object" ? (
                            <ul className="list-disc ml-5">
                              {Object.entries(value).map(([subKey, subValue]) => (
                                <li key={subKey}>
                                  <strong>{subKey.replace(/([A-Z])/g, " $1")}: </strong>
                                  {subValue}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            value
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Proofreading Results */}
          {activeTab === "normal" && (
            <div className="space-y-4">
              {isAnalyzingProofreading ? (
                <p className="text-sm text-gray-500">Loading Proofreading Results...</p>
              ) : (
                proofreadingResults.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Suggestions</h3>
                      <button
                        onClick={handleApplyAllSuggestions}
                        className="text-blue-600 text-sm hover:text-blue-700 font-medium"
                        disabled={proofreadingResults.length === 0}
                      >
                        Apply All
                      </button>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                      <div className="space-y-4">
                        {proofreadingResults.map((suggestion, index) => (
                          <div
                            key={index}
                            className="border-b border-gray-100 pb-4 last:border-b-0"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                <span className="text-sm font-medium text-gray-900">Original:</span>
                              </div>
                              <p className="text-sm text-gray-600 bg-red-50 p-2 rounded">
                                {suggestion.original}
                              </p>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium text-gray-900">
                                  Suggested:
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                                {suggestion.change}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )
              )}
            </div>
          )}
        </div>

        {/* Footer - Post Button */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="primary"
              htmlType="button"
              onClick={handlePostClick}
              loading={isPosting}
              disabled={isPosting}
              className={`w-full p-6 rounded-lg text-lg font-semibold text-white transition-all duration-200 ${
                isPosting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600  hover:from-green-600 hover:to-emerald-600 hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
            >
              {isPosting ? "Posting..." : blog?.wordpress ? "Re-Post" : "Post"}
            </Button>
          </motion.div>

          {posted?.success && posted?.link && (
            <div className="mt-3 text-center">
              <a
                href={posted.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 text-sm hover:text-blue-700 font-medium"
              >
                View Published Post
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </motion.div>

      {/* Category Selection Modal */}
      <Modal
        title="Select Category"
        open={isCategoryModalOpen}
        onCancel={() => {
          setIsCategoryModalOpen(false)
          setFormData({ category: "", includeTableOfContents: false })
          setErrors({ category: false })
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setIsCategoryModalOpen(false)
                setFormData({ category: "", includeTableOfContents: false })
                setErrors({ category: false })
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleCategorySubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Confirm
            </Button>
          </div>
        }
        centered
        width={600}
      >
        <div className="p-3 space-y-4">
          {/* Selected Category Chip */}
          {formData.category && (
            <div className="flex flex-wrap gap-2 mb-3 items-center text-center">
              <div className="flex items-center gap-2 px-3 py-1.5 pb-2 bg-blue-500 text-white rounded-full text-sm">
                {formData.category}
                <button onClick={handleCategoryRemove} className="text-white hover:text-gray-200">
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Auto-Generated Categories Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Auto-Generated Categories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto p-3 rounded-md border border-indigo-200 bg-indigo-50">
              {AUTO_GENERATED_CATEGORIES.map((category) => (
                <div
                  key={category}
                  onClick={() => handleCategoryAdd(category)}
                  className={`flex items-center justify-between p-3 rounded-md bg-white border ${
                    errors.category && !formData.category ? "border-red-500" : "border-indigo-300"
                  } text-sm font-medium cursor-pointer transition-all duration-200 ${
                    formData.category === category
                      ? "bg-indigo-100 border-indigo-400"
                      : "hover:bg-indigo-50 hover:border-indigo-400"
                  }`}
                >
                  <span>{category}</span>
                  {formData.category !== category && (
                    <button className="text-indigo-600 hover:text-indigo-700">
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Popular Categories Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Popular Categories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto p-3 rounded-md border border-gray-200 bg-gray-50">
              {POPULAR_CATEGORIES.map((category) => (
                <div
                  key={category}
                  onClick={() => handleCategoryAdd(category)}
                  className={`flex items-center justify-between p-3 rounded-md bg-white border ${
                    errors.category && !formData.category ? "border-red-500" : "border-gray-200"
                  } text-sm font-medium cursor-pointer transition-all duration-200 ${
                    formData.category === category
                      ? "bg-blue-100 border-blue-300"
                      : "hover:bg-blue-50 hover:border-blue-300"
                  }`}
                >
                  <span>{category}</span>
                  {formData.category !== category && (
                    <button className="text-blue-600 hover:text-blue-700">
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.category && (
              <p className="mt-2 text-sm text-red-500">Please select a category</p>
            )}
          </div>

          {/* Table of Contents Toggle */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">
              Include Table of Contents
              <p className="text-xs text-gray-500">Generate a table of contents for each blog.</p>
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="includeTableOfContents"
                checked={formData.includeTableOfContents}
                onChange={handleCheckboxChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]"></div>
            </label>
          </div>
        </div>
      </Modal>
    </>
  )
}

const FeatureSettingsModal = ({ features }) => {
  return (
    <div className="mt-4 bg-white rounded-lg shadow-sm border-gray-100">
      <div className="grid grid-cols-1 gap-2">
        {Object.entries(features).map(([key, value]) => {
          const isEnabled = Boolean(value) // ensures undefined/null are treated as false
          return (
            <div
              key={key}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-sm hover:bg-gray-100 transition-colors duration-150"
              aria-label={`Feature: ${key.replace(/([A-Z])/g, " $1").trim()}, ${
                isEnabled ? "Enabled" : "Disabled"
              }`}
            >
              <span className="text-sm text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <span
                className={`text-sm font-medium ${isEnabled ? "text-blue-600" : "text-gray-500"}`}
              >
                {isEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TextEditorSidebar
