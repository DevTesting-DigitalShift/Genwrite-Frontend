import React, { useState, useEffect } from "react"
import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Shield,
  Key,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { resetPassword } from "@store/slices/authSlice"
import { useDispatch } from "react-redux"
import { toast } from "react-toastify"

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({})
  const [token, setToken] = useState("")
  const location = useLocation()
  const dispatch = useDispatch()

  useEffect(() => {
    const resetToken = searchParams.get("token")
    if (!resetToken) {
      navigate("/forgot-password")
    } else {
      setToken(resetToken)
    }
  }, [searchParams, navigate])

  const validatePassword = (pwd) => {
    const errors = []
    if (pwd.length < 8) errors.push("At least 8 characters")
    if (!/[A-Z]/.test(pwd)) errors.push("One uppercase letter")
    if (!/[a-z]/.test(pwd)) errors.push("One lowercase letter")
    if (!/\d/.test(pwd)) errors.push("One number")
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errors.push("One special character")
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}

    // Password validation
    const passwordErrors = validatePassword(password)
    if (passwordErrors.length > 0) {
      newErrors.password = `Password must contain: ${passwordErrors.join(", ")}`
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) return

    setLoading(true)

    // Get token from query params
    const query = new URLSearchParams(location.search)
    const token = query.get("token")

    if (!token) {
      setErrors({ token: "Invalid or missing token" })
      setLoading(false)
      return
    }

    try {
      const res = await dispatch(resetPassword({ token, newPassword: password })).unwrap()
      console.log("Password reset successful:", res)
      if (res) {
        toast.success(res)
        setSuccess(true)
        navigate("/login", { replace: true })
      }
    } catch (err) {
      console.error("Reset password error:", err)
      setErrors({ server: err }) // e.g., "Invalid or expired token"
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = (pwd) => {
    const errors = validatePassword(pwd)
    const strength = 5 - errors.length

    if (strength <= 1) return { level: "weak", color: "bg-red-500", text: "Weak" }
    if (strength <= 3) return { level: "medium", color: "bg-yellow-500", text: "Medium" }
    return { level: "strong", color: "bg-green-500", text: "Strong" }
  }

  const passwordStrength = getPasswordStrength(password)

  if (success) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              rotate: [360, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl"
          />
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10"
        >
          <img src="/Images/logo_genwrite_2.png" alt="GenWrite Logo" className="w-40 h-auto" />
        </motion.div>

        <div className="flex items-center justify-center min-h-screen px-4 pt-20 pb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center relative overflow-hidden"
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full -translate-y-16 translate-x-16" />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              Password Reset Successful!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-8 leading-relaxed"
            >
              Your password has been successfully reset. You can now sign in with your new password.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8"
            >
              <div className="flex items-center gap-3 text-green-800">
                <Shield className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">
                  Your account is now secure with the new password. Make sure to keep it safe!
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link
                to="/login"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Continue to Sign In
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: [360, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <img src="/Images/logo_genwrite_2.png" alt="GenWrite Logo" className="w-40 h-auto" />
      </motion.div>

      <div className="flex items-center justify-center min-h-screen px-4 pt-20 pb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-cyan-400/10 rounded-full translate-y-12 -translate-x-12" />

          {/* Header */}
          <div className="relative mb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <Key className="text-white text-2xl" />
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
            <p className="text-gray-600">Enter your new password below to secure your account.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <div className="absolute top-4 left-4 text-gray-400 z-10">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrors((prev) => ({ ...prev, password: "" }))
                  }}
                  className={`w-full pl-12 pr-12 py-4 bg-gray-50/80 border-2 rounded-2xl text-gray-800 placeholder-gray-500 focus:bg-white focus:shadow-lg outline-none transition-all duration-300 ${
                    errors.password
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{
                          width: `${
                            getPasswordStrength(password).level === "weak"
                              ? 33
                              : getPasswordStrength(password).level === "medium"
                              ? 66
                              : 100
                          }%`,
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength.level === "weak"
                          ? "text-red-600"
                          : passwordStrength.level === "medium"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}

              {errors.password && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-red-600 text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.password}
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute top-4 left-4 text-gray-400 z-10">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }))
                  }}
                  className={`w-full pl-12 pr-12 py-4 bg-gray-50/80 border-2 rounded-2xl text-gray-800 placeholder-gray-500 focus:bg-white focus:shadow-lg outline-none transition-all duration-300 ${
                    errors.confirmPassword
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {errors.confirmPassword && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-red-600 text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.confirmPassword}
                </motion.div>
              )}
            </div>

            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                loading
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
                  <span>Resetting Password...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5" />
                  Reset Password
                </span>
              )}
            </motion.button>
          </form>

          {/* Security Requirements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 pt-6 border-t border-gray-200"
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Password Requirements:</h3>
            <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
              <div
                className={`flex items-center gap-2 ${
                  password.length >= 8 ? "text-green-600" : ""
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    password.length >= 8 ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                At least 8 characters
              </div>
              <div
                className={`flex items-center gap-2 ${
                  /[A-Z]/.test(password) ? "text-green-600" : ""
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    /[A-Z]/.test(password) ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                One uppercase letter
              </div>
              <div
                className={`flex items-center gap-2 ${
                  /[a-z]/.test(password) ? "text-green-600" : ""
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    /[a-z]/.test(password) ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                One lowercase letter
              </div>
              <div
                className={`flex items-center gap-2 ${/\d/.test(password) ? "text-green-600" : ""}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    /\d/.test(password) ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                One number
              </div>
              <div
                className={`flex items-center gap-2 ${
                  /[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-600" : ""
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    /[!@#$%^&*(),.?":{}|<>]/.test(password) ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                One special character
              </div>
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 pt-6 border-t border-gray-200"
          >
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-green-500" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-blue-500" />
                <span>Encrypted</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>Protected</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default ResetPassword
