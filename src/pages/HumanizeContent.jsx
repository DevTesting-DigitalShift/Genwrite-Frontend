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
  GitCompare,
} from "lucide-react"
import ReactDiffViewer from "react-diff-viewer-continued"
import { toast } from "sonner"
import { useNavigate, useLocation } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import useHumanizeStore from "@store/useHumanizeStore"
import useAuthStore from "@store/useAuthStore"
import { useHumanizeMutation } from "@api/queries/humanizeQueries"
import ProgressLoadingScreen from "@components/ui/ProgressLoadingScreen"
import { Helmet } from "react-helmet"
import ConnectedTools from "@components/ConnectedTools"

const HumanizeContent = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [inputContent, setInputContent] = useState(location.state?.transferValue || "")
  const { result: outputContent, resetHumanizeState } = useHumanizeStore()
  const { mutate: generateContent, isPending } = useHumanizeMutation()

  const { user } = useAuthStore()
  const userPlan = user?.plan ?? user?.subscription?.plan
  const { handlePopup } = useConfirmPopup()
  const leftPanelRef = useRef()
  const rightPanelRef = useRef()
  const isScrollingSyncRef = useRef(false)
  const [isDiffView, setIsDiffView] = useState(false)

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

    if (wordCount < 100) {
      toast.error("Content must be at least 100 words long.")
      return
    }

    if (wordCount > 1000) {
      toast.error("Content must not exceed 1000 words.")
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
    setIsDiffView(false)
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
      <div className="max-w-7xl mx-auto space-y-8 p-3 md:p-10 mt-6 md:mt-0">
        <div className="bg-white rounded-xl shadow-none border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Humanize Content</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Transform your content with AI-powered processing
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="shrink-0 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
              title="Reset all content"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-xl shadow-none border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Input Content</h2>
          </div>
          <div className="space-y-4">
            <textarea
              value={inputContent}
              onChange={e => setInputContent(e.target.value)}
              placeholder="Paste or type your content here (100–1000 words)..."
              className={`w-full h-60 p-4 border-2 ${
                wordCount > 1000 ? "border-red-500" : "border-transparent"
              } bg-gray-50 rounded-xl resize-none focus:border-primary focus:ring-0 outline-none transition-all duration-300 text-gray-800 placeholder-gray-400 font-medium`}
            />
            <div className="flex justify-end items-center">
              <p
                className={`text-sm mb-2 ${
                  wordCount < 100 ? "text-yellow-500" : wordCount > 1000 ? "text-red-600 font-bold" : "text-green-600"
                }`}
              >
                Word count: {wordCount}{" "}
                {wordCount < 100
                  ? "(Minimum 100 words required)"
                  : wordCount > 1000
                    ? "(Maximum limit exceeded! Please reduce content.)"
                    : ""}
              </p>
            </div>
            <button
              onClick={handleMagicWandClick}
              disabled={isPending || !inputContent.trim() || wordCount < 100 || wordCount > 1000}
              className={`flex items-center justify-center gap-2 px-6 py-3 w-full bg-primary text-white font-bold rounded-xl transition-all duration-300 border-none ${
                !inputContent.trim() || wordCount < 100 || wordCount > 1000
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-[1.01] active:scale-[0.99] hover:bg-[#6c79f0] cursor-pointer"
              }`}
            >
              Process Content
            </button>
          </div>
        </div>

        {/* Results Section */}
        {(outputContent || isPending) && (
          <div className="bg-white rounded-xl shadow-none border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary" />
                Processing Results
              </h2>
              <button
                onClick={() => setIsDiffView(!isDiffView)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 font-medium ${
                  isDiffView
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary"
                }`}
              >
                <GitCompare className="w-4 h-4" />
                {isDiffView ? "View Original & Processed" : "View Comparison (Diff)"}
              </button>
            </div>
            {isDiffView && outputContent?.rewrittenContent ? (
              <div className="p-4 bg-gray-50 overflow-x-auto min-h-[400px]">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <ReactDiffViewer
                    oldValue={inputContent}
                    newValue={outputContent.rewrittenContent}
                    splitView={true}
                    leftTitle="Original"
                    rightTitle="Processed"
                    compareMethod="diffChars"
                    hideLineNumbers={false}
                    styles={{
                      variables: {
                        light: {
                          diffViewerBackground: "#ffffff",
                          diffViewerColor: "#374151",
                          addedBackground: "#ecfdf5",
                          addedColor: "#065f46",
                          removedBackground: "#fef2f2",
                          removedColor: "#991b1b",
                          wordAddedBackground: "#ccfbf1",
                          wordRemovedBackground: "#fee2e2",
                          addedGutterBackground: "#d1fae5",
                          removedGutterBackground: "#fee2e2",
                          gutterColor: "#9ca3af",
                          codeFoldGutterBackground: "#f9fafb",
                          codeFoldBackground: "#f3f4f6",
                          emptyLineBackground: "#f9fafb",
                          foldPlaceholderColor: "#6b7280",
                          addedGutterColor: "#047857",
                          removedGutterColor: "#b91c1c",
                        },
                      },
                      line: {
                        padding: "4px 0",
                        lineHeight: "1.6",
                        fontSize: "0.875rem",
                      },
                      gutter: {
                        padding: "0 12px",
                        minWidth: "50px",
                      },
                      contentText: {
                        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
                      },
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-96 overflow-y-auto grid lg:grid-cols-2 gap-0 border border-gray-200 rounded-lg">
                {/* Original Content Panel */}
                <div className="flex flex-col border-r border-gray-200">
                  <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
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
                      className="p-2 text-gray-500 hover: hover:bg-gray-200 rounded-lg transition-colors"
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
                  <div className="flex items-center justify-between p-4 bg-primary/5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
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
                        className="p-2 text-gray-500 hover: hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Copy processed content"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleDownload(outputContent?.rewrittenContent, "processed-content.txt")
                        }
                        disabled={!outputContent?.rewrittenContent}
                        className="p-2 text-gray-500 hover: hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
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
            )}

            {/* Connected Tools Suggestion */}
            <div className="p-6 pt-0">
              <ConnectedTools
                currentToolId="humanize"
                transferValue={outputContent?.rewrittenContent}
                title="Verify Your Humanized Content!"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HumanizeContent
