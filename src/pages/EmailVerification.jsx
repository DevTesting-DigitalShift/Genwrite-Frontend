import React, { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import toast from "@utils/toast"
import { Mail, CheckCircle2, RotateCcw, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react"
import { useResendVerification } from "@/api/queries/authQueries"
import { motion, AnimatePresence } from "framer-motion"

export default function EmailVerification() {
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [email, setEmail] = useState("")
  const [showOTP, setShowOTP] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [canResend, setCanResend] = useState(true)
  const [otpCode, setOtpCode] = useState("")

  const { email: emailParam } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [emailParam])

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

  const { mutateAsync: resendEmail } = useResendVerification()

  const handleSendCode = async e => {
    if (e) e.preventDefault()
    if (!email) {
      toast.error("Please enter your email address")
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

  const handleVerify = async e => {
    if (e) e.preventDefault()
    try {
      setLoading(true)

      // DEMO ONLY — replace with real API later
      if (otpCode === "123456") {
        setVerified(true)
        toast.success("Email Verified 🎉")
        setTimeout(() => navigate("/dashboard"), 1200)
      } else {
        toast.error("Invalid verification code.")
      }
    } catch (err) {
      toast.error("Verification failed.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    await handleSendCode()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px] opacity-40 -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] opacity-40 -ml-64 -mb-64" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-[40px] p-10 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] border border-slate-50">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-slate-900 rounded-[28px] flex items-center justify-center mb-6 shadow-2xl shadow-slate-200">
              {verified ? (
                <CheckCircle2 className="text-emerald-400 w-10 h-10" />
              ) : (
                <ShieldCheck className="text-blue-400 w-10 h-10" />
              )}
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              {verified ? "Identity Verified" : "Secure Access"}
            </h1>
            <p className="text-slate-500 font-medium">
              {verified
                ? "Full access granted. Redirecting..."
                : "Verify your email to secure your account."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!showOTP ? (
              <motion.form
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendCode}
                className="space-y-6"
              >
                <div className="form-control">
                  <label className="label">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Primary Email
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-5 w-5 h-5 text-slate-300" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input input-bordered w-full h-16 pl-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-800"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full h-16 rounded-2xl bg-slate-900 border-none text-white font-black shadow-xl hover:bg-black transition-all group"
                >
                  {loading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    <>
                      Request Access Link
                      <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerify}
                className="space-y-6"
              >
                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                  <div className="bg-white rounded-xl p-2 shadow-sm border border-blue-100">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 truncate max-w-[200px]">
                      {email}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Check your inbox for a 6-digit code.
                    </p>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Verification Code
                    </span>
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="input input-bordered w-full h-16 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 text-center text-2xl font-black tracking-[0.5em] transition-all"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="btn btn-primary w-full h-16 rounded-2xl bg-slate-900 border-none text-white font-black shadow-xl hover:bg-black transition-all"
                  >
                    {loading ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      "Confirm Verification"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!canResend || loading}
                    className="btn btn-ghost w-full h-14 rounded-2xl text-slate-500 font-bold uppercase tracking-widest text-[10px]"
                  >
                    {resendCountdown > 0 ? (
                      <span className="flex items-center gap-2">
                        <RotateCcw className="w-3 h-3 animate-spin" />
                        Retransmit in {resendCountdown}s
                      </span>
                    ) : (
                      "Retransmit Code"
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black uppercase tracking-[0.2em] text-[10px] transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Abort & Return
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
