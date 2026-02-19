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
  CheckCircle2,
  Zap,
} from "lucide-react"
import toast from "@utils/toast"

import useToolsStore from "@store/useToolsStore"
import { useCompetitorLikeBlogMutation } from "@api/queries/toolsQueries"
import ProgressLoadingScreen from "@components/UI/ProgressLoadingScreen"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { motion, AnimatePresence } from "framer-motion"

const CompetitorLikeBlog = () => {
  const [url, setUrl] = useState("")
  const [topic, setTopic] = useState("")

  const { competitorLikeBlog, resetCompetitorLikeBlog } = useToolsStore()
  const { result } = competitorLikeBlog
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
  }, [resetCompetitorLikeBlog])

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
      toast.error("Please enter a Competitor URL")
      return
    }

    if (!isValidUrl(url)) {
      toast.error("Please enter a valid URL (e.g., https://example.com/blog/...)")
      return
    }

    if (!topic.trim()) {
      toast.error("Please enter a topic")
      return
    }

    if (topic.length < 5) {
      toast.error("Topic must be at least 5 characters long")
      return
    }

    const payload = { url: url.trim(), topic: topic.trim() }

    generateContent(payload, {
      onSuccess: () => {
        toast.success("Content generated successfully!")
      },
      onError: err => {
        toast.error(err?.message || "Failed to generate content. Please try again.")
        console.error(err)
      },
    })
  }

  const handleCopy = async content => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success("Content copied into spectral buffer")
    } catch (err) {
      console.error("Failed to copy content")
      toast.error("Failed to copy content")
    }
  }

  const handleReset = () => {
    setUrl("")
    setTopic("")
    resetCompetitorLikeBlog()
    toast.success("Workspace reset initiated")
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
          if (index < specificPoints.length) {
            const nextPoint = specificPoints[index]
            if (prev < nextPoint) {
              return nextPoint
            }
            index++
            return prev
          }
          if (prev < 90) {
            return prev + 1
          }
          return prev
        })
      }, 800)
    } else {
      setTimer(0)
    }

    return () => clearInterval(interval)
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-200px)] p-4 flex items-center justify-center">
        <ProgressLoadingScreen
          message="Reverse-engineering competitor style and synthesis..."
          timer={timer}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-inter">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="bg-white rounded-[40px] p-8 sm:p-12 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.06)] border border-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full blur-[100px] opacity-50 -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200">
                <PenTool className="w-7 h-7 text-blue-400" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter">
                  Style <span className="text-blue-600">Clone</span>
                </h1>
                <p className="text-slate-500 font-medium max-w-xl">
                  Analyze competitor DNA and synthesize new content with matching structural
                  patterns.
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="btn btn-ghost btn-sm text-slate-400 hover:text-rose-500 font-bold uppercase tracking-widest text-[10px]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Analysis
            </button>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-12 lg:col-span-12 bg-white rounded-[32px] p-8 shadow-xl shadow-slate-100 border border-slate-50 flex flex-col md:flex-row gap-6">
            <div className="form-control flex-1 space-y-4">
              <label className="label">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <LinkIcon size={12} className="text-blue-600" /> Competitor Source
                </span>
              </label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://competitor.com/blog-post"
                className="input input-bordered h-16 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-800"
              />
            </div>

            <div className="form-control flex-1 space-y-4">
              <label className="label">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Type size={12} className="text-purple-600" /> Your Target Topic
                </span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Scaling Microservices in 2026"
                className="input input-bordered h-16 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-purple-500 transition-all font-bold text-slate-800"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSubmit}
                disabled={isLoading || !url.trim() || !topic.trim()}
                className="btn btn-primary h-16 px-10 rounded-2xl bg-slate-900 border-none text-white font-black shadow-2xl hover:bg-black transition-all group disabled:bg-slate-100 disabled:text-slate-400"
              >
                {isLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <>
                    Clone Style
                    <Zap className="w-5 h-5 ml-2 group-hover:scale-125 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Analysis Grid */}
                <div className="xl:col-span-4 space-y-6">
                  <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-100 border border-slate-50 space-y-8">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Layout size={14} className="text-blue-600" /> Pattern Analysis
                    </h2>

                    <div className="space-y-6">
                      <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-50">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Palette size={12} /> Tone & Resonance
                        </p>
                        <p className="text-sm font-bold text-slate-700 italic leading-relaxed">
                          {result.analysis?.tone?.replace(
                            /[\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD10-\uDDFF]/g,
                            ""
                          )}
                        </p>
                      </div>

                      <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-50">
                        <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Layout size={12} /> Structural Blueprint
                        </p>
                        <p className="text-sm font-bold text-slate-700 italic leading-relaxed">
                          {result.analysis?.structure?.replace(
                            /[\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD10-\uDDFF]/g,
                            ""
                          )}
                        </p>
                      </div>

                      <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-50">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <PenTool size={12} /> Sentence Architect
                        </p>
                        <p className="text-sm font-bold text-slate-700 italic leading-relaxed">
                          {result.analysis?.style?.replace(
                            /[\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD10-\uDDFF]/g,
                            ""
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="xl:col-span-8">
                  <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
                    <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                          Synthesized Content
                        </h2>
                      </div>

                      <button
                        onClick={() => handleCopy(result.content)}
                        className="btn btn-ghost btn-sm text-blue-600 font-black uppercase tracking-widest text-[10px] gap-2"
                      >
                        <Copy size={16} /> Copy Buffer
                      </button>
                    </div>

                    <div className="p-10 bg-white max-h-[800px] overflow-y-auto custom-scroll">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        className="prose prose-slate max-w-none prose-h1:text-4xl prose-h1:font-black prose-h1:tracking-tight prose-h2:text-2xl prose-h2:font-black prose-p:text-slate-700 prose-p:leading-relaxed prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/30 prose-blockquote:p-6 prose-blockquote:rounded-r-3xl prose-blockquote:italic"
                        components={{
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-8 rounded-3xl border border-slate-100 shadow-sm">
                              <table className="table table-zebra w-full" {...props} />
                            </div>
                          ),
                        }}
                      >
                        {result.content}
                      </ReactMarkdown>
                    </div>

                    <div className="px-10 py-6 bg-slate-50/30 border-t border-slate-50 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Synthesis Complete • Optimized for Engagement
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-xl border border-slate-50 mb-4 opacity-50 group-hover:scale-110 transition-transform">
                <Sparkles className="w-10 h-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-slate-900 font-black text-2xl tracking-tight">
                  Ready for Style Injection
                </h3>
                <p className="text-slate-400 font-medium max-w-sm">
                  Provide a competitor URL to analyze their structural patterns and begin synthesis.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CompetitorLikeBlog
