import { asApiError } from "@/types/api"
import { apiErrorMessage } from "@/types/api"
import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { RotateCcw, Loader2, KeyRound, ShieldCheck, ChevronLeft, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { authQuery } from "@api/Auth/Auth.query"
import useVerificationStore from "@store/useVerificationStore"
import useAuthStore from "@store/useAuthStore"
import { consumePostAuthRedirect } from "@utils/postAuthRedirect"

const RESEND_DELAY_SECONDS = 600 // 10 minutes
const CODE_LENGTH = 6

export default function EmailVerification() {
  const navigate = useNavigate()
  const { user, loadAuthenticatedUser } = useAuthStore()
  const { timerStartedAt, setTimerStartedAt } = useVerificationStore()

  const [sending, setSending] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [canResend, setCanResend] = useState(true)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [code, setCode] = useState("")

  // Redirect if already verified
  useEffect(() => {
    if (user?.emailVerified) {
      navigate(consumePostAuthRedirect() || "/dashboard", { replace: true })
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

    if (timerStartedAt && !showCodeInput) {
      setShowCodeInput(true)
    }

    return () => clearInterval(interval)
  }, [timerStartedAt, showCodeInput])

  const { mutateAsync: resendEmail } = authQuery.useResendVerification()
  const { mutateAsync: verifyEmail, isPending: isVerifying } = authQuery.useVerifyEmail()

  const handleSendEmail = async () => {
    try {
      setSending(true)
      await resendEmail()
      setTimerStartedAt(Date.now())
      setShowCodeInput(true)
      toast.success("Verification code sent!")
    } catch (rawErr) {
      const err = asApiError(rawErr)
      toast.error(apiErrorMessage(err, "Failed to send code"))
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) return

    try {
      const data = await verifyEmail({ code })
      if (!data?.success) {
        toast.error(data?.message || "Verification failed")
        return
      }
      toast.success(data.message || "Email verified!")
      useVerificationStore.getState().clearVerificationState()
      await loadAuthenticatedUser()
      navigate(consumePostAuthRedirect() || "/dashboard", { replace: true })
    } catch (rawErr) {
      const err = asApiError(rawErr)
      toast.error(apiErrorMessage(err, "Invalid or expired code"))
    }
  }

  const formatTime = (seconds: number) => {
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
                Account Email
              </span>
            </div>
            <div className="text-lg font-semibold text-slate-800 break-all">
              {user?.email || "No email found"}
            </div>
          </div>

          {!showCodeInput ? (
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sending || !user?.email}
              className="group w-full h-14 bg-[#3B4BB8] border-none hover:bg-[#3B4BB8]/90 text-white rounded-2xl font-bold flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Code Entry Card */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <div className="flex gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                    <KeyRound className="w-6 h-6 text-[#3B4BB8]" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold text-lg">Enter your code</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Check your inbox (and spam folder) for a 6-character code — it expires
                      in 15 minutes.
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  inputMode="text"
                  autoComplete="one-time-code"
                  maxLength={CODE_LENGTH}
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  placeholder="aZ3fK9"
                  className="w-full h-16 text-center text-2xl font-black tracking-[0.3em] bg-white border-2 border-slate-200 focus:border-[#3B4BB8] rounded-2xl outline-none text-slate-800 placeholder:text-slate-300 placeholder:font-normal"
                />

                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={code.length !== CODE_LENGTH || isVerifying}
                  className="mt-4 w-full h-14 bg-[#3B4BB8] hover:bg-[#3B4BB8]/90 border-none text-white rounded-2xl font-bold flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Email"}
                </button>
              </div>

              {/* Resend Action */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={!canResend || sending}
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
                      <span className="text-slate-400">Resend Code</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                      <span>Resend Code</span>
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
