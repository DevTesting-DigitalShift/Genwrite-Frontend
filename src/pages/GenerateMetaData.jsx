import React, { useState, useCallback } from "react"
import useAuthStore from "@store/useAuthStore"
import useContentStore from "@store/useContentStore"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, Sparkles, Copy, FileText, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import ProgressLoadingScreen from "@components/ui/ProgressLoadingScreen"
import ConnectedTools from "@components/ConnectedTools"

// Helper to detect if input is URL
const isUrl = text => text.trim().startsWith("http")

const GenerateMetaData = () => {
  const location = useLocation()
  const [content, setContent] = useState(location.state?.transferValue || "")
  const [isGenerating, setIsGenerating] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { metadata, generateMetadata, resetMetadata } = useContentStore()
  const userPlan = user?.subscription?.plan

  // Calculate word count
  const wordCount = useCallback(() => {
    if (isUrl(content)) return 100 // Sufficient for URL to pass backend validation
    const text = content.trim()
    if (!text) return 0
    return text.split(/\s+/).filter(word => word.length > 0).length
  }, [content])

  const handleGenerateMetadata = useCallback(async () => {
    if (!content.trim()) {
      toast.error("Please enter some content to generate metadata.")
      return
    }

    if (!isUrl(content) && wordCount() < 100) {
      toast.error("Content must be at least 100 words long.")
      return
    }

    if (!isUrl(content) && wordCount() > 1000) {
      toast.error("Content must not exceed 1000 words.")
      return
    }

    if (["free", "basic"].includes(userPlan?.toLowerCase?.())) {
      navigate("/pricing")
      return
    }

    setIsGenerating(true)
    try {
      const payload = isUrl(content) ? { url: content } : { content }
      await generateMetadata(payload)
      toast.success("Metadata generated successfully!")
    } catch (error) {
      console.error("Error generating metadata:", error)
    } finally {
      setIsGenerating(false)
    }
  }, [content, userPlan, navigate, generateMetadata, wordCount])

  const copyToClipboard = (text, label) => {
    if (!text) return
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(`${label} copied to clipboard!`)
      })
      .catch(() => {
        toast.error(`Failed to copy ${label}.`)
      })
  }

  const handleReset = useCallback(() => {
    setContent("")
    resetMetadata()
    toast.success("Content and metadata reset!")
  }, [resetMetadata])

  if (isGenerating) {
    return (
      <div className="h-[calc(100vh-200px)] p-4 flex items-center justify-center">
        <ProgressLoadingScreen message="Generating high-impact metadata..." />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-4 pb-12 px-4 md:px-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-none p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 border border-indigo-100">
            <Sparkles className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              SEO Metadata Generator
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Create SEO-friendly metadata for your content
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors py-2 px-4 border border-gray-300 rounded-md"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </div>

      <div className="space-y-6">
        {/* Input Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-none overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 text-indigo-600">
              <FileText className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Content</h2>
            </div>

            <div className="relative">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste content or enter URL..."
                className="w-full min-h-[350px] p-5 text-gray-800 bg-gray-50 border-0 border-b-2 border-transparent rounded-xl focus:border-indigo-600 focus:ring-0 outline-none transition-all resize-none placeholder-gray-400 text-base leading-relaxed font-medium"
              />

              <div className="mt-4 flex justify-end">
                <span
                  className={`text-[11px] font-semibold tracking-tight ${(wordCount() < 100 || wordCount() > 1000) && content.length > 0 && !isUrl(content) ? "text-amber-500" : "text-gray-400"}`}
                >
                  Word count: {wordCount()} (Min 100, Max 1000 words required)
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerateMetadata}
              disabled={
                isGenerating ||
                !content.trim() ||
                (!isUrl(content) && (wordCount() < 100 || wordCount() > 1000))
              }
              className={`w-full h-12 rounded-xl flex items-center justify-center font-bold text-base
                disabled:bg-[#f8fafc] disabled:text-gray-300 disabled:cursor-not-allowed
                ${
                  (wordCount() >= 100 && wordCount() <= 1000) || isUrl(content)
                    ? "bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-indigo-200"
                    : "bg-[#f8fafc] text-gray-400 hover:bg-[#f1f5f9]"
                }`}
            >
              Generate Metadata
            </button>
          </div>
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {metadata && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Title Result */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative group">
                <button
                  onClick={() => copyToClipboard(metadata.title, "Meta Title")}
                  className="absolute top-4 right-4 p-2 text-gray-300 hover:text-[#4f46e5] transition-colors"
                >
                  <Copy size={16} />
                </button>
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-400 uppercase">Meta Title</p>
                  <p className="text-[#0f172a] font-bold text-lg leading-snug pr-8">
                    {metadata.title || "No title generated"}
                  </p>
                </div>
              </div>

              {/* Description Result */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative group">
                <button
                  onClick={() => copyToClipboard(metadata.description, "Meta Description")}
                  className="absolute top-4 right-4 p-2 text-gray-300 hover:text-[#4f46e5] transition-colors"
                >
                  <Copy size={16} />
                </button>
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-400 uppercase">Meta Description</p>
                  <p className="text-gray-600 font-medium text-sm leading-relaxed pr-8">
                    {metadata.description || "No description generated"}
                  </p>
                </div>
              </div>

              {/* Tags Result */}
              {metadata.tags && metadata.tags.length > 0 && (
                <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-bold text-gray-400 uppercase">Keywords & Tags</p>
                    <button
                      onClick={() => copyToClipboard(metadata.tags.join(", "), "Tags")}
                      className="text-[#4f46e5] font-bold uppercase text-sm hover:underline"
                    >
                      Copy All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {metadata.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold border border-gray-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected Tools Suggestion */}
              <div className="md:col-span-2">
                <ConnectedTools currentToolId="metadata" transferValue={content} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default GenerateMetaData
