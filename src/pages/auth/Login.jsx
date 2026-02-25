import React, { useEffect, useState, useCallback, useRef } from "react"
import useAuthStore from "@store/useAuthStore"
import { Link, useNavigate } from "react-router-dom"
import { useGoogleLogin } from "@react-oauth/google"
import { motion, AnimatePresence } from "framer-motion"
import ReCAPTCHA from "react-google-recaptcha"
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaRocket,
  FaGoogle,
} from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import {
  Sparkles,
  Zap,
  PenTool,
  CheckCircle,
  Crown,
  TrendingUp,
  User,
  RefreshCcw,
} from "lucide-react"
import { Helmet } from "react-helmet"
import { FiGift } from "react-icons/fi"
import Footer from "@components/Footer"
import IceAnimation from "@components/IceAnimation"
import { toast } from "sonner"

const Auth = ({ path }) => {
  const [formData, setFormData] = useState({ email: "", password: "", name: "", referralId: "" })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSignup, setIsSignup] = useState(path === "signup")
  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [recaptchaValue, setRecaptchaValue] = useState(null)
  const recaptchaRef = useRef(null)

  const { loginUser, signupUser, googleLogin } = useAuthStore()
  const navigate = useNavigate()

  // Validate form fields
  const validateForm = useCallback(() => {
    const newErrors = {}

    // Name validation (signup only)
    if (isSignup && !formData.name.trim()) {
      newErrors.name = "Full name is required."
    } else if (isSignup && formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters."
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address."
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required."
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters."
    } else if (isSignup && !/[\W_]/.test(formData.password)) {
      newErrors.password = "Password must include at least one special character."
    }

    // Terms validation (signup only)
    if (isSignup && !termsAccepted) {
      newErrors.terms = "You must accept the Terms and Conditions."
    }

    if (!recaptchaValue) {
      newErrors.recaptcha = "Please complete the reCAPTCHA."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, isSignup, termsAccepted, recaptchaValue])

  // Handle input changes with debounced validation
  const handleInputChange = useCallback(e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear specific error when user starts typing
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }, [])

  // Handle terms checkbox
  const handleTermsChange = useCallback(() => {
    setTermsAccepted(prev => !prev)
    setErrors(prev => ({ ...prev, terms: undefined }))
  }, [])

  const onRecaptchaChange = value => {
    setRecaptchaValue(value)
    setErrors(prev => ({ ...prev, recaptcha: undefined }))
  }

  const handleGoogleLogin = useGoogleLogin({
    flow: "implicit",
    redirect_uri: "https://app.genwrite.co/login",
    onSuccess: async tokenResponse => {
      googleLogin({
        access_token: tokenResponse.access_token,
        referralId: formData.referralId,
      }).then(data => {
        toast.success("Google login successful!")

        const user = data.user || data?.data?.user || data

        if (isSignup) {
          navigate("/onboarding", { replace: true })
        } else {
          navigate("/dashboard", { replace: true })
        }
      })
    },
    onError: () => {
      toast.error("Google login initialization failed.")
      setRecaptchaValue(null)
      recaptchaRef.current?.reset()
    },
  })

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault()
      if (!validateForm()) return

      setLoading(true)

      try {
        const authPromise = isSignup
          ? signupUser({
              email: formData.email,
              password: formData.password,
              name: formData.name,
              captchaToken: recaptchaValue,
              referralId: formData.referralId,
            })
          : loginUser({
              email: formData.email,
              password: formData.password,
              captchaToken: recaptchaValue,
            })

        const { user } = await authPromise

        toast.success(isSignup ? "Signup successful!" : "Login successful!")

        // 🔥 Your new redirect rule
        if (isSignup) {
          navigate("/onboarding", { replace: true }) // New user onboarding flow
        } else {
          navigate("/dashboard", { replace: true }) // Returning user flow
        }
      } catch (err) {
        console.error("Auth error:", err)
        toast.error(err.message || "Authentication failed")
        setRecaptchaValue(null)
        recaptchaRef.current?.reset()
      } finally {
        setLoading(false)
      }
    },
    [formData, isSignup, loginUser, signupUser, navigate, validateForm, recaptchaValue]
  )

  // Update isSignup based on path
  useEffect(() => {
    setIsSignup(path === "signup")
    setFormData({ email: "", password: "", name: "" })
    setErrors({})
    setTermsAccepted(false)
    setRecaptchaValue(null)
  }, [path])

  // Pre-fill email from URL parameter
  // Pre-fill email and referral from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get("email")
    const referralParam = urlParams.get("referal") || urlParams.get("referral")

    if (emailParam) {
      setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }))
    }
    if (referralParam) {
      setFormData(prev => ({ ...prev, referralId: referralParam }))
    }
  }, [])

  const trialFeatures = [
    { icon: <PenTool className="w-4 h-4" />, text: "Advanced AI-generated blogs" },
    { icon: <Crown className="w-4 h-4" />, text: "Access to all 30+ premium templates" },
    { icon: <FaShieldAlt className="w-4 h-4" />, text: "Priority support & onboarding" },
    { icon: <TrendingUp className="w-4 h-4" />, text: "Advanced SEO & analytics tools" },
  ]

  const quickFeatures = [
    {
      icon: <Zap className="w-4 h-4" />,
      text: "SEO-Optimized Content",
      subtext: "Rank higher with AI-driven keyword integration.",
    },
    {
      icon: <CheckCircle className="w-4 h-4" />,
      text: "Automated Scheduling",
      subtext: "Plan and publish content effortlessly.",
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      text: "Human-Like Text",
      subtext: "Engaging, natural-sounding copy that converts.",
    },
  ]

  return (
    <div className="min-h-screen relative  bg-linear-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Ice Animation */}
      {/* <IceAnimation density={30} /> */}

      <Helmet>
        <title>{isSignup ? "Sign Up" : "Sign In"} | GenWrite</title>
      </Helmet>

      {/* 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large animated orbs - hidden on mobile to prevent overflow */}
        <motion.div
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1], x: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="hidden md:block absolute -top-40 -right-40 w-96 h-96 bg-linear-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: [360, 0], scale: [1, 1.2, 1], x: [0, -30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="hidden md:block absolute -bottom-40 -left-40 w-96 h-96 bg-linear-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
        />

        {/* Medium geometric shapes - smaller on mobile */}
        <motion.div
          animate={{ rotate: [0, 45, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="hidden lg:block absolute top-1/4 right-1/4 w-40 h-40 border-2 border-purple-300/15 rotate-45"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="hidden lg:block absolute bottom-1/3 left-1/3 w-32 h-32 bg-blue-500/5 rounded-full"
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute top-4 md:top-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <img
          src="/Images/logo_genwrite_2.webp"
          alt="GenWrite Logo"
          className="w-32 md:w-40 h-auto"
        />
      </motion.div>

      <div className="flex items-center justify-center min-h-screen px-4 pt-20 md:pt-28 pb-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* Desktop-only left section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block space-y-8"
          >
            {/* Main Hero Message */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold border border-purple-200"
              >
                <Sparkles className="w-4 h-4 fill-purple-700" />
                <span>The Future of Content Creation</span>
              </motion.div>
              <h1 className="text-5xl font-extrabold text-gray-900 leading-[1.1]">
                Scale your SEO with <br />
                <span className="bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Agentic AI Intelligence
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                Generate high-quality, human-like blog posts that rank. Join thousands of creators
                automating their content workflow.
              </p>
            </div>

            {/* 3-day trial card or Generic Feature Card */}
            {import.meta.env.VITE_SHOW_TRIAL_CARD !== "false" ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="relative bg-linear-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 border border-white/20 shadow-2xl overflow-hidden group"
              >
                {/* Abstract Patterns */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-white/20 transition-all duration-500" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl translate-y-8 -translate-x-8" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-lg flex items-center justify-center border border-white/30 shadow-inner">
                      <FiGift className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-0.5">
                        {import.meta.env.VITE_TRIAL_TEXT || "Start Your Trial Today"}
                      </h3>
                      <p className="text-purple-100 text-sm font-medium opacity-90">
                        {import.meta.env.VITE_TRIAL_SUBTEXT || "Immediate access"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    {trialFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm text-white/90">
                        <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center text-white/90">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="relative bg-linear-to-br from-blue-600 to-cyan-700 rounded-3xl p-8 border border-white/20 shadow-2xl overflow-hidden group"
              >
                {/* Abstract Patterns */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-white/20 transition-all duration-500" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl translate-y-8 -translate-x-8" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-lg flex items-center justify-center border border-white/30 shadow-inner">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-0.5">Premium Features</h3>
                      <p className="text-blue-100 text-sm font-medium opacity-90">
                        Unlock the power of AI content
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    {trialFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm text-white/90">
                        <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center text-white/90">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Why GenWrite Feature Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 gap-4"
            >
              {quickFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="bg-white/60 backdrop-blur-md rounded-lg p-5 border border-white shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-linear-to-br from-purple-500/10 to-blue-500/10 rounded-xl flex items-center justify-center text-purple-600 mb-3 border border-purple-100">
                    {feature.icon}
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{feature.text}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{feature.subtext}</p>
                </motion.div>
              ))}
              {/* Extra Feature for Grid Balance */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                className="bg-white/60 backdrop-blur-md rounded-lg p-5 border border-white shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="w-10 h-10 bg-linear-to-br from-emerald-500/10 to-teal-500/10 rounded-xl flex items-center justify-center text-emerald-600 mb-3 border border-emerald-100">
                  <FaShieldAlt className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Secure & Reliable</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enterprise-grade security for your brand's content.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Side - Auth Form + Feature Banner */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-md mx-auto space-y-6"
          >
            {/* Main Form Card */}
            <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-200/30 p-6 md:p-8 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-purple-400/10 to-blue-400/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-linear-to-tr from-blue-400/10 to-purple-400/10 rounded-full translate-y-12 -translate-x-12" />

              {/* Header */}
              <div className="relative mb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 250, damping: 15, delay: 0.2 }}
                  className="w-16 h-16 bg-linear-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <FaRocket className="text-white text-2xl" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                  className="text-3xl font-bold text-gray-900 mb-2"
                >
                  {isSignup ? "Join GenWrite" : "Welcome Back"}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="text-gray-600"
                >
                  {isSignup
                    ? "Start your AI writing journey today"
                    : "Continue creating amazing content"}
                </motion.p>
              </div>

              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="btn btn-block h-14 w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold rounded-lg text-base normal-case flex items-center justify-center shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
              >
                <FcGoogle className="text-xl mr-2" />
                <span>{isSignup ? "Sign up with Google" : "Continue with Google"}</span>
              </button>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="flex items-center my-6"
              >
                <hr className="flex-1 border-gray-200" />
                <span className="px-4 text-gray-400 text-sm font-medium">or</span>
                <hr className="flex-1 border-gray-200" />
              </motion.div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <AnimatePresence mode="wait">
                  {isSignup && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative"
                    >
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 z-10 w-5 h-5 flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`input border border-gray-300 w-full h-14 pl-12 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors rounded-lg text-base focus:outline-none focus:ring-0 ${
                          errors.name ? "input-error" : "border-gray-200 focus:border-gray-400"
                        }`}
                        aria-label="Full Name"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "name-error" : undefined}
                      />
                      <AnimatePresence>
                        {errors.name && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className="text-red-500 text-xs mt-1 ml-1"
                            id="name-error"
                          >
                            {errors.name}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 z-10 w-5 h-5 flex items-center justify-center">
                    <FaEnvelope className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`input border border-gray-300 w-full h-14 pl-12 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors rounded-lg text-base focus:outline-none focus:ring-0 ${
                      errors.email ? "input-error" : "border-gray-200 focus:border-gray-400"
                    }`}
                    aria-label="Email Address"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="text-red-500 text-xs mt-1 ml-1"
                        id="email-error"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 z-10 w-5 h-5 flex items-center justify-center">
                    <FaLock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`input border border-gray-300 w-full h-14 pl-12 pr-12 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors rounded-lg text-base focus:outline-none focus:ring-0 ${
                      errors.password ? "input-error" : "border-gray-200 focus:border-gray-400"
                    }`}
                    aria-label="Password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10 btn btn-sm btn-circle btn-ghost"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="text-red-500 text-xs mt-1 ml-1"
                        id="password-error"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Referral Code (Signup Only) */}
                <AnimatePresence>
                  {isSignup && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative"
                    >
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 z-10 w-5 h-5 flex items-center justify-center">
                        <FiGift className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="referralId"
                        placeholder="Referral Code (Optional)"
                        value={formData.referralId || ""}
                        onChange={handleInputChange}
                        className="input border border-gray-200 w-full h-14 pl-12 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors rounded-lg text-base focus:outline-none focus:ring-0 focus:border-gray-400"
                        aria-label="Referral Code"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Terms and Conditions Checkbox (Signup Only) */}
                {isSignup && (
                  <div className="relative">
                    <label className="flex items-center gap-2 text-gray-600 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={handleTermsChange}
                        className="checkbox checkbox-primary rounded-sm checkbox-sm"
                        aria-label="Accept Terms and Conditions"
                        aria-describedby={errors.terms ? "terms-error" : undefined}
                      />
                      <span>
                        I accept the{" "}
                        <a
                          href="/terms-and-conditions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline"
                        >
                          Terms and Conditions
                        </a>{" "}
                        and{" "}
                        <a
                          href="/privacy-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline"
                        >
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                    <AnimatePresence>
                      {errors.terms && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="text-red-600 text-xs mt-1"
                          id="terms-error"
                        >
                          {errors.terms}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="flex flex-col items-center justify-center gap-3">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={onRecaptchaChange}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      recaptchaRef.current?.reset()
                      setRecaptchaValue(null)
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-purple-600 transition-all bg-gray-50 hover:bg-purple-50 px-4 py-1.5 rounded-full border border-gray-200 hover:border-purple-200 active:scale-95"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>Reload Captcha</span>
                  </button>
                </div>
                <AnimatePresence>
                  {errors.recaptcha && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="text-red-600 text-xs text-center"
                      id="recaptcha-error"
                    >
                      {errors.recaptcha}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Forgot Password Link (Login Only) */}
                {!isSignup && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-purple-600 text-sm font-medium hover:text-purple-800 hover:underline transition-all duration-150"
                      aria-label="Forgot Password"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || (isSignup && !termsAccepted)}
                  className={`btn w-full btn-block h-14 border-none text-lg rounded-lg shadow-lg text-white normal-case bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl ${
                    loading || (isSignup && !termsAccepted) ? "btn-disabled opacity-70" : ""
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="loading loading-spinner loading-md"></span>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {isSignup ? (
                        <>
                          <FaRocket />
                          Create Account
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Sign In
                        </>
                      )}
                    </span>
                  )}
                </motion.button>
              </form>

              {/* Bottom Link */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-gray-600 mt-8"
              >
                {isSignup ? "Already have an account? " : "Don't have an account? "}
                <Link
                  to={isSignup ? "/login" : "/signup"}
                  className="text-purple-600 font-semibold hover:text-purple-800 transition-colors hover:underline"
                >
                  {isSignup ? "Sign in here" : "Sign up free"}
                </Link>
              </motion.p>

              {/* Trust Indicators */}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 pt-6 border-t border-gray-200"
              >
                <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <FaShieldAlt className="text-green-500" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>
                      {import.meta.env.VITE_SHOW_TRIAL_CARD === "false"
                        ? "Premium Quality"
                        : import.meta.env.VITE_TRIAL_BADGE_TEXT || "3-Day Trial"}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Auth
