import React, { useState, useCallback, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { RefreshCw, Sparkles, Copy, Check, FileText, Send } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import useAuthStore from "@store/useAuthStore"
import useContentStore from "@store/useContentStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import ProgressLoadingScreen from "@components/UI/ProgressLoadingScreen"
import toast from "@utils/toast"

const PromptContent = () => {
  const [content, setContent] = useState("")
  const [prompt, setPrompt] = useState("")
  const [copiedField, setCopiedField] = useState(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { handlePopup } = useConfirmPopup()

  // Zustand stores
  const { user } = useAuthStore()
  const userPlan = user?.subscription?.plan

  const {
    data: generatedContent,
    loading: isGenerating,
    error,
    generatePromptContent,
    resetMetadata,
  } = useContentStore()

  // Clear data on route change or component unmount
  useEffect(() => {
    return () => {
      resetMetadata()
    }
  }, [location.pathname, resetMetadata])

  // Validation functions
  const isPromptValid = prompt.trim().length >= 10
  const isContentWordsValid =
    content
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0).length >= 300
  const canGenerate = isPromptValid && isContentWordsValid && !isGenerating

  const handleGenerateContent = useCallback(async () => {
    if (!isPromptValid) {
      toast.error("Prompt must be at least 10 characters long.")
      return
    }

    if (!isContentWordsValid) {
      toast.error("Content must be at least 300 words long.")
      return
    }

    if (["free", "basic"].includes(userPlan?.toLowerCase?.())) {
      openUpgradePopup({ featureName: "Content Generation", navigate })
      return
    }

    try {
      await generatePromptContent({ prompt, content })
      toast.success("Content generated successfully!")
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error(typeof error === "string" ? error : "Failed to generate content.")
    }
  }, [
    content,
    prompt,
    generatePromptContent,
    userPlan,
    navigate,
    isPromptValid,
    isContentWordsValid,
  ])

  const handleReset = useCallback(() => {
    setContent("")
    setPrompt("")
    resetMetadata()
    toast.success("Content and prompt reset!")
  }, [resetMetadata])

  const copyToClipboard = async (text, label, fieldName) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast.success(`${label} copied!`)

      setTimeout(() => {
        setCopiedField(null)
      }, 2000)
    } catch (error) {
      toast.error(`Failed to copy ${label}.`)
    }
  }

  const stripHtml = html => {
    const tmp = document.createElement("div")
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ""
  }

  const renderHtmlContent = htmlContent => {
    return (
      <div
        className="prose prose-slate max-w-none p-6 bg-slate-50/50 rounded-2xl border border-slate-100"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{ lineHeight: "1.7" }}
      />
    )
  }

  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length
  const promptLength = prompt.trim().length

  if (isGenerating) {
    return (
      <div className="h-[calc(100vh-200px)] p-4 flex items-center justify-center">
        <ProgressLoadingScreen message="We're crafting your content using advanced AI..." />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6 lg:p-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-slate-100 p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-linear-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                AI Prompt Studio
              </h1>
              <p className="text-slate-500 font-medium">
                Transform rough ideas into polished articles with single commands.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="btn btn-ghost rounded-lg bg-slate-100 text-slate-600 font-bold normal-case gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Canvas
          </button>
        </div>
      </motion.div>

      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-8"
      >
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Prompt Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Send className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">Your AI Instruction</h2>
                </div>
                <div
                  className={`badge badge-lg font-bold border-none py-4 px-4 ${promptLength >= 10 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}
                >
                  {promptLength}/10 Min
                </div>
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Example: 'Rewrite this content to be more witty and include 3 actionable tips for marketing managers...'"
                rows={3}
                className={`textarea textarea-bordered w-full p-5 text-lg font-medium rounded-lg outline-0 min-h-[120px] ${
                  prompt.trim() && !isPromptValid ? "border-rose-300" : "border-slate-200"
                }`}
              />
            </div>

            {/* Content Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">Source Content</h2>
                </div>
                <div
                  className={`badge badge-lg font-semibold border-none py-4 px-4 ${wordCount >= 300 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}
                >
                  {wordCount}/300 Words
                </div>
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste your existing content here that you want to transform..."
                rows={10}
                className={`textarea textarea-bordered w-full p-5 text-lg font-medium rounded-lg outline-0 min-h-[300px] ${
                  content.trim() && !isContentWordsValid ? "border-rose-300" : "border-slate-200"
                }`}
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={() => handleGenerateContent()}
              disabled={!canGenerate}
              className={`btn w-full h-12 rounded-xl text-base gap-3 ${
                canGenerate
                  ? "bg-linear-to-r from-blue-600 to-indigo-600 border-none text-white"
                  : "bg-slate-100 text-slate-400 border-none cursor-not-allowed"
              }`}
            >
              {isGenerating ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Architecting Content...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Refined Content
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Generated Content Display */}
      <AnimatePresence>
        {generatedContent && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[32px] shadow-2xl shadow-indigo-100/30 border border-slate-100 overflow-hidden"
          >
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-linear-to-tr from-emerald-500 to-teal-600 rounded-2xl text-white flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">Result Unlocked</h2>
                    <p className="text-md font-bold text-slate-400">
                      Optimized by GenWrite AI
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(stripHtml(generatedContent), "Refined content", "generated")
                  }
                  className="btn btn-outline border-slate-200 hover:bg-slate-50 hover:text-blue-600 font-bold rounded-xl normal-case gap-2"
                >
                  {copiedField === "generated" ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Output
                    </>
                  )}
                </button>
              </div>

              {renderHtmlContent(generatedContent)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="alert alert-error bg-rose-50 border-rose-100 text-rose-700 rounded-2xl p-6"
          >
            <XCircle className="w-6 h-6" />
            <div className="font-bold">Generation failed: {error}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PromptContent
