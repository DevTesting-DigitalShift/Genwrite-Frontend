import React, { useState, useEffect } from "react"
import {
  Copy,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
  FileText,
  Type,
  PenTool,
  Layout,
  Palette,
} from "lucide-react"
import { Button, message } from "antd"

import useToolsStore from "@store/useToolsStore"
import { useCompetitorLikeBlogMutation } from "@api/queries/toolsQueries"
import ProgressLoadingScreen from "@components/UI/ProgressLoadingScreen"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const CompetitorLikeBlog = () => {
  const [url, setUrl] = useState("")
  const [topic, setTopic] = useState("")
  // const dispatch = useDispatch() // Removed
  const { competitorLikeBlog, resetCompetitorLikeBlog } = useToolsStore()
  const { result, error } = competitorLikeBlog
  const {
    mutate: generateContent,
    isPending,
    isLoading: isMutationLoading,
  } = useCompetitorLikeBlogMutation()
  const isLoading = isPending || isMutationLoading

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetCompetitorLikeBlog()
    }
  }, [])

  const isValidUrl = str => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async () => {
    if (!url.trim()) {
      message.error("Please enter a Competitor URL")
      return
    }

    if (!isValidUrl(url)) {
      message.error("Please enter a valid URL (e.g., https://example.com/blog/...)")
      return
    }

    if (!topic.trim()) {
      message.error("Please enter a topic")
      return
    }

    if (topic.length < 5) {
      message.error("Topic must be at least 5 characters long")
      return
    }

    const payload = { url: url.trim(), topic: topic.trim() }

    generateContent(payload, {
      onSuccess: () => {
        message.success("Content generated successfully!")
      },
      onError: err => {
        message.error(err?.message || "Failed to generate content. Please try again.")
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
    setUrl("")
    setTopic("")
    resetCompetitorLikeBlog()
    message.info("Reset successfully")
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
          message="Analyzing competitor style and generating content..."
          timer={timer}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/30">
      <div className="max-w-7xl mx-auto space-y-6 p-0 mt-10 md:mt-0 md:p-5">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <PenTool className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Competitor Like Blog
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Analyze a competitor's blog style and generate new content on your topic using
                  that style.
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <LinkIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Competitor URL</h2>
            </div>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/competitor-blog-post"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 text-gray-800 placeholder-gray-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Type className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Your Topic</h2>
            </div>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g., The Future of AI in Marketing"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all duration-300 text-gray-800 placeholder-gray-500"
            />
          </div>

          <div className="md:col-span-2">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !url.trim() || !topic.trim()}
              className={`flex items-center justify-center gap-2 px-6 py-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg h-12 text-lg ${
                !url.trim() || !topic.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-blue-700 hover:to-purple-700 hover:scale-[1.01]"
              }`}
            >
              <Sparkles className="w-5 h-5" />
              Generate Content
            </Button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="gap-6">
            {/* Analysis Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 border-b pb-4 border-gray-100">
                <Layout className="w-5 h-5 text-purple-600" />
                Style Analysis
              </h2>

              {result.analysis && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 h-full">
                    <h3 className="text-sm font-bold text-purple-800 mb-1 flex items-center gap-2">
                      <Palette className="w-4 h-4" /> Tone
                    </h3>
                    <p className="text-sm text-gray-700">
                      {result.analysis.tone.replace(
                        /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
                        ""
                      )}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 h-full">
                    <h3 className="text-sm font-bold text-blue-800 mb-1 flex items-center gap-2">
                      <Layout className="w-4 h-4" /> Structure
                    </h3>
                    <p className="text-sm text-gray-700">
                      {result.analysis.structure.replace(
                        /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
                        ""
                      )}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 h-full">
                    <h3 className="text-sm font-bold text-indigo-800 mb-1 flex items-center gap-2">
                      <PenTool className="w-4 h-4" /> Style
                    </h3>
                    <p className="text-sm text-gray-700">
                      {result.analysis.style.replace(
                        /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
                        ""
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-10">
              <div className="flex items-center justify-between mb-4 border-b pb-4 border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Generated Content
                </h2>
                <button
                  onClick={() => handleCopy(result.content)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  title="Copy content"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className="prose prose-blue max-w-none text-gray-800 leading-relaxed"
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 className="text-xl font-bold mt-5 mb-3" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc list-inside space-y-1 my-2" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal list-inside space-y-1 my-2" {...props} />
                    ),
                  }}
                >
                  {result.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompetitorLikeBlog
