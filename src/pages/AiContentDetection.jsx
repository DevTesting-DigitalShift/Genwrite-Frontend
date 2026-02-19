import React, { useState, useEffect } from "react"
import {
  Copy,
  RefreshCw,
  FileText,
  Sparkles,
  Shield,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react"
import toast from "@utils/toast"

import useToolsStore from "@store/useToolsStore"
import { useAiDetectionMutation } from "@api/queries/toolsQueries"

const AiContentDetection = () => {
  const [inputContent, setInputContent] = useState("")
  const { aiDetection, resetAiDetection } = useToolsStore()
  const { result: detectionResult } = aiDetection
  const { mutate: detectContent, isPending } = useAiDetectionMutation()

  // Cleanup on unmount - reset state when user leaves the page
  useEffect(() => {
    return () => {
      setInputContent("")
      resetAiDetection()
    }
  }, [])

  const wordCount = inputContent.trim().split(/\s+/).filter(Boolean).length

  const handleSubmit = async () => {
    if (!inputContent.trim()) {
      toast.error("Please enter some content to analyze")
      return
    }

    if (wordCount < 20) {
      toast.error("Please enter at least 20 words for accurate detection")
      return
    }

    const payload = { content: inputContent.trim() }

    detectContent(payload, {
      onSuccess: () => {
        toast.success("Content analyzed successfully!")
      },
      onError: err => {
        toast.error(err?.message || "Failed to analyze content. Please try again.")
        console.error(err)
      },
    })
  }

  const handleCopy = async content => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success("Content copied to clipboard")
    } catch (err) {
      console.error("Failed to copy content")
      toast.error("Failed to copy content")
    }
  }

  const handleReset = () => {
    setInputContent("")
    resetAiDetection()
    toast.custom("Content reset", "alert-info")
  }

  const getScoreColor = score => {
    if (score >= 80) return "text-red-600"
    if (score >= 50) return "text-yellow-600"
    return "text-green-600"
  }

  const getScoreBgColor = score => {
    if (score >= 80) return "bg-red-100 border-red-200"
    if (score >= 50) return "bg-yellow-100 border-yellow-200"
    return "bg-green-100 border-green-200"
  }

  const getStyleIcon = styleType => {
    if (styleType === "ai") return <AlertCircle className="w-5 h-5 text-red-600" />
    if (styleType === "mixed") return <Info className="w-5 h-5 text-yellow-600" />
    return <CheckCircle className="w-5 h-5 text-green-600" />
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-10 p-6 md:p-10">
        {/* Header */}
        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/20 border border-slate-200/60 p-10 relative overflow-hidden group">
          {/* Subtle neural accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-slate-900/10 group-hover:scale-110 transition-transform duration-500">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-950 tracking-tight">
                  Neural Content Detection
                </h1>
                <p className="text-lg font-medium text-slate-500 max-w-2xl leading-relaxed">
                  Advanced synthetic pattern analysis to verify content authenticity and origin.
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="btn btn-ghost bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold h-12 px-6 rounded-2xl border border-slate-200 shadow-sm transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset System
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Input Section */}
          <div className="lg:col-span-3 bg-white rounded-[40px] shadow-2xl shadow-slate-200/20 border border-slate-200/60 p-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Source Analysis</h2>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <textarea
                  value={inputContent}
                  onChange={e => setInputContent(e.target.value)}
                  placeholder="Paste neural output or manual script for signature analysis..."
                  className="w-full h-80 p-8 bg-slate-50/50 border-2 border-slate-100 rounded-[32px] resize-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all duration-500 text-slate-800 font-medium placeholder:text-slate-300 custom-scroll"
                />
                <div className="absolute right-6 bottom-6 px-4 py-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm">
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest ${wordCount < 20 ? "text-amber-500" : "text-emerald-600"}`}
                  >
                    Quantum Units: {wordCount} {wordCount < 20 && "(Min 20 required)"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isPending || !inputContent.trim() || wordCount < 20}
                className={`w-full h-16 bg-slate-950 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 shadow-2xl shadow-slate-900/20 active:scale-95 ${
                  !inputContent.trim() || wordCount < 20
                    ? "opacity-30 cursor-not-allowed grayscale"
                    : "hover:bg-slate-800 hover:shadow-blue-600/10"
                }`}
              >
                {isPending ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {isPending ? "Processing..." : "Initiate Signature Scan"}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {!detectionResult ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-[40px] border border-slate-200/60 border-dashed space-y-6 opacity-60">
                <div className="w-24 h-24 bg-slate-50 rounded-[36px] flex items-center justify-center text-slate-200">
                  <Shield size={44} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-400 font-mono">WAITING_FOR_INPUT</h3>
                  <p className="text-slate-400 text-sm font-medium">
                    Feed the engine to begin pattern detection.
                  </p>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/20 border border-slate-200/60 overflow-hidden flex flex-col h-full"
              >
                <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Detection Profile
                    </h2>
                  </div>
                  <button
                    onClick={() => handleCopy(JSON.stringify(detectionResult, null, 2))}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
                    title="Copy Profile"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-10 space-y-10 flex-1 overflow-y-auto custom-scroll">
                  {/* Score Card */}
                  <div
                    className={`p-8 rounded-[32px] border-2 transition-colors duration-500 shadow-xl ${getScoreBgColor(detectionResult.score)}`}
                  >
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStyleIcon(detectionResult.styleType)}
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                            Origin: {detectionResult.styleType}
                          </h3>
                        </div>
                        <div className="badge border-none font-black bg-white/50 backdrop-blur-sm text-slate-900">
                          {detectionResult.confidence.toUpperCase()}
                        </div>
                      </div>

                      <div className="text-center space-y-2">
                        <span
                          className={`text-6xl font-black tracking-tighter ${getScoreColor(detectionResult.score)}`}
                        >
                          {Number(detectionResult.score).toFixed(0)}%
                        </span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Probability Score
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">
                          Likelihood
                        </p>
                        <p className="font-bold text-slate-900 capitalize text-center leading-tight">
                          {detectionResult.likelihoodBand.replace("_", " ")}
                        </p>
                      </div>
                      <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">
                          Decision
                        </p>
                        <p className="font-bold text-slate-900 text-center leading-tight">
                          {detectionResult.isAi ? "Synthetic Trace" : "Organic Origin"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Points */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Detailed Heuristics
                    </h3>
                    <div className="space-y-4">
                      {detectionResult.analysis.map((point, idx) => (
                        <div
                          key={idx}
                          className="group flex gap-4 p-5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all duration-300"
                        >
                          <span className="shrink-0 w-8 h-8 bg-white border border-slate-200 text-slate-900 rounded-xl flex items-center justify-center text-xs font-black shadow-sm group-hover:scale-110 transition-transform">
                            {idx + 1}
                          </span>
                          <p className="text-sm font-medium text-slate-600 leading-relaxed font-sans">
                            {point}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AiContentDetection
