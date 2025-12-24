import React, { useEffect, useState, useCallback } from "react"
import { useDispatch } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { googleLogin, loginUser, signupUser } from "../../store/slices/authSlice"
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
import { Sparkles, Zap, PenTool, CheckCircle, Crown, TrendingUp } from "lucide-react"
import { Helmet } from "react-helmet"
import { message } from "antd"
import { FiGift } from "react-icons/fi"
import Footer from "@components/Footer"
import CountdownTimer from "@components/CountdownTimer"
import IceAnimation from "@components/IceAnimation"

const Auth = ({ path }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSignup, setIsSignup] = useState(path === "signup")
  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [recaptchaValue, setRecaptchaValue] = useState(null)

  const dispatch = useDispatch()
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
      dispatch(googleLogin({ access_token: tokenResponse.access_token }))
        .unwrap()
        .then(data => {
          message.success("Google login successful!")

          const user = data.user || data?.data?.user || data

          if (!user.emailVerified) {
            navigate(`/email-verify/${user.email}`, { replace: true })
            return
          }

          if (isSignup) {
            navigate("/onboarding", { replace: true })
          } else {
            navigate("/dashboard", { replace: true })
          }
        })
    },
    onError: () => {
      message.error("Google login initialization failed.")
      setRecaptchaValue(null)
    },
  })

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault()
      if (!validateForm()) return

      setLoading(true)

      try {
        const action = isSignup
          ? signupUser({
              email: formData.email,
              password: formData.password,
              name: formData.name,
              captchaToken: recaptchaValue,
            })
          : loginUser({
              email: formData.email,
              password: formData.password,
              captchaToken: recaptchaValue,
            })

        const { user } = await dispatch(action).unwrap()

        message.success(isSignup ? "Signup successful!" : "Login successful!")

        // ❗ If email not verified → block everything
        if (!user.emailVerified) {
          navigate(`/email-verify/${user.email}`, { replace: true })
          return
        }

        // 🔥 Your new redirect rule
        if (isSignup) {
          navigate("/onboarding", { replace: true }) // New user onboarding flow
        } else {
          navigate("/dashboard", { replace: true }) // Returning user flow
        }
      } catch (err) {
        console.error("Auth error:", err)
        message.error(err.data?.message || err?.message || "Signup failed")
        setRecaptchaValue(null)
      } finally {
        setLoading(false)
      }
    },
    [formData, isSignup, dispatch, navigate, validateForm, recaptchaValue]
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
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get("email")

    if (emailParam) {
      setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }))
    }
  }, [])

  const trialFeatures = [
    { icon: <PenTool className="w-4 h-4" />, text: "Advanced AI-generated blogs" },
    { icon: <Crown className="w-4 h-4" />, text: "Access to all 30+ premium templates" },
    { icon: <FaShieldAlt className="w-4 h-4" />, text: "Priority support & onboarding" },
    { icon: <TrendingUp className="w-4 h-4" />, text: "Advanced SEO & analytics tools" },
  ]

  const quickFeatures = [
    { icon: <Zap className="w-4 h-4" />, text: "SEO-Optimized Content" },
    { icon: <CheckCircle className="w-4 h-4" />, text: "Automated Scheduling" },
    { icon: <Sparkles className="w-4 h-4" />, text: "Human-Like Text" },
  ]

  return (
    <div className="min-h-screen relative  bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Ice Animation */}
      <IceAnimation density={30} />

      <Helmet>
        <title>{isSignup ? "Sign Up" : "Sign In"} | GenWrite</title>
      </Helmet>

      {/* 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large animated orbs - hidden on mobile to prevent overflow */}
        <motion.div
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1], x: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="hidden md:block absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: [360, 0], scale: [1, 1.2, 1], x: [0, -30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="hidden md:block absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
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

        {/* Christmas decorations with purple/blue tint - smaller and repositioned on mobile */}
        <div
          className="absolute top-20 left-4 md:left-10 text-3xl md:text-6xl opacity-10 md:opacity-15"
          style={{ filter: "hue-rotate(240deg)" }}
        >
          🎄
        </div>
        <div
          className="absolute top-1/3 right-4 md:right-20 text-2xl md:text-5xl opacity-8 md:opacity-10"
          style={{ filter: "hue-rotate(240deg)" }}
        >
          🎁
        </div>
        <div className="hidden md:block absolute bottom-1/4 left-1/4 text-5xl opacity-12">⭐</div>
        <div className="hidden md:block absolute top-2/3 right-1/3 text-4xl opacity-15">🔔</div>
        <div className="absolute bottom-40 right-4 md:right-10 text-3xl md:text-6xl opacity-15 md:opacity-20 text-blue-300">
          ❄️
        </div>
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute top-4 md:top-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <img
          src="/Images/logo_genwrite_2.png"
          alt="GenWrite Logo"
          className="w-32 md:w-40 h-auto"
        />
      </motion.div>

      <div className="flex items-center justify-center min-h-screen px-4 pt-20 md:pt-28 pb-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* Left Side - Countdown + Subscription Features */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden mb-6" /* mobile-only */
          >
            <CountdownTimer
              startDate="2025-12-01T00:00:00"
              endDate="2026-01-01T23:59:59"
              discount="50%"
            />
          </motion.div>

          {/* Desktop-only left section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block space-y-6"
          >
            <CountdownTimer
              startDate="2025-12-01T00:00:00"
              endDate="2026-01-01T23:59:59"
              discount="50%"
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-5 shadow-lg backdrop-blur-sm bg-opacity-95"
            >
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Why GenWrite?
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {quickFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center"
                  >
                    <div className="w-8 h-8 bg-white/25 rounded-lg flex items-center justify-center text-white mx-auto mb-2">
                      {feature.icon}
                    </div>
                    <p className="text-white text-xs font-medium leading-tight">{feature.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            {/* 7-day trial card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative bg-white/85 backdrop-blur-lg rounded-2xl p-6 border-2 border-purple-200/50 shadow-lg "
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-300/15 to-blue-300/15 rounded-full blur-2xl -translate-y-8 translate-x-8" />

              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <FiGift className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Try Premium Plan FREE for 3 Days
                    </h3>
                    <p className="text-sm text-purple-700 font-semibold">
                      No credit card • Cancel anytime • Full access
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {trialFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                        {feature.icon}
                      </div>
                      <span>{feature.text}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-purple-200">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Start right after signup and enjoy complete access for 3 days. Only pay if you
                    love it. Plus, get 50% OFF with our Christmas special! 🎄
                  </p>
                </div>
              </div>
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
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/10 to-purple-400/10 rounded-full translate-y-12 -translate-x-12" />

              {/* Header */}
              <div className="relative mb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 250, damping: 15, delay: 0.2 }}
                  className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
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
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-2xl text-gray-700 hover:border-purple-300 hover:shadow-lg transition-all duration-200 mb-6 font-medium disabled:opacity-50"
              >
                <FcGoogle className="text-2xl" />
                <span>{isSignup ? "Sign up with Google" : "Continue with Google"}</span>
              </motion.button>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="flex items-center my-6"
              >
                <hr className="flex-1 border-gray-200" />
                <span className="px-4 text-gray-500 text-sm font-medium">or</span>
                <hr className="flex-1 border-gray-200" />
              </motion.div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <AnimatePresence mode="wait">
                  {isSignup && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative"
                    >
                      <div className="absolute top-4 left-4 text-gray-500 z-2">
                        <FaUser />
                      </div>
                      <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-2 bg-gray-50/80 border-2 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 ${
                          errors.name ? "border-red-500" : "border-gray-200"
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
                            className="text-red-600 text-xs mt-1"
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
                  <div className="absolute top-4 left-4 text-gray-500 z-2">
                    <FaEnvelope />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-2 bg-gray-50/80 border-2 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 ${
                      errors.email ? "border-red-500" : "border-gray-200"
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
                        className="text-red-600 text-xs mt-1"
                        id="email-error"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <div className="absolute top-4 left-4 text-gray-500 z-2">
                    <FaLock />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-12 py-2 bg-gray-50/80 border-2 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 ${
                      errors.password ? "border-red-500" : "border-gray-200"
                    }`}
                    aria-label="Password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 transition-colors duration-150 z-2"
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
                        className="text-red-600 text-xs mt-1"
                        id="password-error"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Terms and Conditions Checkbox (Signup Only) */}
                {isSignup && (
                  <div className="relative">
                    <label className="flex items-center gap-2 text-gray-600 text-sm">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={handleTermsChange}
                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
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

                <div className="flex justify-center">
                  <ReCAPTCHA
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={onRecaptchaChange}
                  />
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
                  className={`w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                    loading || (isSignup && !termsAccepted)
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:from-purple-700 hover:to-blue-700"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 rounded-full border-t-white"
                      />
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
                    <span>3-Day Trial</span>
                  </div>
                  {isSignup && (
                    <div className="flex items-center gap-1">
                      <FiGift className="w-3 h-3 text-purple-500" />
                      <span>50% Off Sale</span>
                    </div>
                  )}
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
