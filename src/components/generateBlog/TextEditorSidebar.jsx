import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Gem, RotateCcw } from "lucide-react"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { Button, Tooltip, message } from "antd"
import { fetchProofreadingSuggestions } from "@store/slices/blogSlice"
import { fetchCompetitiveAnalysisThunk } from "@store/slices/analysisSlice"

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
}) => {
  const [newKeyword, setNewKeyword] = useState("")
  const [isAnalyzingProofreading, setIsAnalyzingProofreading] = useState(false)
  const [competitiveAnalysisResults, setCompetitiveAnalysisResults] = useState(null)
  const [shouldRunCompetitive, setShouldRunCompetitive] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { handlePopup } = useConfirmPopup()
  const { loading: isAnalyzingCompetitive } = useSelector((state) => state.analysis)

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

      // Extract the payload from the thunk result
      const data = fetchCompetitiveAnalysisThunk.fulfilled.match(resultAction)
        ? resultAction.payload
        : null

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
        .filter((k) => k && !keywords.includes(k)) // prevent duplicates

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
          content: blog.content,
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
        onConfirm: () => navigate("/upgrade"),
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
        onConfirm: () => navigate("/upgrade"),
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
    if (userPlan === "free" || userPlan === "basic") {
      handlePopup({
        title: "Upgrade Required",
        description: "Rewrite is only available for Pro and Enterprise users.",
        confirmText: "Buy Now",
        cancelText: "Cancel",
        onConfirm: () => navigate("/upgrade"),
      })
    } else {
      handlePopup({
        title: "Rewrite Keywords",
        description:
          "Do you want to rewrite the entire content with added keywords? You can rewrite only 3 times.",
        onConfirm: handleSave,
      })
    }
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-80 h-full bg-gradient-to-b from-gray-50 to-gray-100 border-l border-gray-200 shadow-lg p-6 overflow-y-auto"
    >
      {/* Section: Competitor Analysis */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Competitor Analysis</h2>

      {/* Keywords Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-semibold text-gray-800">Keywords</h3>
          {keywords.length > 0 && (
            <Tooltip title="Rewrite Keywords">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleKeywordRewrite}
                className="text-gray-600 hover:text-blue-600"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
            </Tooltip>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <AnimatePresence>
            {keywords.map((keyword) => (
              <motion.span
                key={keyword}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center bg-blue-600 text-white text-sm px-3 py-1 rounded-full"
              >
                {keyword}
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => removeKeyword(keyword)}
                  className="ml-2 text-white hover:text-red-200"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add Keywords (comma-separated)"
            className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addKeywords}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Blog Score */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Blog Score</h3>
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-center gap-3">
          <span className="text-2xl font-bold text-gray-900">{blog?.blogScore || "0"}</span>
          <span className="text-lg text-gray-500">/ 100</span>
        </div>
      </div>

      {/* SEO Score */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-2">SEO Score</h3>
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-center gap-3">
          <span className="text-2xl font-bold text-gray-900">{blog?.seoScore || "0"}</span>
          <span className="text-lg text-gray-500">/ 100</span>
        </div>
      </div>

      {/* Competitive Analysis Button */}
      <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold text-gray-700">CA</span>
          {["free", "basic"].includes(userPlan?.toLowerCase?.()) && (
            <span className="flex items-center gap-1 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-1 rounded-full">
              <Gem className="w-4 h-4" />
              Pro
            </span>
          )}
        </div>
        <Button
          type="primary"
          loading={isAnalyzingCompetitive}
          onClick={handleAnalyzing}
          className="w-full h-10 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700"
        >
          {isAnalyzingCompetitive ? "Analyzing..." : "Run Competitive Analysis"}
        </Button>
      </motion.div>

      {/* Analysis Results */}
      <div className="mb-6">
        {competitiveAnalysisResults && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Analysis Results</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <ul className="list-disc ml-5 mt-1">
                {Object.entries(competitiveAnalysisResults.analysis).map(([key, value]) => (
                  <li key={key} className="mb-1">
                    <strong>{key.replace(/([A-Z])/g, " $1")}: </strong>
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
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Proofreading Section */}
      {activeTab === "normal" && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-2">More Tools</h3>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-md p-4 mb-4"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-gray-700">AA</span>
              {["free", "basic"].includes(userPlan?.toLowerCase?.()) && (
                <span className="flex items-center gap-1 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-1 rounded-full">
                  <Gem className="w-4 h-4" />
                  Pro
                </span>
              )}
            </div>
            <Button
              type="primary"
              onClick={() => handleProofreadingBlog()}
              className="w-full h-10 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              Proofread My Blog
            </Button>
          </motion.div>
          {isAnalyzingProofreading ? (
            <p className="text-sm text-gray-500">Loading Proofreading Results...</p>
          ) : (
            proofreadingResults.length > 0 && (
              <div>
                <h4 className="text-base font-semibold text-gray-800 mb-2">Proofreading Results</h4>
                {proofreadingResults && proofreadingResults.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex justify-end mb-2">
                      <Button
                        type="link"
                        onClick={handleApplyAllSuggestions}
                        className="text-blue-600 text-sm hover:underline"
                        disabled={proofreadingResults.length === 0}
                      >
                        Apply All Suggestions
                      </Button>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-700">
                      {proofreadingResults.map((suggestion, index) => (
                        <li key={index} className="border-b border-gray-200 pb-2">
                          <p>
                            <strong>Original:</strong> {suggestion.original}
                          </p>
                          <p>
                            <strong>Revised:</strong> {suggestion.change}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No suggestions available.</p>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Post Button */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          type="primary"
          htmlType="button"
          onClick={onPost}
          loading={isPosting}
          disabled={isPosting}
          className="w-full h-12 text-base font-semibold rounded-lg bg-green-600 hover:bg-green-700"
        >
          {isPosting ? "Posting..." : posted?.success ? "Re-Post" : "Post"}
        </Button>
      </motion.div>
      {posted?.success && posted?.link && (
        <div className="mt-3 text-center">
          <a
            href={posted.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-sm hover:underline"
          >
            View Post
          </a>
        </div>
      )}
    </motion.div>
  )
}

export default TextEditorSidebar
