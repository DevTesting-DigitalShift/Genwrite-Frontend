import React, { useState, useRef, useCallback } from "react"
import {
  Send,
  Copy,
  Download,
  RefreshCw,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { Button, message } from "antd"
import { useDispatch, useSelector } from "react-redux"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { generateHumanizedContent, resetHumanizeState } from "@store/slices/humanizeSlice"
import LoadingScreen from "@components/UI/LoadingScreen"

const HumanizeContent = () => {
  const [inputContent, setInputContent] = useState("")
  const dispatch = useDispatch()
  const { loading: isLoading, result: outputContent, error } = useSelector(state => state.humanize)
  const user = useSelector(state => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan
  const { handlePopup } = useConfirmPopup()
  const leftPanelRef = useRef()
  const rightPanelRef = useRef()
  const isScrollingSyncRef = useRef(false)

  // Calculate word count
  const wordCount = inputContent.trim().split(/\s+/).filter(Boolean).length

  // Synchronized scrolling function
  const handleScroll = useCallback(source => {
    if (isScrollingSyncRef.current) return

    isScrollingSyncRef.current = true

    const sourcePanel = source === "left" ? leftPanelRef.current : rightPanelRef.current
    const targetPanel = source === "left" ? rightPanelRef.current : leftPanelRef.current

    if (sourcePanel && targetPanel) {
      const scrollPercentage =
        sourcePanel.scrollTop / (sourcePanel.scrollHeight - sourcePanel.clientHeight)
      const targetScrollTop =
        scrollPercentage * (targetPanel.scrollHeight - targetPanel.clientHeight)
      targetPanel.scrollTop = targetScrollTop
    }

    setTimeout(() => {
      isScrollingSyncRef.current = false
    }, 10)
  }, [])

  const showUpgradePopup = () => {
    handlePopup({
      title: "Upgrade Required",
      description: "This feature is available on higher-tier plans. Please upgrade to continue.",
      confirmText: "Upgrade Now",
      cancelText: "Cancel",
      onConfirm: () => {
        // Redirect to upgrade page or handle upgrade logic
        message.info("Redirecting to upgrade page...")
      },
    })
  }

  const handleMagicWandClick = () => {
    if (userPlan === "free" || userPlan === "basic") {
      // showUpgradePopup()
      navigate("/pricing")
      return
    }
    handleSubmit()
  }

  const handleSubmit = async () => {
    if (!inputContent.trim()) {
      message.error("Please enter some content to process")
      return
    }

    const payload = {
      content: inputContent.trim(),
    }

    try {
      const resultAction = await dispatch(generateHumanizedContent(payload)).unwrap()
      if (generateHumanizedContent.fulfilled.match(resultAction)) {
        message.success("Content processed successfully!")
      }
    } catch (err) {
      message.error("Failed to process content. Please try again.")
      console.error(err)
    }
  }

  const handleCopy = async (content, type) => {
    try {
      await navigator.clipboard.writeText(content)
      message.success(
        `${type === "original" ? "Original" : "Processed"} content copied to clipboard`
      )
    } catch (err) {
      console.error("Failed to copy content")
      message.error("Failed to copy content")
    }
  }

  const handleDownload = (content, filename) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success("Content downloaded successfully")
  }

  const handleReset = () => {
    setInputContent("")
    dispatch(resetHumanizeState())
    message.info("Content reset")
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-200px)] p-4 flex items-center justify-center">
        <LoadingScreen />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto space-y-6 p-5">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col gap-2">
            {/* Top row: icon + heading */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Humanize Content</h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Transform your content with AI-powered processing
                </p>
              </div>
            </div>

            {/* Bottom row: reset button aligned right */}
            <div className="flex justify-end">
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

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Input Content</h2>
          </div>
          <div className="space-y-4">
            <textarea
              value={inputContent}
              onChange={e => setInputContent(e.target.value)}
              placeholder="Paste or type your content here (300–500 words)..."
              className="w-full h-60 p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 text-gray-800 placeholder-gray-500"
            />
            <div className="flex justify-end items-center">
              <p
                className={`text-sm mb-2 ${wordCount < 300 ? "text-yellow-500" : "text-green-600"}`}
              >
                Word count: {wordCount} {wordCount < 300 ? "(Minimum 300 words required)" : ""}
              </p>
            </div>
            <Button
              onClick={handleMagicWandClick}
              disabled={isLoading || !inputContent.trim() || wordCount < 300}
              className={`flex items-center justify-center gap-2 px-6 py-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg ${
                !inputContent.trim() || wordCount < 300
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-blue-700 hover:to-purple-700 hover:scale-105"
              }`}
            >
              Process Content
            </Button>
          </div>
        </div>

        {/* Split View Results */}
        {(outputContent || isLoading) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Processing Results
              </h2>
            </div>
            <div className="h-96 overflow-y-auto grid lg:grid-cols-2 gap-0 border border-gray-200 rounded-lg">
              {/* Original Content Panel */}
              <div className="flex flex-col border-r border-gray-200">
                <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    Original Content
                  </h3>
                  <button
                    onClick={() => handleCopy(inputContent, "original")}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Copy original content"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 bg-gray-50/50 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {inputContent}
                </div>
              </div>

              {/* Processed Content Panel */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between p-4 bg-blue-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Processed Content
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(outputContent, "processed")}
                      disabled={!outputContent}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Copy processed content"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(outputContent, "processed-content.txt")}
                      disabled={!outputContent}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Download processed content"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-white text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Processing your content...</p>
                        <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
                      </div>
                    </div>
                  ) : (
                    outputContent
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HumanizeContent
