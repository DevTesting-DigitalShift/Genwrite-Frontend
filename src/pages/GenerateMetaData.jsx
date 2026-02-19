import React, { useState, useCallback } from "react"
import useAuthStore from "@store/useAuthStore"
import useContentStore from "@store/useContentStore"
import { useNavigate } from "react-router-dom"
import toast from "@utils/toast"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { RefreshCw, Sparkles, Copy, FileText, CheckCircle2 } from "lucide-react"
import ProgressLoadingScreen from "@components/UI/ProgressLoadingScreen"

// Helper to detect if input is URL
const isUrl = text => text.trim().startsWith("http")

const GenerateMetaData = () => {
  const [content, setContent] = useState("")
  const [keywords, setKeywords] = useState([])
  const [newKeyword, setNewKeyword] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { metadata, generateMetadata, resetMetadata } = useContentStore()
  const userPlan = user?.subscription?.plan

  // Calculate word count
  const wordCount = useCallback(() => {
    // If URL, word count is 0 or we can just return a dummy valid number so it doesn't block
    if (isUrl(content)) return 300 // Return sufficient length for URL
    const words = content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
    return words.length
  }, [content])

  const handleGenerateMetadata = useCallback(async () => {
    if (!content.trim()) {
      toast.error("Please enter some content to generate metadata.")
      return
    }

    if (!isUrl(content) && content.length < 300) {
      toast.error("Content must be at least 300 characters long.")
      return
    }

    if (["free", "basic"].includes(userPlan?.toLowerCase?.())) {
      navigate("/pricing")
      return
    }

    setIsGenerating(true)
    try {
      // If content is URL, send as url param, otherwise content
      const payload = isUrl(content) ? { url: content } : { content }
      await generateMetadata(payload)
      toast.success("Metadata generated successfully!")
    } catch (error) {
      console.error("Error generating metadata:", error)
      toast.error("Failed to generate metadata.")
    } finally {
      setIsGenerating(false)
    }
  }, [content, userPlan, navigate, generateMetadata])

  const addKeyword = useCallback(() => {
    if (newKeyword.trim()) {
      const newKeywordsArray = newKeyword
        .split(",")
        .map(k => k.trim().toLowerCase())
        .filter(k => k && !keywords.map(kw => kw.toLowerCase()).includes(k))
      if (newKeywordsArray.length > 0) {
        setKeywords(prev => [...prev, ...newKeywordsArray])
      }
      setNewKeyword("")
    }
  }, [newKeyword, keywords])

  const handleKeyDown = useCallback(
    e => {
      if (e.key === "Enter") {
        e.preventDefault()
        addKeyword()
      }
    },
    [addKeyword]
  )

  const removeKeyword = useCallback(keyword => {
    setKeywords(prev => prev.filter(k => k !== keyword))
  }, [])

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
    setKeywords([])
    setNewKeyword("")
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
    <div className="max-w-5xl mx-auto space-y-8 p-6 font-inter">
      {/* Header Card */}
      <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-50 p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">SEO Meta Intel</h1>
              <p className="text-slate-500 font-medium">
                Generate conversion-optimized metadata in seconds.
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="btn btn-ghost btn-sm text-slate-400 hover:text-rose-500 font-bold uppercase tracking-widest text-[10px]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Canvas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-100 border border-slate-50 space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {isUrl(content) ? "Target Source" : "Source Content"}
              </h2>
            </div>

            <div className="form-control w-full space-y-4">
              {isUrl(content) ? (
                <input
                  type="text"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Enter URL (e.g., https://example.com/blog)..."
                  className="input input-bordered h-16 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-800"
                />
              ) : (
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste your content or enter a URL to analyze..."
                  className="textarea textarea-bordered min-h-[400px] rounded-3xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800 p-6 leading-relaxed custom-scroll"
                />
              )}

              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${!isUrl(content) && wordCount() < 300 ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`}
                  />
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${!isUrl(content) && wordCount() < 300 ? "text-amber-500" : "text-slate-400"}`}
                  >
                    {isUrl(content) ? "URL MODE ACTIVE" : `Word Count: ${wordCount()}`}
                  </span>
                </div>
                {!isUrl(content) && wordCount() < 300 && (
                  <span className="text-[10px] font-bold text-amber-500">
                    Min 300 chars for optimal results
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleGenerateMetadata}
              disabled={
                isGenerating || !content.trim() || (!isUrl(content) && content.length < 300)
              }
              className="btn btn-primary w-full h-16 rounded-2xl bg-slate-900 border-none text-white font-black shadow-2xl hover:bg-black transition-all group disabled:bg-slate-100 disabled:text-slate-400"
            >
              {isGenerating ? (
                <span className="loading loading-spinner"></span>
              ) : (
                <>
                  Generate SEO Patterns
                  <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {metadata ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Title Result */}
                <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-100 border border-slate-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <button
                      onClick={() => copyToClipboard(metadata.title, "Meta Title")}
                      className="btn btn-circle btn-ghost btn-sm text-slate-400 hover:text-blue-600"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Meta Title
                  </p>
                  <p className="text-slate-900 font-black text-lg leading-tight pr-8">
                    {metadata.title || "Inference failed"}
                  </p>
                </div>

                {/* Description Result */}
                <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-100 border border-slate-50 relative">
                  <div className="absolute top-0 right-0 p-4">
                    <button
                      onClick={() => copyToClipboard(metadata.description, "Meta Description")}
                      className="btn btn-circle btn-ghost btn-sm text-slate-400 hover:text-blue-600"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Meta Description
                  </p>
                  <p className="text-slate-700 font-bold text-sm leading-relaxed italic border-l-4 border-blue-500 pl-4 pr-4">
                    {metadata.description || "Inference failed"}
                  </p>
                </div>

                {/* Tags Result */}
                {metadata.tags && metadata.tags.length > 0 && (
                  <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-100 border border-slate-50">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Semantic Tags
                      </p>
                      <button
                        onClick={() => copyToClipboard(metadata.tags.join(", "), "Tags")}
                        className="btn btn-ghost btn-xs text-blue-600 font-black uppercase tracking-widest text-[9px]"
                      >
                        Copy All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {metadata.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-slate-50 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm hover:border-blue-200 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 py-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Optimization Complete
                  </span>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-50 mb-6">
                  <Sparkles className="w-8 h-8 text-slate-200" />
                </div>
                <h3 className="text-slate-900 font-black tracking-tight mb-2">
                  Ready for Intelligence
                </h3>
                <p className="text-slate-400 text-sm font-medium">
                  Input your source content to generate optimized SEO structures.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default GenerateMetaData
