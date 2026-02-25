import React, { useState, useRef, useCallback, useEffect } from "react"
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
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import useHumanizeStore from "@store/useHumanizeStore"
import useAuthStore from "@store/useAuthStore"
import { useHumanizeMutation } from "@api/queries/humanizeQueries"
import ProgressLoadingScreen from "@components/ui/ProgressLoadingScreen"
import { Helmet } from "react-helmet"

const HumanizeContent = () => {
  const navigate = useNavigate()
  const [inputContent, setInputContent] = useState("")
  const { result: outputContent, resetHumanizeState } = useHumanizeStore()
  const { mutate: generateContent, isPending } = useHumanizeMutation()

  const { user } = useAuthStore()
  const userPlan = user?.plan ?? user?.subscription?.plan
  const { handlePopup } = useConfirmPopup()
  const leftPanelRef = useRef()
  const rightPanelRef = useRef()
  const isScrollingSyncRef = useRef(false)

  // Cleanup on unmount - reset state when user leaves the page
  useEffect(() => {
    return () => {
      resetHumanizeState()
      setInputContent("")
    }
  }, [])

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
        toast.info("Redirecting to upgrade page...")
        navigate("/pricing")
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
      toast.error("Please enter some content to process")
      return
    }

    const payload = { content: inputContent.trim() }

    generateContent(payload, {
      onSuccess: () => {
        toast.success("Content processed successfully!")
      },
      onError: err => {
        toast.error("Failed to process content. Please try again.")
        console.error(err)
      },
    })
  }

  const handleCopy = async (content, type) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success(`${type === "original" ? "Original" : "Processed"} content copied to clipboard`)
    } catch (err) {
      console.error("Failed to copy content")
      toast.error("Failed to copy content")
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
    toast.success("Content downloaded successfully")
  }

  const handleReset = () => {
    setInputContent("")
    resetHumanizeState()
    toast.info("Content reset")
  }

  if (isPending) {
    return (
      <div className="h-[calc(100vh-200px)] p-4 flex items-center justify-center">
        <ProgressLoadingScreen message="Humanizing your content..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Humanize Content | GenWrite</title>
        <meta
          name="description"
          content="Humanize AI-generated content to bypass AI detectors and engage readers."
        />
      </Helmet>
      <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-10">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col gap-2">
            {/* Top row: icon + heading */}
            <div className="flex justify-between items-center gap-3">
              <div className="flex gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Humanize Content</h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Transform your content with AI-powered processing
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-300"
                title="Reset all content"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Input Card */}
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
            <button
              onClick={handleMagicWandClick}
              disabled={isPending || !inputContent.trim() || wordCount < 300}
              className={`flex items-center justify-center gap-2 px-6 py-3 w-full bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg ${
                !inputContent.trim() || wordCount < 300
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-blue-700 hover:to-purple-700 hover:scale-105"
              }`}
            >
              Process Content
            </button>
          </div>
        </div>

        {/* Results Section */}
        {(outputContent || isPending) && (
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
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      Original Content
                    </h3>
                    {outputContent?.originalHumanizationScore && (
                      <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">
                        Score: {outputContent.originalHumanizationScore}
                      </span>
                    )}
                  </div>
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
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Processed Content
                    </h3>
                    {outputContent?.rewrittenHumanizationScore && (
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                        Score: {outputContent.rewrittenHumanizationScore}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(outputContent?.rewrittenContent, "processed")}
                      disabled={!outputContent?.rewrittenContent}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Copy processed content"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleDownload(outputContent?.rewrittenContent, "processed-content.txt")
                      }
                      disabled={!outputContent?.rewrittenContent}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Download processed content"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-white text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {isPending ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Processing your content...</p>
                        <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
                      </div>
                    </div>
                  ) : (
                    outputContent?.rewrittenContent
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
