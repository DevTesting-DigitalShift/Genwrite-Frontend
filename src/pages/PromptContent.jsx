import React, { useState, useCallback, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useLocation } from "react-router-dom"
import { Button, message, Input } from "antd"
import { RefreshCw, Sparkles, Copy, Check } from "lucide-react"
import { generatePromptContentThunk, resetMetadata } from "@store/slices/otherSlice"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import ProgressLoadingScreen from "@components/UI/ProgressLoadingScreen"
const { TextArea } = Input

const PromptContent = () => {
  const [content, setContent] = useState("")
  const [prompt, setPrompt] = useState("")
  const [copiedField, setCopiedField] = useState(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { handlePopup } = useConfirmPopup()

  // Redux selectors
  const userPlan = useSelector(state => state.auth.user?.subscription?.plan)
  const {
    data: generatedContent,
    loading: isGenerating,
    error,
  } = useSelector(state => state.wordpress)

  // Clear data on route change or component unmount
  useEffect(() => {
    return () => {
      dispatch(resetMetadata())
    }
  }, [location.pathname, dispatch])

  // Validation functions
  const isPromptValid = prompt.trim().length >= 10
  const isContentValid = content.trim().split(/\s+/).length >= 300
  const canGenerate = isPromptValid && isContentValid && !isGenerating

  const handleGenerateContent = useCallback(async () => {
    if (!isPromptValid) {
      message.error("Prompt must be at least 10 characters long.")
      return
    }

    if (!isContentValid) {
      message.error("Content must be at least 300 words long.")
      return
    }

    if (["free", "basic"].includes(userPlan?.toLowerCase?.())) {
      openUpgradePopup({ featureName: "Content Generation", navigate })
      return
    }

    try {
      await dispatch(generatePromptContentThunk({ prompt, content })).unwrap()
      message.success("Content generated successfully!")
    } catch (error) {
      console.error("Error generating content:", error)
      message.error("Failed to generate content.")
    }
  }, [content, prompt, dispatch, userPlan, navigate, isPromptValid, isContentValid])

  const handleReset = useCallback(() => {
    setContent("")
    setPrompt("")
    dispatch(resetMetadata())
    message.success("Content and prompt reset!")
  }, [dispatch])

  const copyToClipboard = async (text, label, fieldName) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      message.success(`${label} copied to clipboard!`)

      // Reset copy indicator after 2 seconds
      setTimeout(() => {
        setCopiedField(null)
      }, 2000)
    } catch (error) {
      message.error(`Failed to copy ${label}.`)
    }
  }

  // Helper function to strip HTML tags and get plain text
  const stripHtml = html => {
    const tmp = document.createElement("div")
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ""
  }

  // Helper function to render HTML content safely
  const renderHtmlContent = htmlContent => {
    return (
      <div
        className="prose max-w-none p-4 bg-gray-50 rounded-lg border"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{ lineHeight: "1.6", color: "#374151" }}
      />
    )
  }

  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length
  const promptLength = prompt.trim().length

  if (isGenerating) {
    return (
      <div className="h-[calc(100vh-200px)] p-4 flex items-center justify-center">
        <ProgressLoadingScreen message="Generating content..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-5">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Content from Prompts</h1>
              <p className="text-gray-600">
                Transform your ideas into ready-to-publish content in seconds.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Reset all content"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="space-y-4">
          {/* Prompt Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
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
                <h2 className="text-xl font-semibold text-gray-900">Prompt</h2>
              </div>
              <span className={`text-sm ${promptLength >= 10 ? "text-green-600" : "text-red-500"}`}>
                {promptLength}/10 minimum
              </span>
            </div>
            <TextArea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Enter your prompt here (e.g., 'Humanize this content to make it more engaging')..."
              rows={4}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scroll ${
                prompt.trim() && !isPromptValid ? "border-red-300" : "border-gray-300"
              }`}
            />
          </div>

          {/* Content Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
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
                <h2 className="text-xl font-semibold text-gray-900">Content</h2>
              </div>
              <span className={`text-sm ${wordCount >= 300 ? "text-green-600" : "text-red-500"}`}>
                {wordCount}/300 words minimum
              </span>
            </div>
            <TextArea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Enter your content here (minimum 300 words)..."
              rows={12}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scroll ${
                content.trim() && !isContentValid ? "border-red-300" : "border-gray-300"
              }`}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={() => handleGenerateContent()}
            loading={isGenerating}
            disabled={!canGenerate}
            className={`w-full py-3 text-sm font-medium text-white rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg flex items-center justify-center gap-2 ${
              !canGenerate ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isGenerating ? "Generating..." : "Generate Content"}
          </Button>
        </div>
      </div>

      {/* Generated Content Display */}
      {generatedContent?.data && !isGenerating && (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Generated Content</h2>
            </div>
            <button
              onClick={() =>
                copyToClipboard(stripHtml(generatedContent.data), "Generated content", "generated")
              }
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              title="Copy generated content"
            >
              {copiedField === "generated" ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Render HTML content in a humanized way */}
          {renderHtmlContent(generatedContent.data)}
        </div>
      )}

      {/* Error State */}
      {error && !isGenerating && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}
    </div>
  )
}

export default PromptContent
