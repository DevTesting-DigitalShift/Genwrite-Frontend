import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import {
  Mail,
  RotateCcw,
  Loader2,
  Inbox,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ArrowRight,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useResendVerification } from "@/api/queries/authQueries"
import useVerificationStore from "@store/useVerificationStore"
import useAuthStore from "@store/useAuthStore"

const RESEND_DELAY_SECONDS = 600 // 10 minutes

export default function EmailVerification() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { email: storeEmail, timerStartedAt, setTimerStartedAt } = useVerificationStore()

  const [loading, setLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [canResend, setCanResend] = useState(true)
  const [showOTP, setShowOTP] = useState(false)

  // Redirect if already verified
  useEffect(() => {
    if (user?.emailVerified) {
      navigate("/dashboard", { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    if (!timerStartedAt) {
      setResendCountdown(0)
      setCanResend(true)
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const elapsedSeconds = Math.floor((now - timerStartedAt) / 1000)
      const remaining = Math.max(0, RESEND_DELAY_SECONDS - elapsedSeconds)

      setResendCountdown(remaining)
      setCanResend(remaining === 0)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    if (timerStartedAt && !showOTP) {
      setShowOTP(true)
    }

    return () => clearInterval(interval)
  }, [timerStartedAt, showOTP])

  const { mutateAsync: resendEmail } = useResendVerification()

  const handleSendEmail = async () => {
    const emailToUse = storeEmail
    if (!emailToUse) {
      toast.error("User email not found. Please log in again.")
      return
    }

    try {
      setLoading(true)
      await resendEmail({ email: emailToUse })
      setTimerStartedAt(Date.now())
      setShowOTP(true)
      toast.success("Verification link sent!")
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send email")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = seconds => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}:${sec.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow border border-slate-100 p-8 overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center mt-2 mb-8 relative z-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
            Verify Your Email
          </h2>
          <p className="text-slate-500 text-sm max-w-[280px]">
            Please verify your email address to access all features of GenWrite.
          </p>
        </div>

        <div className="space-y-6 relative z-10">
          {/* Email Info Card */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Target Email
              </span>
            </div>
            <div className="text-lg font-semibold text-slate-800 break-all">
              {storeEmail || "No email selected"}
            </div>
          </div>

          {!showOTP ? (
            <button
              onClick={handleSendEmail}
              disabled={loading || !storeEmail}
              className="group w-full h-14 bg-[#3B4BB8] border-none hover:bg-[#3B4BB8]/90 text-white rounded-2xl font-bold flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>Send Verification Link</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Professional Instruction Card */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <div className="flex gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                    <Inbox className="w-6 h-6 text-[#3B4BB8]" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold text-lg">Check your inbox</h3>
                    <p className="text-xs text-slate-500 font-medium">Verification link sent to your email.</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200/60">
                   <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[#3B4BB8] text-xs font-bold">1</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Check your <span className="text-[#3B4BB8] font-bold">Spam</span> or <span className="text-[#3B4BB8] font-bold">Promotions</span> folder first.
                      </p>
                   </div>
                   <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[#3B4BB8] text-xs font-bold">2</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Mark it as <span className="text-emerald-600 font-bold uppercase">"Not Spam"</span> for regular updates.
                      </p>
                   </div>
                </div>

                {/* Expiry Note */}
                <div className="mt-6 flex items-center justify-center gap-2 py-2.5 bg-blue-50/50 rounded-xl border border-blue-100/50">
                  <Clock className="w-3.5 h-3.5 text-[#3B4BB8]/60" />
                  <span className="text-[10px] font-bold text-[#3B4BB8]/60 uppercase tracking-widest">Link is valid for the next 1 hour</span>
                </div>
              </div>

              {/* Resend Action */}
              <div className="space-y-3">
                <button
                  onClick={handleSendEmail}
                  disabled={!canResend || loading}
                  className="w-full h-14 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed group"
                >
                  {!canResend ? (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        <span className="text-sm font-mono text-slate-600">
                          {formatTime(resendCountdown)}
                        </span>
                      </div>
                      <span className="text-slate-400">Resend Link</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                      <span>Resend Verification Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="text-center mt-10 relative z-10 flex flex-col gap-4">
          <Link
            to="/pricing"
            className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Pricing
          </Link>

          <div className="h-px bg-slate-100 w-full" />

          <p className="text-[10px] text-slate-300 font-medium px-8 italic">
            Having trouble? Contact us at support@genwrite.co
          </p>
        </div>
      </motion.div>
    </div>
  )
}
