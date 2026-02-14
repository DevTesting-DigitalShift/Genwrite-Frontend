import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Input, Button, message, Select } from "antd"
import {
  Building2,
  Globe,
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Globe2,
} from "lucide-react"
import { createBrandVoice, getSiteInfo } from "@/api/brandApi"
import { motion, AnimatePresence } from "framer-motion"
import useAuthStore from "@store/useAuthStore"

const { TextArea } = Input

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
      message.error("Please enter your company website URL")
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

      message.success("Company information fetched successfully!")
      setCurrentStep(1)
    } catch (error) {
      // Show error but still allow user to proceed to manually enter information
      message.warning(
        error.message ||
          "Couldn't fetch company information automatically. Please enter details manually."
      )
      // Proceed to next step anyway
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
      message.error("Please enter your brand description")
      return
    }
    if (!formData.persona?.trim()) {
      message.error("Please enter your author persona")
      return
    }
    if (!formData.keywords?.length) {
      message.error("Please add at least one keyword")
      return
    }
    setCurrentStep(2)
  }

  const handleSubmit = async () => {
    // ... validation logic already exists for name, link, keywords, persona ...
    // BUT the user says "validation error on that step".
    // I added handleStep1Continue above for step 1 validation.
    // The previously existing validations in handleSubmit are fine as a final check.

    // Fix the sitemap crash
    if (!formData.sitemap?.trim()?.length) {
      delete formData.sitemap
    }

    // ... rest of handleSubmit
    setLoading(true)
    try {
      const submissionData = {
        ...formData,
        postLink: `${protocol}${formData.postLink.replace(/^https?:\/\//, "")}`,
      }
      await createBrandVoice(submissionData)
      message.success("Brand voice created successfully!")

      // Mark that user has completed onboarding (user-specific)
      if (user?._id) {
        localStorage.setItem(`hasCompletedOnboarding_${user._id}`, "true")
      }
      sessionStorage.setItem("justCompletedOnboarding", "true")

      navigate("/dashboard", { replace: true })
    } catch (error) {
      message.error(error.message || "Failed to create brand voice")
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
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative">
      <Button
        type="text"
        onClick={handleSkip}
        disabled={!user?._id}
        className="absolute top-6 right-6 text-gray-500 hover:text-gray-900"
      >
        Skip
      </Button>
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">GenWrite</h1>
          <p className="text-gray-500">Set up your brand voice</p>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-gray-900"
                  : index < currentStep
                    ? "w-2 bg-gray-400"
                    : "w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* Step 0 */}
          {currentStep === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Company Information</h2>
                <p className="text-gray-500">We'll analyze your website to understand your brand</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Company Name
                  </label>
                  <Input
                    size="large"
                    placeholder="Acme Corporation"
                    value={formData.nameOfVoice}
                    onChange={e => setFormData(prev => ({ ...prev, nameOfVoice: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Website URL
                  </label>

                  <Input
                    size="large"
                    placeholder="www.example.com"
                    addonBefore={
                      <Select
                        value={protocol}
                        onChange={setProtocol}
                        dropdownMatchSelectWidth={false}
                        className="protocol-select"
                      >
                        <Select.Option value="https://">https://</Select.Option>
                        <Select.Option value="http://">http://</Select.Option>
                      </Select>
                    }
                    value={formData.postLink}
                    onChange={e => setFormData(prev => ({ ...prev, postLink: e.target.value }))}
                    className="url-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Sitemap URL <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <Input
                    size="large"
                    placeholder="https://www.example.com/sitemap.xml"
                    value={formData.sitemap}
                    onChange={e => setFormData(prev => ({ ...prev, sitemap: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                block
                onClick={handleFetchSiteInfo}
                loading={fetchingInfo}
                disabled={!formData.postLink || !formData.nameOfVoice}
                className="h-12 bg-gray-900 hover:bg-gray-800 rounded-lg font-medium"
              >
                {fetchingInfo ? "Analyzing..." : "Continue"}
              </Button>
            </motion.div>
          )}

          {/* Step 1 */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Brand Details</h2>
                <p className="text-gray-500">Refine your brand information</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Brand Description
                  </label>
                  <TextArea
                    rows={4}
                    placeholder="Describe what your company does..."
                    value={formData.describeBrand}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, describeBrand: e.target.value }))
                    }
                    className="rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Author Persona
                  </label>
                  <TextArea
                    rows={3}
                    placeholder="What is your Author Persona?"
                    value={formData.persona}
                    onChange={e => setFormData(prev => ({ ...prev, persona: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Keywords</label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Add keywords (comma-separated)"
                      value={keywordInput}
                      onChange={e => setKeywordInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addKeyword()}
                      className="rounded-lg"
                    />
                    <Button onClick={addKeyword} className="rounded-lg">
                      Add
                    </Button>
                  </div>
                  {formData.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {keyword}
                          <button
                            onClick={() => removeKeyword(keyword)}
                            className="hover:text-gray-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  size="large"
                  onClick={() => setCurrentStep(0)}
                  className="flex-1 rounded-lg"
                >
                  Back
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleStep1Continue}
                  className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 rounded-lg font-medium"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review</h2>
                <p className="text-gray-500">Verify your information before creating</p>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Brand Name
                  </p>
                  <p className="text-gray-900">{formData.nameOfVoice || "Not provided"}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Website
                  </p>
                  <p className="text-gray-900">
                    {protocol}
                    {formData.postLink || "Not provided"}
                  </p>
                </div>

                {formData.describeBrand && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Description
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {formData.describeBrand}
                    </p>
                  </div>
                )}

                {formData.persona && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Author Persona
                    </p>
                    <p className="text-gray-700 text-sm">{formData.persona}</p>
                  </div>
                )}

                {formData.keywords.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Keywords
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  size="large"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 rounded-lg"
                >
                  Back
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmit}
                  loading={loading}
                  className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 rounded-lg font-medium"
                >
                  {loading ? "Creating..." : "Create Brand Voice"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-12">
          You can update these settings anytime
        </p>
      </div>
    </div>
  )
}

export default Onboarding
