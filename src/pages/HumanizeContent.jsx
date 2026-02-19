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
import toast from "@utils/toast"
import { useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import useHumanizeStore from "@store/useHumanizeStore"
import useAuthStore from "@store/useAuthStore"
import { useHumanizeMutation } from "@api/queries/humanizeQueries"
import ProgressLoadingScreen from "@components/UI/ProgressLoadingScreen"

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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Humanize Content
              </h1>
            </div>
            <p className="text-slate-500 text-lg font-medium max-w-2xl">
              Transform AI-generated text into natural, human-like content that bypasses AI
              detectors and engages readers.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="btn btn-ghost hover:bg-slate-100 text-slate-500 font-bold border border-slate-200 h-12 px-6 rounded-2xl transition-all"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Editor
          </button>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden group">
          <div className="p-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Source Content</h2>
            </div>
            <div
              className={`text-sm font-bold px-4 py-1.5 rounded-full transition-colors ${
                wordCount < 300 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {wordCount} words {wordCount < 300 && "(Min 300 required)"}
            </div>
          </div>

          <div className="px-8 pb-8">
            <div className="relative">
              <textarea
                value={inputContent}
                onChange={e => setInputContent(e.target.value)}
                placeholder="Paste your AI-generated content here to make it sound human..."
                className="w-full h-80 p-6 bg-slate-50 border-2 border-slate-100 rounded-[24px] resize-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-700 text-lg leading-relaxed placeholder:text-slate-400"
              />
            </div>

            <div className="mt-6">
              <button
                onClick={handleMagicWandClick}
                disabled={isPending || !inputContent.trim() || wordCount < 300}
                className="btn btn-primary w-full h-16 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 border-none text-white font-black text-xl shadow-xl shadow-blue-200 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 mr-2" />
                    Humanize My Content
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {(outputContent || isPending) && (
          <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Original Card */}
            <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col h-[600px]">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800">Original</span>
                  {outputContent?.originalHumanizationScore && (
                    <div className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-rose-100">
                      Score: {outputContent.originalHumanizationScore}%
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleCopy(inputContent, "original")}
                  className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
                >
                  <Copy size={20} />
                </button>
              </div>
              <div className="flex-1 p-8 overflow-y-auto text-slate-600 leading-relaxed custom-scrollbar">
                {inputContent}
              </div>
            </div>

            {/* Processed Card */}
            <div className="bg-white rounded-[32px] shadow-xl shadow-blue-100/50 border border-blue-100 flex flex-col h-[600px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 blur-3xl pointer-events-none" />

              <div className="p-6 border-b border-blue-50 flex items-center justify-between bg-blue-50/10">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-blue-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Humanized Result
                  </span>
                  {outputContent?.rewrittenHumanizationScore && (
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-emerald-100">
                      Score: {outputContent.rewrittenHumanizationScore}%
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(outputContent?.rewrittenContent, "processed")}
                    disabled={!outputContent?.rewrittenContent}
                    className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-colors disabled:opacity-30"
                  >
                    <Copy size={20} />
                  </button>
                  <button
                    onClick={() =>
                      handleDownload(outputContent?.rewrittenContent, "humanized-content.txt")
                    }
                    disabled={!outputContent?.rewrittenContent}
                    className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-colors disabled:opacity-30"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-8 overflow-y-auto text-slate-900 font-medium leading-relaxed custom-scrollbar">
                {isPending ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="text-slate-500 font-bold">Rewriting your content...</p>
                  </div>
                ) : (
                  outputContent?.rewrittenContent
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HumanizeContent
