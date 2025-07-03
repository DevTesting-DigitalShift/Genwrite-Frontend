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
import { message } from "antd"
import { sendRetryLines } from "@api/blogApi"
import { useSelector } from "react-redux"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"

const HumanizeContent = () => {
  const [inputContent, setInputContent] = useState("")
  const [outputContent, setOutputContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan

  const { handlePopup } = useConfirmPopup()
  const leftPanelRef = useRef()
  const rightPanelRef = useRef()
  const isScrollingSyncRef = useRef(false)

  // Synchronized scrolling function
  const handleScroll = useCallback((source) => {
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

  // Mock API call - replace with your actual API
  const processContent = async (content) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock processing - you would replace this with your actual API call
    const processed = content
      .split("\n")
      .map((line) => {
        if (line.trim()) {
          return `✨ Enhanced: ${line}`
        }
        return line
      })
      .join("\n")

    return `${processed}\n\n🚀 Content has been processed and enhanced using AI technology!\n\nKey improvements:\n• Enhanced readability\n• Improved structure\n• Optimized for engagement\n• SEO-friendly formatting`
  }

  const handleMagicWandClick = () => {
    if (userPlan === "free" || userPlan === "basic") {
      showUpgradePopup()
      return
    }

    handlePopup({
      title: "Confirm Humanize Action",
      description: "This action will deduct 10 credits. Do you want to proceed?",
      confirmText: "Yes, Proceed",
      cancelText: "Cancel",
      onConfirm: handleSubmit,
    })
  }

  const handleSubmit = async () => {
    if (!inputContent.trim()) {
      message.error("Please enter some content to process")
      return
    }

    const payload = {
      contentPart: inputContent.trim(),
      humanizeContent: true,
    }

    setIsLoading(true)
    setOutputContent("")

    try {
      const result = await sendRetryLines(payload)
      setOutputContent(result)
      if (result) {
        message.success("Content processed successfully!")
      } else {
        message.error("No content received from humanize action.")
      } 
    } catch (err) {
        message.error("Failed to process content. Please try again.")
        console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (content, type) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (err) {
      console.error("Failed to copy content")
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
  }

  const handleReset = () => {
    setInputContent("")
    setOutputContent("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Content Processor</h1>
                <p className="text-gray-600">Transform your content with AI-powered processing</p>
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

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Input Content</h2>
          </div>

          <div className="space-y-4">
            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder="Paste or type your content here to process it with AI..."
              className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 text-gray-800 placeholder-gray-500"
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleMagicWandClick}
                disabled={isLoading || !inputContent.trim()}
                className={`flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg ${
                  isLoading || !inputContent.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:from-blue-700 hover:to-purple-700 hover:scale-105"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Process Content
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(inputContent, "original")}
                  disabled={!inputContent.trim()}
                  className="flex items-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Copy original content"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
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

            <div className="grid lg:grid-cols-2 gap-0 h-96">
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
                <div
                  ref={leftPanelRef}
                  onScroll={() => handleScroll("left")}
                  className="flex-1 p-4 overflow-y-auto bg-gray-50/50 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap"
                >
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
                <div
                  ref={rightPanelRef}
                  onScroll={() => handleScroll("right")}
                  className="flex-1 p-4 overflow-y-auto bg-white text-gray-800 text-sm leading-relaxed whitespace-pre-wrap"
                >
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
