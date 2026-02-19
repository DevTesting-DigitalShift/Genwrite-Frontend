import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import toast from "@utils/toast"
import {
  Building2,
  Globe,
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Globe2,
  X,
  Plus,
  Sparkles,
} from "lucide-react"
import { createBrandVoice, getSiteInfo } from "@/api/brandApi"
import { motion, AnimatePresence } from "framer-motion"
import useAuthStore from "@store/useAuthStore"

const Onboarding = () => {
  const navigate = useNavigate()
  const { user, loadAuthenticatedUser } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [fetchingInfo, setFetchingInfo] = useState(false)

  // Load authenticated user on mount
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      navigate("/login", { replace: true })
      return
    }

    // Load user data
    loadAuthenticatedUser()
  }, [loadAuthenticatedUser, navigate])

  // Prevent users who've already completed onboarding from accessing this page
  useEffect(() => {
    if (!user || !user._id) return

    // Use user-specific localStorage key
    const hasCompletedOnboarding =
      localStorage.getItem(`hasCompletedOnboarding_${user._id}`) === "true"

    // If user has lastLogin OR has completed onboarding, redirect to dashboard
    if (user.lastLogin || hasCompletedOnboarding) {
      if (user.emailVerified === false) {
        navigate(`/email-verify/${user.email}`, { replace: true })
      } else {
        navigate("/dashboard", { replace: true })
      }
    }
  }, [user, navigate])

  const [protocol, setProtocol] = useState("https://")
  const [formData, setFormData] = useState({
    nameOfVoice: "",
    postLink: "",
    sitemap: "",
    describeBrand: "",
    keywords: [],
    persona: "",
  })

  const [keywordInput, setKeywordInput] = useState("")

  const handleFetchSiteInfo = async () => {
    if (!formData.postLink) {
      toast.error("Please enter your company website URL")
      return
    }

    setFetchingInfo(true)
    try {
      const fullUrl = `${protocol}${formData.postLink.replace(/^https?:\/\//, "")}`
      const siteInfo = await getSiteInfo(fullUrl)

      setFormData(prev => ({
        ...prev,
        nameOfVoice: siteInfo.nameOfVoice || prev.nameOfVoice,
        describeBrand: siteInfo.describeBrand || prev.describeBrand,
        keywords: siteInfo.keywords || prev.keywords,
        persona: siteInfo.persona || prev.persona,
        sitemap: siteInfo.sitemap || prev.sitemap,
      }))

      toast.success("Company information fetched successfully!")
      setCurrentStep(1)
    } catch (error) {
      toast.warning(
        error.message ||
          "Couldn't fetch company information automatically. Please enter details manually."
      )
      setCurrentStep(1)
    } finally {
      setFetchingInfo(false)
    }
  }

  const addKeyword = () => {
    if (keywordInput.trim()) {
      const newKeywords = keywordInput
        .split(",")
        .map(k => k.trim())
        .filter(k => k && !formData.keywords.includes(k))

      setFormData(prev => ({ ...prev, keywords: [...prev.keywords, ...newKeywords] }))
      setKeywordInput("")
    }
  }

  const removeKeyword = keyword => {
    setFormData(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== keyword) }))
  }

  const handleStep1Continue = () => {
    if (!formData.describeBrand?.trim()) {
      toast.error("Please enter your brand description")
      return
    }
    if (!formData.persona?.trim()) {
      toast.error("Please enter your author persona")
      return
    }
    if (!formData.keywords?.length) {
      toast.error("Please add at least one keyword")
      return
    }
    setCurrentStep(2)
  }

  const handleSubmit = async () => {
    if (!formData.sitemap?.trim()?.length) {
      delete formData.sitemap
    }

    setLoading(true)
    try {
      const submissionData = {
        ...formData,
        postLink: `${protocol}${formData.postLink.replace(/^https?:\/\//, "")}`,
      }
      await createBrandVoice(submissionData)
      toast.success("Brand voice created successfully!")

      if (user?._id) {
        localStorage.setItem(`hasCompletedOnboarding_${user._id}`, "true")
      }
      sessionStorage.setItem("justCompletedOnboarding", "true")

      navigate("/dashboard", { replace: true })
    } catch (error) {
      toast.error(error.message || "Failed to create brand voice")
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    if (user?._id) {
      localStorage.setItem(`hasCompletedOnboarding_${user._id}`, "true")
    }
    sessionStorage.setItem("justCompletedOnboarding", "true")
    navigate("/dashboard")
  }

  const steps = [
    { title: "Company Info", icon: Building2 },
    { title: "Brand Details", icon: Target },
    { title: "Review", icon: Check },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-[140px] opacity-20 -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200 rounded-full blur-[140px] opacity-20 -ml-48 -mb-48" />

      <button
        onClick={handleSkip}
        disabled={!user?._id}
        className="absolute top-10 right-10 btn btn-ghost btn-sm text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px]"
      >
        Skip Onboarding
      </button>

      <div className="w-full max-w-xl relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-[24px] shadow-2xl shadow-slate-200/50 mb-6 group transition-all hover:scale-110 hover:shadow-blue-100 border border-slate-50">
            <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">GenWrite</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
            Strategic Brand Intelligence
          </p>
        </div>

        {/* Progress Display */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`h-12 w-12 rounded-[18px] flex items-center justify-center transition-all duration-700 border-2 ${
                      index === currentStep
                        ? "bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-200 scale-110"
                        : index < currentStep
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-white border-slate-100 text-slate-300"
                    }`}
                  >
                    {index < currentStep ? (
                      <Check size={24} strokeWidth={3} />
                    ) : (
                      <step.icon size={22} />
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 max-w-[40px] h-[3px] rounded-full bg-slate-100 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: index < currentStep ? "100%" : "0%" }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 bg-emerald-500"
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-[48px] p-12 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] border border-white/20 relative overflow-hidden backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {/* Step 0: Company Info */}
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-10"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Identity</h2>
                  <p className="text-slate-500 font-medium">
                    Tell us about your organization to begin the analysis.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        Brand Designation
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Global Inc."
                      value={formData.nameOfVoice}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, nameOfVoice: e.target.value }))
                      }
                      className="input input-bordered h-16 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-800 placeholder:text-slate-300"
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        Digital Domain
                      </span>
                    </label>
                    <div className="join w-full shadow-sm">
                      <select
                        value={protocol}
                        onChange={e => setProtocol(e.target.value)}
                        className="select select-bordered join-item h-16 bg-slate-50 border-slate-100 font-black text-slate-500 focus:outline-none"
                      >
                        <option value="https://">https://</option>
                        <option value="http://">http://</option>
                      </select>
                      <input
                        type="text"
                        placeholder="www.acme.com"
                        value={formData.postLink}
                        onChange={e => setFormData(prev => ({ ...prev, postLink: e.target.value }))}
                        className="input input-bordered join-item flex-1 h-16 bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-800 placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        Sitemap{" "}
                        <span className="text-slate-300 font-medium lowercase italic">
                          (optional)
                        </span>
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://www.acme.com/sitemap.xml"
                      value={formData.sitemap}
                      onChange={e => setFormData(prev => ({ ...prev, sitemap: e.target.value }))}
                      className="input input-bordered h-16 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 transition-all font-medium text-slate-800 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <button
                  onClick={handleFetchSiteInfo}
                  disabled={fetchingInfo || !formData.postLink || !formData.nameOfVoice}
                  className="btn btn-primary w-full h-16 rounded-2xl bg-slate-900 border-none text-white font-black shadow-2xl hover:bg-black transition-all group"
                >
                  {fetchingInfo ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      Analyze Infrastructure
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Step 1: Brand Details */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-10"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    Intelligence
                  </h2>
                  <p className="text-slate-500 font-medium">
                    Refining the semantic patterns of your brand.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        Mission Statement
                      </span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="What defines your brand's core mission?"
                      value={formData.describeBrand}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, describeBrand: e.target.value }))
                      }
                      className="textarea textarea-bordered rounded-3xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-800 p-6 leading-relaxed"
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        Author Persona
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Define the voice behind the content."
                      value={formData.persona}
                      onChange={e => setFormData(prev => ({ ...prev, persona: e.target.value }))}
                      className="textarea textarea-bordered rounded-3xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-800 p-6"
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        Semantic Clusters
                      </span>
                    </label>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Add keywords..."
                        value={keywordInput}
                        onChange={e => setKeywordInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addKeyword()}
                        className="input input-bordered flex-1 h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-black"
                      />
                      <button
                        onClick={addKeyword}
                        className="btn btn-square bg-slate-100 hover:bg-slate-900 border-none h-14 w-14 rounded-2xl text-slate-900 hover:text-white transition-colors"
                      >
                        <Plus size={24} />
                      </button>
                    </div>
                    {formData.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.keywords.map((keyword, index) => (
                          <div
                            key={index}
                            className="badge h-auto py-2.5 bg-blue-50 text-blue-700 border-none font-black text-[10px] uppercase tracking-widest gap-2 px-4 rounded-xl shadow-sm"
                          >
                            {keyword}
                            <button
                              onClick={() => removeKeyword(keyword)}
                              className="text-blue-300 hover:text-rose-500 transition-colors"
                            >
                              <X size={14} strokeWidth={3} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="btn btn-ghost h-16 flex-1 rounded-2xl text-slate-400 font-black uppercase tracking-widest text-[10px] border border-slate-100 bg-slate-50 hover:bg-slate-100"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStep1Continue}
                    className="btn btn-primary h-16 flex-2 rounded-2xl bg-slate-900 border-none text-white font-black shadow-2xl hover:bg-black transition-all"
                  >
                    Next Dimension
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Review */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-10"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Validation</h2>
                  <p className="text-slate-500 font-medium">
                    Verify your brand parameters before deployment.
                  </p>
                </div>

                <div className="space-y-8 bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Brand
                      </p>
                      <p className="text-slate-900 font-black text-lg">
                        {formData.nameOfVoice || "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Digital Hub
                      </p>
                      <p className="text-slate-900 font-black text-lg truncate">
                        {protocol}
                        {formData.postLink || "—"}
                      </p>
                    </div>
                  </div>

                  {formData.describeBrand && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Philosophy
                      </p>
                      <p className="text-slate-700 font-bold leading-relaxed text-sm italic border-l-4 border-blue-500 pl-4">
                        {formData.describeBrand}
                      </p>
                    </div>
                  )}

                  {formData.keywords.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Core Values
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {formData.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="btn btn-ghost h-16 flex-1 rounded-2xl text-slate-400 font-black uppercase tracking-widest text-[10px] border border-slate-100 bg-slate-50 hover:bg-slate-100"
                  >
                    Revisit
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="btn btn-primary h-16 flex-2 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 border-none text-white font-black shadow-[0_20px_40px_-5px_rgba(37,99,235,0.4)] hover:scale-[1.02] transition-all"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Initialize Digital Voice"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] mt-12">
          High-Security Deployment Module
        </p>
      </div>
    </div>
  )
}

export default Onboarding
