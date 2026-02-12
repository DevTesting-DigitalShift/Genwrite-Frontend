import React, { useState, useEffect } from "react"
import {
  Copy,
  RefreshCw,
  FileText,
  Sparkles,
  Loader2,
  Shield,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react"
import { Button, message } from "antd"

import useToolsStore from "@store/useToolsStore"
import { useAiDetectionMutation } from "@api/queries/toolsQueries"
import ProgressLoadingScreen from "@components/UI/ProgressLoadingScreen"

const AiContentDetection = () => {
  const [inputContent, setInputContent] = useState("")
  // const dispatch = useDispatch() // Removed
  const { aiDetection, resetAiDetection } = useToolsStore()
  const { result: detectionResult, error } = aiDetection
  const { mutate: detectContent, isLoading } = useAiDetectionMutation()

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
      message.error("Please enter some content to analyze")
      return
    }

    if (wordCount < 20) {
      message.error("Please enter at least 20 words for accurate detection")
      return
    }

    const payload = { content: inputContent.trim() }

    detectContent(payload, {
      onSuccess: () => {
        message.success("Content analyzed successfully!")
      },
      onError: err => {
        message.error(err?.message || "Failed to analyze content. Please try again.")
        console.error(err)
      },
    })
  }

  const handleCopy = async content => {
    try {
      await navigator.clipboard.writeText(content)
      message.success("Content copied to clipboard")
    } catch (err) {
      console.error("Failed to copy content")
      message.error("Failed to copy content")
    }
  }

  const handleReset = () => {
    setInputContent("")
    resetAiDetection()
    message.info("Content reset")
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

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-200px)] p-4 flex items-center justify-center">
        <ProgressLoadingScreen message="Analyzing your content..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto space-y-6 p-5">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  AI Content Detection
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Detect AI-generated text and get confidence scores to verify content authenticity.
                </p>
              </div>
            </div>

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
              placeholder="Paste or type your content here (minimum 20 words)..."
              className="w-full h-60 p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 text-gray-800 placeholder-gray-500"
            />
            <div className="flex justify-end items-center">
              <p
                className={`text-sm mb-2 ${wordCount < 20 ? "text-yellow-500" : "text-green-600"}`}
              >
                Word count: {wordCount} {wordCount < 20 ? "(Minimum 20 words required)" : ""}
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !inputContent.trim() || wordCount < 20}
              className={`flex items-center justify-center gap-2 px-6 py-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg ${
                !inputContent.trim() || wordCount < 20
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-blue-700 hover:to-purple-700 hover:scale-105"
              }`}
            >
              <Shield className="w-5 h-5" />
              Analyze Content
            </Button>
          </div>
        </div>

        {/* Results Section */}
        {detectionResult && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Detection Results
              </h2>
              <button
                onClick={() => handleCopy(JSON.stringify(detectionResult, null, 2))}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy results"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Score Card */}
              <div className={`p-6 rounded-xl border-2 ${getScoreBgColor(detectionResult.score)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStyleIcon(detectionResult.styleType)}
                    <h3 className="text-lg font-semibold text-gray-900">
                      Style Type: {detectionResult.styleType.toUpperCase()}
                    </h3>
                  </div>
                  <span className={`text-3xl font-bold ${getScoreColor(detectionResult.score)}`}>
                    {Number(detectionResult.score).toPrecision(2)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Likelihood Band</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {detectionResult.likelihoodBand.replace("_", " ")}
                    </p>
                  </div>
                  <div className="bg-white/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Confidence Level</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {detectionResult.confidence}
                    </p>
                  </div>
                  <div className="bg-white/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">AI Generated</p>
                    <p className="font-semibold text-gray-900">
                      {detectionResult.isAi ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Analysis Points */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Detailed Analysis
                </h3>
                <ul className="space-y-3">
                  {detectionResult.analysis.map((point, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-700">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AiContentDetection
