import React, { useState, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { Button, message, Input } from "antd"
import { PlusOutlined, CloseOutlined, CopyOutlined } from "@ant-design/icons"
import { generateMetadataThunk, resetMetadata } from "@store/slices/otherSlice"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { openUpgradePopup } from "@utils/UpgardePopUp" // Note: Fix typo to UpgradePopUp
import { RefreshCw, Sparkles } from "lucide-react"

const { TextArea } = Input

const GenerateMetaData = () => {
  const [content, setContent] = useState("")
  const [keywords, setKeywords] = useState([])
  const [newKeyword, setNewKeyword] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const userPlan = useSelector((state) => state.auth.user?.subscription?.plan)
  const metadata = useSelector((state) => state.wordpress.metadata)

  const handleGenerateMetadata = useCallback(async () => {
    if (!content.trim()) {
      message.error("Please enter some content to generate metadata.")
      return
    }

    if (["free", "basic"].includes(userPlan?.toLowerCase?.())) {
      openUpgradePopup({ featureName: "Metadata Generation", navigate })
      return
    }

    setIsGenerating(true)
    try {
      await dispatch(
        generateMetadataThunk({
          content,
          keywords,
          focusKeywords: keywords,
        })
      ).unwrap()
      message.success("Metadata generated successfully!")
    } catch (error) {
      console.error("Error generating metadata:", error)
      message.error("Failed to generate metadata.")
    } finally {
      setIsGenerating(false)
    }
  }, [content, keywords, dispatch, userPlan, navigate])

  const addKeyword = useCallback(() => {
    if (newKeyword.trim()) {
      const newKeywordsArray = newKeyword
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k && !keywords.map((kw) => kw.toLowerCase()).includes(k))
      if (newKeywordsArray.length > 0) {
        setKeywords((prev) => [...prev, ...newKeywordsArray])
      }
      setNewKeyword("")
    }
  }, [newKeyword, keywords])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        addKeyword()
      }
    },
    [addKeyword]
  )

  const removeKeyword = useCallback((keyword) => {
    setKeywords((prev) => prev.filter((k) => k !== keyword))
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-5">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SEO Metadata Generator</h1>
              <p className="text-gray-600">Create SEO-friendly metadata for your content</p>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords (optional)
            </label>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add keywords, separated by commas..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={addKeyword}
                icon={<PlusOutlined />}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.map((keyword, index) => (
                <div
                  key={index}
                  className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full border border-blue-200"
                >
                  <span className="truncate max-w-[120px]">{keyword}</span>
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <CloseOutlined className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            {keywords.length === 0 && (
              <p className="text-xs text-gray-500 text-center mt-2">No keywords added yet</p>
            )}
          </div>

          <Button
            onClick={() =>
              handlePopup({
                title: "Generate Metadata",
                description: `Generate SEO metadata? This will cost 3 credits.`,
                confirmText: "Generate",
                cancelText: "Cancel",
                onConfirm: handleGenerateMetadata,
              })
            }
            loading={isGenerating}
            disabled={isGenerating || !content.trim()}
            className={`w-full py-3 text-sm font-medium text-white rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg ${
              !content.trim() ? "opacity-50 cursor-not-allowed" : ""
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
