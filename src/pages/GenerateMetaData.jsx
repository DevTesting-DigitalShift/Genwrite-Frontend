import React, { useState, useCallback } from "react"
import useAuthStore from "@store/useAuthStore"
import useContentStore from "@store/useContentStore"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, Sparkles, Copy, FileText, CheckCircle2 } from "lucide-react"
import toast from "@utils/toast"
import ProgressLoadingScreen from "@components/ui/ProgressLoadingScreen"

// Helper to detect if input is URL
const isUrl = text => text.trim().startsWith("http")

const GenerateMetaData = () => {
  const [content, setContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { metadata, generateMetadata, resetMetadata } = useContentStore()
  const userPlan = user?.subscription?.plan

  // Calculate word count
  const wordCount = useCallback(() => {
    if (isUrl(content)) return 300 // Sufficient for URL to pass backend validation
    const text = content.trim()
    if (!text) return 0
    return text.split(/\s+/).filter(word => word.length > 0).length
  }, [content])

  const handleGenerateMetadata = useCallback(async () => {
    if (!content.trim()) {
      toast.error("Please enter some content to generate metadata.")
      return
    }

    if (!isUrl(content) && wordCount() < 300) {
      toast.error("Content must be at least 300 words long.")
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
      toast.error("Failed to generate metadata.")
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#6366f1] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#0f172a] tracking-tight">
              SEO Metadata Generator
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              Create SEO-friendly metadata for your content
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors py-2 border-gray-300 border p-3 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </div>

      <div className="space-y-6">
        {/* Input Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 text-[#4f46e5]">
              <FileText className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Content</h2>
            </div>

            <div className="relative">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste content or enter URL..."
                className="w-full min-h-[350px] p-5 text-gray-600 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-gray-300 text-base leading-relaxed"
              />

              <div className="mt-4 flex justify-end">
                <span
                  className={`text-[11px] font-semibold tracking-tight ${wordCount() < 300 && content.length > 0 ? "text-amber-500" : "text-gray-300"}`}
                >
                  Word count: {wordCount()} (Minimum 300 words required)
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerateMetadata}
              disabled={isGenerating || !content.trim() || (!isUrl(content) && wordCount() < 300)}
              className={`w-full h-12 rounded-xl flex items-center justify-center font-bold text-base
                disabled:bg-[#f8fafc] disabled:text-gray-300 disabled:cursor-not-allowed
                ${
                  wordCount() >= 300 || isUrl(content)
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

              <div className="md:col-span-2 flex items-center justify-center gap-2 py-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-gray-400 uppercase">
                  Metadata successfully optimized
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default GenerateMetaData
