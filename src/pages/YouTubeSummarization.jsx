import React, { useState, useEffect } from "react"
import {
  Copy,
  RefreshCw,
  Youtube,
  Sparkles,
  Loader2,
  Link as LinkIcon,
  FileText,
  ListChecks,
  Shield,
} from "lucide-react"
import { toast } from "sonner"

import useToolsStore from "@store/useToolsStore"
import { useYoutubeSummaryMutation } from "@api/queries/toolsQueries"
import ProgressLoadingScreen from "@components/ui/ProgressLoadingScreen"

const YouTubeSummarization = () => {
  const [inputUrl, setInputUrl] = useState("")
  const { youtubeSummary, resetYoutubeSummary } = useToolsStore()
  const { result: summaryResult, error } = youtubeSummary
  const {
    mutate: summarizeVideo,
    isPending,
    isLoading: isMutationLoading,
  } = useYoutubeSummaryMutation()
  const isLoading = isPending || isMutationLoading

  // Cleanup on unmount - reset state when user leaves the page
  useEffect(() => {
    return () => {
      setInputUrl("")
      resetYoutubeSummary()
    }
  }, [])

  const isValidYoutubeUrl = url => {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[a-zA-Z0-9_-]{11}/
    return youtubeRegex.test(url.trim())
  }

  const handleSubmit = async () => {
    if (!inputUrl.trim()) {
      toast.error("Please enter a YouTube URL")
      return
    }

    if (!isValidYoutubeUrl(inputUrl)) {
      toast.error(
        "Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)"
      )
      return
    }

    const payload = { url: inputUrl.trim() }

    summarizeVideo(payload, {
      onSuccess: () => {
        toast.success("Video summarized successfully!")
      },
      onError: err => {
        toast.error(err?.message || "Failed to summarize video. Please try again.")
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

  const handleCopySummary = async () => {
    if (!summaryResult) return
    const summaryText = `${summaryResult.title}\n\n${summaryResult.summary}\n\nKey Points:\n${summaryResult.keyPoints.map((point, idx) => `${idx + 1}. ${point}`).join("\n")}`
    await handleCopy(summaryText)
  }

  const handleReset = () => {
    setInputUrl("")
    resetYoutubeSummary()
    toast.info("Content reset")
  }

  const [timer, setTimer] = useState(0)

  // Custom timer logic for loading progress
  useEffect(() => {
    let interval
    if (isLoading) {
      setTimer(1)
      const specificPoints = [2, 3, 4, 10, 25, 30]
      let index = 0

      interval = setInterval(() => {
        setTimer(prev => {
          // Phase 1: Rapidly jump through specific points
          if (index < specificPoints.length) {
            const nextPoint = specificPoints[index]
            if (prev < nextPoint) {
              return nextPoint
            }
            index++
            return prev
          }

          // Phase 2: Slow crawl after 30%, never reaching 100%
          if (prev < 90) {
            return prev + 1
          }
          return prev
        })
      }, 800) // Adjust speed as needed
    } else {
      setTimer(0)
    }

    return () => clearInterval(interval)
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-200px)] p-4 flex items-center justify-center">
        <ProgressLoadingScreen
          message="Summarizing YouTube video..."
          isYouTube={true}
          timer={timer} // Pass the custom timer
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-red-50/20 to-purple-50/30">
      <div className="max-w-7xl mx-auto space-y-6 p-3 md:p-10 mt-6 md:mt-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-r from-red-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
                <Youtube className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  YouTube Summarization
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Summarize long YouTube videos into clear insights, highlights, and key takeaways.
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="shrink-0 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
              title="Reset all content"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <LinkIcon className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">YouTube Video URL</h2>
          </div>
          <div className="space-y-4">
            <input
              type="url"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)"
              className="w-full p-4 border-2 border-gray-200 rounded-xl outline-none transition-all duration-300 text-gray-800 placeholder-gray-500"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !inputUrl.trim() || !isValidYoutubeUrl(inputUrl)}
              className={`btn btn-primary h-auto py-3 w-full bg-linear-to-r from-red-600 to-purple-600 border-none text-white font-bold rounded-xl transition-all duration-300 hover:shadow-lg shadow-red-200/50 normal-case ${
                !inputUrl.trim() || !isValidYoutubeUrl(inputUrl)
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-[1.02]"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Summarizing...
                </>
              ) : (
                <>Summarize Video</>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {summaryResult && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Video Summary
              </h2>
              <button
                onClick={handleCopySummary}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy summary"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Video Info Card */}
              {summaryResult.thumbnail && (
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={summaryResult.thumbnail}
                    alt={summaryResult.title}
                    className="w-full h-auto object-cover"
                    onError={e => {
                      e.target.style.display = "none"
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4">
                    <h3 className="text-white font-semibold text-lg">{summaryResult.title}</h3>
                  </div>
                </div>
              )}

              {!summaryResult.thumbnail && (
                <div className="bg-linear-to-br from-red-50 to-purple-50 p-6 rounded-xl border border-red-100">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-600" />
                    {summaryResult.title}
                  </h3>
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Summary
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {summaryResult.summary}
                </p>
              </div>

              {/* Key Points */}
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-blue-600" />
                    Key Takeaways
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-full">
                    {summaryResult.keyPoints.length} points
                  </span>
                </div>

                <ul className="space-y-3">
                  {summaryResult.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-700">
                      <span className="shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Video Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Video ID</p>
                  <p className="text-sm text-gray-800 font-mono">{summaryResult.videoId}</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Video URL</p>
                  <p className="text-sm text-gray-800 font-mono truncate" title={inputUrl}>
                    {inputUrl}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default YouTubeSummarization
