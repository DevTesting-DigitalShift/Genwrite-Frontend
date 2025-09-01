import React, { useState, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { Button, message, Input } from "antd"
import { RefreshCw, Sparkles } from "lucide-react"
import { generatePromptContentThunk, resetMetadata } from "@store/slices/otherSlice"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { openUpgradePopup } from "@utils/UpgardePopUp"

const { TextArea } = Input

const PromptContent = ({ setEditorContent, setHumanizedContent, setShowDiff }) => {
  const [content, setContent] = useState("")
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const userPlan = useSelector((state) => state.auth.user?.subscription?.plan)
  const metadata = useSelector((state) => state.wordpress.metadata)
  const humanizedContent = useSelector((state) => state.wordpress.data) // Store humanized content

  const handleGenerateContent = useCallback(async () => {
    if (!content.trim() || !prompt.trim()) {
      message.error("Please enter both a prompt and content.")
      return
    }

    if (["free", "basic"].includes(userPlan?.toLowerCase?.())) {
      openUpgradePopup({ featureName: "Content Generation", navigate })
      return
    }

    setIsGenerating(true)
    try {
      const result = await dispatch(generatePromptContentThunk({ prompt, content })).unwrap()
      message.success("Content generated successfully!")
      setEditorContent(content) // Store original content for diff
      setHumanizedContent(result.content) // Store generated content
      setShowDiff(true) // Enable Diff tab
    } catch (error) {
      console.error("Error generating content:", error)
      message.error("Failed to generate content.")
    } finally {
      setIsGenerating(false)
    }
  }, [
    content,
    prompt,
    dispatch,
    userPlan,
    navigate,
    setEditorContent,
    setHumanizedContent,
    setShowDiff,
  ])

  const handleReset = useCallback(() => {
    setContent("")
    setPrompt("")
    dispatch(resetMetadata())
    setShowDiff(false)
    setHumanizedContent("")
    setEditorContent("")
    message.success("Content and prompt reset!")
  }, [dispatch, setShowDiff, setHumanizedContent, setEditorContent])

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

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-5">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Prompt to Content Generate</h1>
              <p className="text-gray-600">Generate humanized content and SEO-friendly metadata</p>
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
              <h2 className="text-xl font-semibold text-gray-900">Prompt</h2>
            </div>
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here (e.g., 'Humanize this content to make it more engaging')..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scroll"
            />
          </div>
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
              <h2 className="text-xl font-semibold text-gray-900">Content</h2>
            </div>
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your content here..."
              rows={12}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scroll"
            />
          </div>

          <Button
            onClick={() =>
              handlePopup({
                title: "Generate Content",
                description: `Generate humanized content? This will cost 3 credits.`,
                confirmText: "Generate",
                cancelText: "Cancel",
                onConfirm: handleGenerateContent,
              })
            }
            loading={isGenerating}
            disabled={isGenerating || !content.trim() || !prompt.trim()}
            className={`w-full py-3 text-sm font-medium text-white rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg ${
              !content.trim() || !prompt.trim() ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isGenerating ? "Generating..." : "Generate Content"}
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

export default PromptContent
