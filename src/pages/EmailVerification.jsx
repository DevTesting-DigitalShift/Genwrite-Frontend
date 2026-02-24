import React, { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import {
  Mail,
  CheckCircle2,
  RotateCcw,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Loader2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useResendVerification } from "@/api/queries/authQueries"

export default function EmailVerification() {
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [email, setEmail] = useState("")
  const [showOTP, setShowOTP] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [canResend, setCanResend] = useState(true)

  const { email: emailParam } = useParams()
  const navigate = useNavigate()

  // Load email from URL param but DO NOT show OTP yet
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [emailParam])

  // Resend countdown logic
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [resendCountdown])

  const startResendCountdown = () => {
    setResendCountdown(60)
    setCanResend(false)
  }

  // STEP 1 → send code
  const { mutateAsync: resendEmail } = useResendVerification()

  const handleSendCode = async e => {
    if (e) e.preventDefault()

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      toast.error("Please enter a valid email address")
      return
    }

    try {
      setLoading(true)
      await resendEmail({ email })

      startResendCountdown()
      setShowOTP(true)
      toast.success("Verification link sent to your inbox!")
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to send verification email")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    await handleSendCode()
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center mt-2 mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="text-blue-600 w-8 h-8" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-semibold text-slate-800">Verify Your Email</h2>
        </div>

        <div className="space-y-6">
          {/* Email Input */}
          <div className="form-control w-full relative">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input input-bordered w-full h-12 text-base rounded-lg border-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* STEP 1 — SEND CODE SCREEN */}
          {!showOTP && (
            <button
              onClick={handleSendCode}
              disabled={loading}
              className="btn bg-blue-600 hover:bg-blue-700 text-white w-full h-12 rounded-lg border-none text-base font-medium flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Link"}
            </button>
          )}

          {/* STEP 2 — OTP SCREEN */}
          {showOTP && (
            <>
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex gap-3 text-sm flex-col">
                <div className="font-semibold">{email}</div>
                <div className="text-slate-600">Check your inbox and click on link.</div>
              </div>

              <button
                onClick={handleResend}
                disabled={!canResend || loading}
                className="btn btn-outline border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 w-full h-12 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                {resendCountdown > 0 ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    <span>{resendCountdown}s</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Resend</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Back to pricing */}
        <div className="text-center mt-6">
          <Link
            to="/pricing"
            className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  )
}
