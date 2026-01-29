import React, { useState, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { Button, message, Input } from "antd"
import { PlusOutlined, CloseOutlined, CopyOutlined } from "@ant-design/icons"
import { generateMetadataThunk, resetMetadata } from "@store/slices/otherSlice"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { RefreshCw, Sparkles } from "lucide-react"
import ProgressLoadingScreen from "@components/UI/ProgressLoadingScreen"

const { TextArea } = Input

// Helper to detect if input is URL
const isUrl = text => text.trim().startsWith("http")

const GenerateMetaData = () => {
  const [content, setContent] = useState("")
  const [keywords, setKeywords] = useState([])
  const [newKeyword, setNewKeyword] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const userPlan = useSelector(state => state.auth.user?.subscription?.plan)
  const metadata = useSelector(state => state.wordpress.metadata)

  // Calculate word count
  const wordCount = useCallback(() => {
    // If URL, word count is 0 or we can just return a dummy valid number so it doesn't block
    if (isUrl(content)) return 300 // Return sufficient length for URL
    const words = content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
    return words.length
  }, [content])

  const handleGenerateMetadata = useCallback(async () => {
    if (!content.trim()) {
      message.error("Please enter some content to generate metadata.")
      return
    }

    if (!isUrl(content) && content.length < 300) {
      message.error("Content must be at least 300 characters long.")
      return
    }

    if (["free", "basic"].includes(userPlan?.toLowerCase?.())) {
      openUpgradePopup({ featureName: "Metadata Generation", navigate })
      return
    }

    setIsGenerating(true)
    try {
      // If content is URL, send as url param, otherwise content
      const payload = isUrl(content) ? { url: content } : { content }
      await dispatch(generateMetadataThunk(payload)).unwrap()
      message.success("Metadata generated successfully!")
    } catch (error) {
      console.error("Error generating metadata:", error)
      message.error("Failed to generate metadata.")
    } finally {
      setIsGenerating(false)
    }
  }, [content, dispatch, userPlan, navigate])

  const addKeyword = useCallback(() => {
    if (newKeyword.trim()) {
      const newKeywordsArray = newKeyword
        .split(",")
        .map(k => k.trim().toLowerCase())
        .filter(k => k && !keywords.map(kw => kw.toLowerCase()).includes(k))
      if (newKeywordsArray.length > 0) {
        setKeywords(prev => [...prev, ...newKeywordsArray])
      }
      setNewKeyword("")
    }
  }, [newKeyword, keywords])

  const handleKeyDown = useCallback(
    e => {
      if (e.key === "Enter") {
        e.preventDefault()
        addKeyword()
      }
    },
    [addKeyword]
  )

  const removeKeyword = useCallback(keyword => {
    setKeywords(prev => prev.filter(k => k !== keyword))
  }, [])

  const copyToClipboard = (text, label) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        message.success(`${label} copied to clipboard!`)
      })
      .catch(() => {
        message.error(`Failed to copy ${label}.`)
      })
  }

  const handleReset = useCallback(() => {
    setContent("")
    setKeywords([])
    setNewKeyword("")
    dispatch(resetMetadata())
    message.success("Content and metadata reset!")
  }, [dispatch])

  if (isGenerating) {
    return (
      <div className="h-[calc(100vh-200px)] p-4 flex items-center justify-center">
        <ProgressLoadingScreen message="Generating metadata..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-5">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left section */}
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                SEO Metadata Generator
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Create SEO-friendly metadata for your content
              </p>
            </div>
          </div>

          {/* Reset button row for mobile */}
          <div className="flex justify-end mt-2 lg:mt-0 flex-shrink-0">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Reset all content"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-file-text w-5 h-5 text-blue-600"
              >
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                <path d="M10 9H8"></path>
                <path d="M16 13H8"></path>
                <path d="M16 17H8"></path>
              </svg>
              <h2 className="text-xl font-semibold text-gray-900">
                {isUrl(content) ? "Target URL" : "Content"}
              </h2>
            </div>
            {isUrl(content) ? (
              <Input
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Enter URL (e.g., https://example.com/blog)..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <TextArea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste content or enter URL..."
                rows={12}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scroll"
              />
            )}
          </div>

          <div className="flex justify-end items-center">
            <p
              className={`text-sm mb-2 ${wordCount() < 300 ? "text-yellow-500" : "text-green-600"}`}
            >
              {!isUrl(content) && (
                <>
                  Word count: {wordCount()} {wordCount() < 300 ? "(Minimum 60 words required)" : ""}
                </>
              )}
            </p>
          </div>

          <Button
            onClick={() => handleGenerateMetadata()}
            loading={isGenerating}
            disabled={isGenerating || !content.trim() || (!isUrl(content) && content.length < 300)}
            className={`w-full py-3 text-sm font-medium text-white rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg flex items-center justify-center gap-2 ${
              !content.trim() || (!isUrl(content) && content.length < 300)
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {isGenerating ? "Generating..." : "Generate Metadata"}
          </Button>
        </div>

        {metadata && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Meta Title</label>
                <Button
                  type="link"
                  onClick={() => copyToClipboard(metadata.title, "Meta Title")}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 p-0"
                >
                  <CopyOutlined className="w-4 h-4" />
                  Copy
                </Button>
              </div>
              <div className="p-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700">
                {metadata.title || "No title generated"}
                <p className="text-xs text-gray-500 mt-1">
                  {metadata.title?.length || 0}/60 characters
                  {metadata.title?.length > 60 && (
                    <span className="text-red-600 ml-2">Title exceeds 60 characters</span>
                  )}
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                <Button
                  type="link"
                  onClick={() => copyToClipboard(metadata.description, "Meta Description")}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 p-0"
                >
                  <CopyOutlined className="w-4 h-4" />
                  Copy
                </Button>
              </div>
              <div className="p-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700">
                {metadata.description || "No description generated"}
                <p className="text-xs text-gray-500 mt-1">
                  {metadata.description?.length || 0}/160 characters
                  {metadata.description?.length > 160 && (
                    <span className="text-red-600 ml-2">Description exceeds 160 characters</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GenerateMetaData
