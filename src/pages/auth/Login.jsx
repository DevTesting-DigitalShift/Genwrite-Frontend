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
import { Sparkles, Zap, PenTool, CheckCircle } from "lucide-react"
import { Helmet } from "react-helmet"
import { message } from "antd"

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

          console.log(data.user)
          console.log(!user.emailVerified)

          if (!user.emailVerified) {
            navigate(`/email-verify/${user.email}`, { replace: true })
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

        // only dispatch ONCE
        const { user } = await dispatch(action).unwrap()

        message.success(isSignup ? "Signup successful!" : "Login successful!")

        // 🔥 Correct redirect logic
        if (!user.emailVerified) {
          navigate(`/email-verify/${user.email}`, { replace: true })
        } else {
          navigate("/dashboard", { replace: true })
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

  const features = [
    { icon: <PenTool className="w-5 h-5" />, text: "AI-Powered Blog Generator" },
    { icon: <Zap className="w-5 h-5" />, text: "SEO-Optimized Content" },
    { icon: <FaShieldAlt className="w-5 h-5" />, text: "Human-Like Text Enhancement" },
    { icon: <CheckCircle className="w-5 h-5" />, text: "Automated Content Scheduling" },
    { icon: <FaGoogle className="w-5 h-5" />, text: "Competitor Analysis Insights" },
    { icon: <Sparkles className="w-5 h-5" />, text: "Performance & Keyword Analytics" },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Helmet>
        <title>{isSignup ? "Sign Up" : "Sign In"} | GenWrite</title>
      </Helmet>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: [360, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10 mb-2"
      >
        <img src="/Images/logo_genwrite_2.png" alt="GenWrite Logo" className="w-40 h-auto" />
      </motion.div>

      <div className="flex items-center justify-center min-h-screen px-4 pt-28 pb-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Features & Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block space-y-8"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered Writing Platform
              </div>
              <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                Elevate Your
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}
                  Writing
                </span>
                <br />
                with AI Precision
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Harness AI to generate compelling, professional-grade content effortlessly.
                Streamline your workflow, maximize productivity, and produce high-quality writing
                that engages your audience.
              </p>
            </div>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                    {feature.icon}
                  </div>
                  <span className="font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Start for Free</h3>
                  <p className="text-sm text-gray-600">No credit card required</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Begin with 200 complimentary AI credits and explore all features risk-free. Perfect
                for evaluating the platform and experiencing AI-assisted content creation firsthand.
              </p>
            </div>
          </motion.div>

          {/* Right Side - Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-cyan-400/10 rounded-full translate-y-12 -translate-x-12" />

              {/* Header */}
              <div className="relative mb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                  className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                  <FaRocket className="text-white text-2xl" />
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {isSignup ? "Join GenWrite" : "Welcome Back"}
                </h2>
                <p className="text-gray-600">
                  {isSignup
                    ? "Start your AI writing journey today"
                    : "Continue creating amazing content"}
                </p>
              </div>

              {/* Google Button */}
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border-2 border-gray-200 rounded-2xl text-gray-700 hover:border-gray-300 hover:shadow-lg transition-all duration-300 mb-6 font-medium disabled:opacity-50"
              >
                <FcGoogle className="text-2xl" />
                <span>{isSignup ? "Sign up with Google" : "Continue with Google"}</span>
              </motion.button>

              {/* Divider */}
              <div className="flex items-center my-6">
                <hr className="flex-1 border-gray-200" />
                <span className="px-4 text-gray-500 text-sm font-medium">or</span>
                <hr className="flex-1 border-gray-200" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <AnimatePresence>
                  {isSignup && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
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
                        className={`w-full pl-12 pr-4 py-2 bg-gray-50/80 border-2 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
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
                    className={`w-full pl-12 pr-4 py-2 bg-gray-50/80 border-2 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
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
                    className={`w-full pl-12 pr-12 py-2 bg-gray-50/80 border-2 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                      errors.password ? "border-red-500" : "border-gray-200"
                    }`}
                    aria-label="Password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 transition-colors z-2"
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
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        aria-label="Accept Terms and Conditions"
                        aria-describedby={errors.terms ? "terms-error" : undefined}
                      />
                      <span>
                        I accept the{" "}
                        <a
                          href="/terms-and-conditions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Terms and Conditions
                        </a>{" "}
                        and{" "}
                        <a
                          href="/privacy-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
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
                      className="text-blue-600 text-sm font-medium hover:text-blue-800 hover:underline transition-all"
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
                  className={`w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                    loading || (isSignup && !termsAccepted)
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:from-blue-700 hover:to-purple-700"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
                transition={{ delay: 0.8 }}
                className="text-center text-gray-600 mt-8"
              >
                {isSignup ? "Already have an account? " : "Don't have an account? "}
                <Link
                  to={isSignup ? "/login" : "/signup"}
                  className="text-blue-600 font-semibold hover:text-blue-800 transition-colors hover:underline"
                >
                  {isSignup ? "Sign in here" : "Sign up free"}
                </Link>
              </motion.p>

              {/* Trust Indicators */}
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="mt-6 pt-6 border-t border-gray-200"
                >
                  <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <FaShieldAlt className="text-green-500" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Free Start</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-blue-500" />
                      <span>Instant Access</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      <footer className="w-full bg-white border-t border-gray-300 py-6 px-4 text-sm text-gray-700 relative">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto">
          {/* Copyright */}
          <p className="text-center sm:text-left mb-2 sm:mb-0">
            &copy; {new Date().getFullYear()} <strong>GenWrite</strong>. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex flex-row items-center gap-2 sm:gap-4 text-blue-500">
            <a
              href="/terms-and-conditions"
              target="_blank"
              className="transition hover:text-blue-700 hover:underline"
            >
              Terms of Service
            </a>
            <span className="hidden sm:inline text-gray-400">|</span>
            <a
              href="/privacy-policy"
              target="_blank"
              className="transition hover:text-blue-700 hover:underline"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Auth
