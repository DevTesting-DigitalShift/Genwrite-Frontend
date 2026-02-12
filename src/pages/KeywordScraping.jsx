import React, { useState, useEffect } from "react"
import { Copy, RefreshCw, Search, Sparkles, Loader2, Link as LinkIcon, Tag } from "lucide-react"
import { Button, message } from "antd"

import useToolsStore from "@store/useToolsStore"
import { useKeywordScrapingMutation } from "@api/queries/toolsQueries"
import ProgressLoadingScreen from "@components/UI/ProgressLoadingScreen"

const KeywordScraping = () => {
  const [inputUrl, setInputUrl] = useState("")
  // const dispatch = useDispatch() // Removed
  const { keywordScraping, resetKeywordScraping } = useToolsStore()
  const { result: scrapingResult, error } = keywordScraping
  const { mutate: scrapeKeywords, isLoading } = useKeywordScrapingMutation()

  // Cleanup on unmount - reset state when user leaves the page
  useEffect(() => {
    return () => {
      setInputUrl("")
      resetKeywordScraping()
    }
  }, [])

  const isValidUrl = url => {
    const urlRegex =
      /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
    return urlRegex.test(url.trim())
  }

  const handleSubmit = async () => {
    if (!inputUrl.trim()) {
      message.error("Please enter a URL to analyze")
      return
    }

    if (!isValidUrl(inputUrl)) {
      message.error("Please enter a valid URL (e.g., https://example.com)")
      return
    }

    const payload = { url: inputUrl.trim() }

    scrapeKeywords(payload, {
      onSuccess: () => {
        message.success("Keywords scraped successfully!")
      },
      onError: err => {
        message.error(err?.message || "Failed to scrape keywords. Please try again.")
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

  const handleCopyKeywords = async () => {
    if (!scrapingResult) return
    const keywordsText = scrapingResult.keywords.join(", ")
    await handleCopy(keywordsText)
  }

  const handleReset = () => {
    setInputUrl("")
    resetKeywordScraping()
    message.info("Content reset")
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-200px)] p-4 flex items-center justify-center">
        <ProgressLoadingScreen message="Scraping keywords from the website..." />
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
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Keyword Scraping</h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Extract high-intent SEO keywords and clusters to build content that ranks.
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
            <LinkIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Website URL</h2>
          </div>
          <div className="space-y-4">
            <input
              type="url"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 text-gray-800 placeholder-gray-500"
            />
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !inputUrl.trim() || !isValidUrl(inputUrl)}
              className={`flex items-center justify-center gap-2 px-6 py-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg ${
                !inputUrl.trim() || !isValidUrl(inputUrl)
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-blue-700 hover:to-purple-700 hover:scale-105"
              }`}
            >
              <Search className="w-5 h-5" />
              Scrape Keywords
            </Button>
          </div>
        </div>

        {/* Results Section */}
        {scrapingResult && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Scraping Results
              </h2>
              <button
                onClick={handleCopyKeywords}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy keywords"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-blue-600" />
                  Page Summary
                </h3>
                <p className="text-gray-700 leading-relaxed">{scrapingResult.summary}</p>
              </div>

              {/* Keywords Grid */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-blue-600" />
                    Keywords Found
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-full">
                    {scrapingResult.keywords.length} keywords
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {scrapingResult.keywords.map((keyword, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200 flex items-center gap-2"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                        {idx + 1}
                      </span>
                      <span className="text-gray-800 text-sm font-medium truncate" title={keyword}>
                        {keyword}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* URL Info */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Analyzed URL</p>
                <p className="text-sm text-gray-800 font-mono break-all">{inputUrl}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default KeywordScraping
