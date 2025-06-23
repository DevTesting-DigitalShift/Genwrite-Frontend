import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Gem } from "lucide-react"
import { toast } from "react-toastify"
import axiosInstance from "@api/index"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { Button } from "antd"

const TextEditorSidebar = ({
  blog,
  keywords,
  setKeywords,
  onPost,
  activeTab,
  handleReplace,
  setProofreadingResults,
  proofreadingResults,
}) => {
  const [newKeyword, setNewKeyword] = useState("")
  const [isPosting, setIsPosting] = useState(false)
  const [isAnalyzingCompetitive, setIsAnalyzingCompetitive] = useState(false)
  const [isAnalyzingProofreading, setIsAnalyzingProofreading] = useState(false)
  const [competitiveAnalysisResults, setCompetitiveAnalysisResults] = useState(null)
  const [shouldRunCompetitive, setShouldRunCompetitive] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan
  const { handlePopup } = useConfirmPopup()
  const [postRes, setPostRes] = useState()
  const navigate = useNavigate()

  const fetchCompetitiveAnalysis = async () => {
    if (!blog || !blog.title || !blog.content) {
      toast.error("Blog data is incomplete for analysis.")
      return
    }

    const validKeywords =
      keywords && keywords.length > 0 ? keywords : blog?.focusKeywords || blog.keywords

    setIsAnalyzingCompetitive(true)
    try {
      const response = await axiosInstance.post("/analysis/run", {
        blogId: blog._id,
        title: blog.title,
        content: blog.content,
        keywords: validKeywords,
        contentType: "markdown",
      })
      setCompetitiveAnalysisResults(response.data)
      toast.success("Competitive analysis completed successfully!")
    } catch (error) {
      console.error("Error fetching competitive analysis:", error)
      toast.error("Failed to fetch competitive analysis.")
    } finally {
      setIsAnalyzingCompetitive(false)
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
        .filter((k) => k)
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

  const handlePostClick = async () => {
    setIsPosting(true)
    try {
      const response = await axiosInstance.post("/wordpress/post", {
        wpLink: "http://localhost/wordpress",
        blogId: blog._id,
      })

      setPostRes(response?.status)

      if (response.status === 200) {
        toast.success("Blog posted to WordPress successfully!")
      } else {
        toast.error(response.data.message || "Failed to post blog to WordPress.")
      }
    } catch (error) {
      console.error("Error posting blog to WordPress:", error)
      toast.error(error.response?.data?.message || "Failed to post blog to WordPress.")
    } finally {
      setIsPosting(false)
    }
  }

  const handleProofreadingClick = async () => {
    if (!blog || !blog.content) {
      toast.error("Blog content is required for proofreading.")
      return
    }

    if (isAnalyzingCompetitive) {
      toast.error("Please wait for Competitive Analysis to complete before starting Proofreading.")
      return
    }

    setIsAnalyzingProofreading(true)
    setProofreadingResults([]) // Clear previous suggestions in parent state

    try {
      const result = await axiosInstance.post("/blogs/proofread", {
        content: blog.content,
        message: "working fine",
      })

      if (result.data && Array.isArray(result.data.suggestions)) {
        setProofreadingResults(result.data.suggestions) // Update parent state
        toast.success("Proofreading suggestions received!")
      } else {
        toast.error("Invalid proofreading suggestions format.")
      }
    } catch (error) {
      console.error("Error getting proofreading suggestions:", error)
      toast.error("Failed to fetch proofreading suggestions.")
    } finally {
      setIsAnalyzingProofreading(false)
    }
  }

  const handleApplyAllSuggestions = () => {
    if (proofreadingResults.length === 0) {
      toast.info("No suggestions available to apply.")
      return
    }

    proofreadingResults.forEach((suggestion) => {
      handleReplace(suggestion.original, suggestion.change)
    })
    setProofreadingResults([]) // Clear all suggestions after applying
    toast.success("All proofreading suggestions applied successfully!")
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
        description: `Do you really want to run competitive analysis?\nIt will be of 10 credits.`,
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
        description: `Do you really want to proofread the blog? \nIt will be ${getEstimatedCost(
          "blog.proofread"
        )} credits.`,
        onConfirm: handleProofreadingClick,
      })
    }
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, visualDuration: 1 }}
      className="w-80 p-4 border-l bg-gray-50 overflow-y-auto relative"
    >
      <h2 className="font-semibold text-lg mb-2 text-gray-800">Competitor Analysis</h2>
      <div className="mb-6">
        <h3 className="font-semibold mb-1 text-gray-700">Keywords</h3>
        <div className="flex flex-wrap mb-1">
          <AnimatePresence>
            {keywords.map((keyword) => (
              <motion.span
                key={keyword}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center bg-blue-600 text-white px-2 py-1 rounded-md mr-2 mb-1"
              >
                {keyword}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeKeyword(keyword)}
                  className="ml-1"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        <div className="flex mb-4">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add Keywords"
            className="flex-grow px-2 py-1 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addKeywords}
            className="bg-blue-600 text-white px-2 py-1 rounded-r-md"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <div className="mb-3">
        <h3 className="font-semibold mb-2 text-gray-700">Blog Score</h3>
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-center gap-4">
          <span className="text-2xl font-bold text-gray-800">
            {competitiveAnalysisResults?.blogScore || "0"}
          </span>
          <span className="text-2xl font-bold text-gray-600">/ 100</span>
        </div>
      </div>

      <div className="mb-3">
        <h3 className="font-semibold mb-2 text-gray-700">SEO Score</h3>
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-center gap-4">
          <span className="text-2xl font-bold text-gray-800">
            {competitiveAnalysisResults?.seoScore || "0"}
          </span>
          <span className="text-2xl font-bold text-gray-600">/ 100</span>
        </div>
      </div>

      <div className="mb-3 mt-3">
        <h3 className="font-semibold mb-2 text-gray-700">Analysis Results</h3>
        {isAnalyzingCompetitive ? (
          <p className="text-sm text-gray-500">Analyzing Competitive Analysis...</p>
        ) : competitiveAnalysisResults ? (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="mt-2 space-y-3">
              {competitiveAnalysisResults.analysis && (
                <div className="text-sm text-gray-600">
                  <strong>Analysis:</strong>
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
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No analysis available yet.</p>
        )}
      </div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-lg shadow-md p-4 mb-1 relative mt-3"
      >
        <div className="flex justify-between mb-5">
          <span className="text-2xl font-bold text-gray-400 mb-1 block">CA</span>
          {["free", "basic"].includes(userPlan?.toLowerCase?.()) && (
            <span className="flex items-center gap-2 rounded-md text-white font-semibold border p-1 px-2 bg-gradient-to-tr from-blue-500 to-purple-500 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out animate-pulse backdrop-blur-sm text-lg">
              <Gem className="w-4 h-4 animate-bounce" />
              Pro
            </span>
          )}
        </div>
        <Button
          type="primary"
          loading={isAnalyzingCompetitive}
          onClick={handleAnalyzing}
          className="w-full pb-1"
        >
          {isAnalyzingCompetitive ? "Analyzing..." : "Run Competitive Analysis"}
        </Button>
      </motion.div>
      {activeTab === "normal" && (
        <div className="my-3">
          <h3 className="font-semibold mb-2 text-gray-700">More Tools</h3>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-md p-4 mb-1 relative"
          >
            <div className="flex justify-between mb-5">
              <span className="text-2xl font-bold text-gray-400 mb-1 block">AA</span>
              {["free", "basic"].includes(userPlan?.toLowerCase?.()) && (
                <span className="flex items-center gap-2 rounded-md text-white font-semibold border p-1 px-2 bg-gradient-to-tr from-blue-500 to-purple-500 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out animate-pulse backdrop-blur-sm text-lg">
                  <Gem className="w-4 h-4 animate-bounce" />
                  Pro
                </span>
              )}
            </div>
            <Button type="primary" onClick={() => handleProofreadingBlog()} className="w-full pb-1">
              Proofreading my blog
            </Button>
          </motion.div>
          {isAnalyzingProofreading ? (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Loading Proofreading Results...</p>
            </div>
          ) : (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-800 mb-2">Proofreading Results:</h4>
              {proofreadingResults && proofreadingResults.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-end">
                    <Button
                      type="link"
                      onClick={handleApplyAllSuggestions}
                      className="underline"
                      disabled={proofreadingResults.length === 0}
                    >
                      Apply All Suggestions
                    </Button>
                  </div>

                  <ul className="list-disc ml-5">
                    {proofreadingResults.map((suggestion, index) => (
                      <li key={index} className="mb-2">
                        <p className="text-sm text-gray-700">
                          <strong>Original:</strong> {suggestion.original}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>Revised:</strong> {suggestion.change}
                        </p>
                        {/* <Button
                          type="link"
                          onClick={() => handleReplace(suggestion.original, suggestion.change)}
                          className="mt-1"
                        >
                          Apply Suggestion
                        </Button> */}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No suggestions available.</p>
              )}
            </div>
          )}
        </div>
      )}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
        <Button
          type="primary"
          htmlType="button"
          onClick={onPost}
          loading={isPosting}
          disabled={isPosting}
          className="w-full mt-4 rounded-md shadow-md py-1"
        >
          {isPosting ? "Posting..." : postRes === 200 ? "Re-Post" : "Post"}
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default TextEditorSidebar
