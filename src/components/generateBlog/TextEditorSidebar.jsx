import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Plus,
  Sparkles,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Zap,
  Target,
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
import { getCategoriesThunk } from "@store/slices/otherSlice"
import CategoriesModal from "@components/CategoriesModal"

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
}) => {
  const [newKeyword, setNewKeyword] = useState("")
  const [isAnalyzingProofreading, setIsAnalyzingProofreading] = useState(false)
  const [competitiveAnalysisResults, setCompetitiveAnalysisResults] = useState(null)
  const [shouldRunCompetitive, setShouldRunCompetitive] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { handlePopup } = useConfirmPopup()
  const { loading: isAnalyzingCompetitive } = useSelector((state) => state.analysis)
  const [open, setOpen] = useState(false)
  const { analysisResult } = useSelector((state) => state.analysis)
  const blogId = blog?._id
  const result = analysisResult?.[blogId]

  useEffect(() => {
    dispatch(getCategoriesThunk()).unwrap()
  }, [dispatch])

  useEffect(() => {
    setCompetitiveAnalysisResults(null)
  }, [blog?._id])

  const fetchCompetitiveAnalysis = useCallback(async () => {
    if (!blog || !blog.title || !blog.content) {
      message.error("Blog title or content is missing for analysis.")
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
      ).unwrap()

      setCompetitiveAnalysisResults(resultAction)
    } catch (err) {
      console.error("Failed to fetch competitive analysis:", {
        error: err.message,
        status: err.status,
        response: err.response,
      })
      message.error("Failed to perform competitive analysis.")
    }
  }, [blog, keywords, dispatch])

  useEffect(() => {
    if (shouldRunCompetitive) {
      fetchCompetitiveAnalysis()
      setShouldRunCompetitive(false)
    }
  }, [shouldRunCompetitive, fetchCompetitiveAnalysis])

  useEffect(() => {
    if (blog?.seoScore || blog?.generatedMetadata?.competitorsAnalysis) {
      setCompetitiveAnalysisResults({
        blogScore: blog.seoScore,
        ...blog?.generatedMetadata?.competitorsAnalysis,
      })
    }
  }, [blog])

  const removeKeyword = useCallback(
    (keyword) => {
      setKeywords((prev) => prev.filter((k) => k !== keyword))
    },
    [setKeywords]
  )

  const addKeywords = useCallback(() => {
    if (newKeyword.trim()) {
      const keywordsToAdd = newKeyword
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k && !keywords.includes(k))
      if (keywordsToAdd.length > 0) {
        setKeywords((prev) => [...prev, ...keywordsToAdd])
        setNewKeyword("")
        message.success("Keywords added successfully!")
      }
    }
  }, [newKeyword, keywords, setKeywords])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        addKeywords()
      }
    },
    [addKeywords]
  )

  const handleProofreadingClick = useCallback(async () => {
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
      message.success("Proofreading suggestions loaded successfully!")
    } catch (error) {
      console.error("Error fetching proofreading suggestions:", {
        error: error.message,
        status: error.status,
        response: error.response,
      })
      message.error("Failed to fetch proofreading suggestions.")
    } finally {
      setIsAnalyzingProofreading(false)
    }
  }, [blog, dispatch, isAnalyzingCompetitive, setProofreadingResults])

  const handleApplyAllSuggestions = useCallback(() => {
    if (proofreadingResults.length === 0) {
      message.info("No suggestions available to apply.")
      return
    }

    proofreadingResults.forEach((suggestion) => {
      handleReplace(suggestion.original, suggestion.change)
    })
    setProofreadingResults([])
    message.success("All proofreading suggestions applied successfully!")
  }, [proofreadingResults, handleReplace, setProofreadingResults])

  const handleAnalyzing = useCallback(() => {
    if (["free", "basic"].includes(userPlan?.toLowerCase?.())) {
      return handlePopup({
        title: "Upgrade Required",
        description: "Competitor Analysis is only available for Pro and Enterprise users.",
        confirmText: "Buy Now",
        cancelText: "Cancel",
        onConfirm: () => navigate("/pricing"),
      })
    }

    const seoScore = blog?.seoScore
    const competitors = blog?.generatedMetadata?.competitors
    const hasScore = typeof seoScore === "number" && seoScore >= 0
    const hasCompetitors = Array.isArray(competitors) && competitors.length > 0
    const hasAnalysis = !!competitiveAnalysisResults

    // Case 1: No data at all — show initial modal
    if (!hasScore && !hasCompetitors && !hasAnalysis) {
      return handlePopup({
        title: "Competitive Analysis",
        description: "Do you really want to run competitive analysis? It will cost 10 credits.",
        confirmText: "Run",
        cancelText: "Cancel",
        onConfirm: () => fetchCompetitiveAnalysis(),
      })
    }

    // Case 2: Any data present — prompt to run again
    return handlePopup({
      title: "Run Competitive Analysis Again?",
      description:
        "You have already performed a competitive analysis for this blog. Would you like to run it again? This will cost 10 credits.",
      confirmText: "Run",
      cancelText: "Cancel",
      onConfirm: () => fetchCompetitiveAnalysis(),
    })
  }, [userPlan, blog, handlePopup, navigate, competitiveAnalysisResults, fetchCompetitiveAnalysis])

  const handleProofreadingBlog = useCallback(() => {
    if (["free", "basic"].includes(userPlan?.toLowerCase?.())) {
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
  }, [userPlan, handlePopup, navigate, handleProofreadingClick])

  const handleKeywordRewrite = useCallback(() => {
    handlePopup({
      title: "Rewrite Keywords",
      description:
        "Do you want to rewrite the entire content with added keywords? You can rewrite only 3 times.",
      onConfirm: handleSave,
    })
  }, [handlePopup, handleSave])

  const getScoreColor = useCallback((score) => {
    if (score >= 80) return "bg-green-100 text-green-700"
    if (score >= 60) return "bg-yellow-100 text-yellow-700"
    return "bg-red-100 text-red-700"
  }, [])

  const handleCategorySubmit = useCallback(
    ({ category, includeTableOfContents }) => {
      try {
        console.log("Posting with data:", {
          ...formData,
          categories: category,
          includeTableOfContents,
        })
        onPost({ ...formData, categories: category, includeTableOfContents })
      } catch (error) {
        console.error("Failed to post blog:", {
          error: error.message,
          status: error.status,
          response: error.response,
        })
        message.error("Failed to post blog. Please try again.")
      }
    },
    [formData, onPost]
  )

  const handlePostClick = useCallback(() => {
    setIsCategoryModalOpen(true)
  }, [])

  const FeatureCard = ({ title, description, isPro, isLoading, onClick, buttonText }) => (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        {isPro && (
          <span className="flex items-center gap-1 text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
            <Crown size={15} />
            Pro
          </span>
        )}
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        disabled={isLoading}
        className={`w-full py-2 text-sm px-4 rounded-lg font-medium transition-all duration-200 ${
          isLoading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
        }`}
        aria-label={buttonText}
      >
        {isLoading ? "Processing..." : buttonText}
      </motion.button>
    </motion.div>
  )

  return (
    <>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="top-0 right-0 w-80 h-full bg-gradient-to-b from-gray-50 to-white border-l border-gray-200 shadow-xl overflow-y-auto z-50"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Content Analysis</h2>
              <p className="text-sm text-gray-600">Optimize your content for better performance</p>
            </div>
            <Tooltip title="Content Enhancements Summary">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(true)}
                className="text-blue-500 hover:text-blue-600"
                aria-label="View content enhancements"
              >
                <SlidersHorizontal size={20} />
              </motion.button>
            </Tooltip>
            <Modal
              title="Content Enhancements Summary"
              open={open}
              onCancel={() => setOpen(false)}
              footer={null}
              centered
            >
              <FeatureSettingsModal features={blog?.options || {}} />
            </Modal>
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
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (["free"].includes(userPlan?.toLowerCase?.())) {
                        openUpgradePopup({ featureName: "Keyword Optimization", navigate })
                      } else {
                        handleKeywordRewrite()
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-opacity-80 transition-colors text-sm font-medium
                    ${
                      ["free"].includes(userPlan?.toLowerCase?.())
                        ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                    aria-label="Optimize keywords"
                  >
                    {["free"].includes(userPlan?.toLowerCase?.()) ? (
                      <Crown size={15} />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Optimize
                  </motion.button>
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
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                    className="flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm px-3 py-1.5 rounded-full shadow-sm hover:shadow-md"
                  >
                    <span className="truncate max-w-[150px]">{keyword}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeKeyword(keyword)}
                      className="ml-2 text-white hover:text-red-200"
                      aria-label={`Remove keyword ${keyword}`}
                    >
                      <X className="w-3 h-3" />
                    </motion.button>
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
                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                aria-label="Add new keywords"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addKeywords}
                className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 hover:shadow-lg"
                aria-label="Add keywords"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
            {keywords.length === 0 && (
              <p className="text-sm text-gray-500 text-center">No keywords added yet</p>
            )}
          </div>

          {/* Scores Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Performance Metrics
            </h3>

            <div className="space-y-4">
              {/* Content Score */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-50 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-1">
                    Content Score
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-lg font-bold ${getScoreColor(
                      blog?.blogScore || 0
                    )}`}
                  >
                    {blog?.blogScore || 0} <span className="text-xs">/100</span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    animate={{ width: `${blog?.blogScore || 0}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-2 rounded-full ${
                      (blog?.blogScore || 0) >= 80
                        ? "bg-green-500"
                        : (blog?.blogScore || 0) >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                </div>
              </motion.div>

              {/* SEO Score */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-gray-50 rounded-xl p-4"
              >
                <div
                  className={`mb-2 ${
                    result?.insights?.blogScore || blog?.seoScore
                      ? "flex items-center justify-between"
                      : ""
                  }`}
                >
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-1">
                    SEO Score
                  </span>

                  {result?.insights?.blogScore || blog?.seoScore ? (
                    <span
                      className={`px-2 py-1 rounded-full text-lg font-bold ${getScoreColor(
                        result?.insights?.blogScore || blog?.seoScore
                      )}`}
                    >
                      {result?.insights?.blogScore || blog?.seoScore}{" "}
                      <span className="text-xs">/100</span>
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-500 italic mt-1 block">
                      Run the Competitive Analysis to get score
                    </span>
                  )}
                </div>

                {result?.insights?.blogScore || blog?.seoScore ? (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      animate={{ width: `${result?.insights?.blogScore || blog?.seoScore}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-2 rounded-full ${
                        (result?.insights?.blogScore || blog?.seoScore) >= 80
                          ? "bg-green-500"
                          : (result?.insights?.blogScore || blog?.seoScore) >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    />
                  </div>
                ) : null}
              </motion.div>
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
              {(result?.competitors || blog?.generatedMetadata?.competitors)?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white shadow-md p-3 rounded-lg border border-gray-200"
                >
                  <span className="text-sm font-medium text-gray-900">Competitors Links:</span>
                  <ul className="list-disc mt-2 list-inside space-y-1 text-sm text-gray-700">
                    {(result?.competitors || blog.generatedMetadata.competitors)?.map(
                      (item, index) => (
                        <li key={index} className="hover:underline hover:text-blue-500 transition">
                          <a
                            href={item.link || item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600"
                          >
                            {item.title}
                          </a>
                        </li>
                      )
                    )}
                  </ul>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
              >
                <div className="space-y-3">
                  {Object.entries(
                    competitiveAnalysisResults?.insights?.analysis ||
                      competitiveAnalysisResults?.analysis ||
                      {}
                  ).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {typeof value === "object" ? (
                            <ul className="list-disc ml-5">
                              {Object.entries(value).map(([subKey, subValue]) => (
                                <li key={subKey}>
                                  <strong>{subKey.replace(/([A-Z])/g, " $1").trim()}: </strong>
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
              </motion.div>
            </div>
          )}

          {/* Proofreading Results */}
          {activeTab === "normal" && (
            <div className="space-y-4">
              {isAnalyzingProofreading ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-500 text-center"
                >
                  Loading Proofreading Results...
                </motion.p>
              ) : (
                proofreadingResults.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Suggestions</h3>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleApplyAllSuggestions}
                        className="text-blue-600 text-sm hover:text-blue-700 font-medium"
                        disabled={proofreadingResults.length === 0}
                        aria-label="Apply all proofreading suggestions"
                      >
                        Apply All
                      </motion.button>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
                    >
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
                    </motion.div>
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
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg"
              }`}
              aria-label={blog?.wordpress ? "Re-post blog" : "Post blog"}
            >
              {isPosting ? "Posting..." : blog?.wordpress ? "Re-Post" : "Post"}
            </Button>
          </motion.div>

          {posted?.link && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 text-center"
            >
              <a
                href={posted.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 text-sm hover:text-blue-700 font-medium"
              >
                View Published Post
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Category Selection Modal */}
      <CategoriesModal
        isCategoryModalOpen={isCategoryModalOpen}
        setIsCategoryModalOpen={setIsCategoryModalOpen}
        onSubmit={handleCategorySubmit}
        initialCategory={formData.category}
        initialIncludeTableOfContents={formData.includeTableOfContents}
      />
    </>
  )
}

const FeatureSettingsModal = ({ features }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 bg-white rounded-lg shadow-sm border-gray-100"
    >
      <div className="grid grid-cols-1 gap-2">
        {Object.entries(features || {}).map(([key, value]) => {
          const isEnabled = Boolean(value)
          return (
            <motion.div
              key={key}
              whileHover={{ backgroundColor: "#f3f4f6" }}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-sm transition-colors duration-150"
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
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default TextEditorSidebar
