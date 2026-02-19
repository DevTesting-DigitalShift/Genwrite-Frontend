import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Heart,
  Gift,
  ArrowLeft,
  CheckCircle2,
  Star,
  Sparkles,
  Crown,
  Zap,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ChevronRight,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import toast from "@utils/toast"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { cancelStripeSubscription } from "@api/otherApi"
import useAuthStore from "@store/useAuthStore"
import { useUpdateProfileMutation } from "@api/queries/userQueries"
import { sendCancellationRelatedEvent } from "@utils/stripeGTMEvents"

const CancellationPage = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { user } = useAuthStore()
  const { mutateAsync: updateProfileMutate } = useUpdateProfileMutation()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()

  useEffect(() => {
    if (
      user?.subscription?.plan === "free" ||
      ["unpaid", "cancelled"].includes(user?.subscription?.status) ||
      user?.subscription?.status === "trialing" ||
      user?.subscription?.cancelAt
    ) {
      navigate("/dashboard", { replace: true })
    }
  }, [user, navigate])

  const handleStay = async () => {
    try {
      setIsProcessing(true)
      await updateProfileMutate({ "subscription.discountApplied": 30 })
      setShowSuccess(true)
      sendCancellationRelatedEvent(user, "discount")
      toast.success("30% Bonus Credits activated!")
    } catch (err) {
      console.error("Error applying discount:", err)
      toast.error("Failed to apply bonus, please try again later.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    handlePopup({
      title: "Confirm Cancellation",
      description: (
        <div className="space-y-4">
          <p className="text-slate-600 font-medium leading-relaxed">
            Are you sure you want to terminate your subscription? You'll continue to enjoy all
            premium benefits <strong>until the end of your current cycle</strong>.
          </p>
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
            <AlertTriangle className="text-rose-500 w-5 h-5 shrink-0" />
            <p className="text-rose-800 text-xs font-bold">
              WARNING: You will lose your 30% retention bonus offer if you proceed.
            </p>
          </div>
        </div>
      ),
      icon: <XCircle className="w-12 h-12 text-rose-500" />,
      onConfirm: async () => {
        try {
          setIsProcessing(true)
          await cancelStripeSubscription()
          sendCancellationRelatedEvent(user, "cancel")
          toast.success("Subscription schedule updated for termination")
          navigate("/dashboard")
        } catch (err) {
          console.error("Error cancelling subscription:", err)
          toast.error("Failed to update status, please try again.")
        } finally {
          setIsProcessing(false)
        }
      },
      confirmText: "Eject Anyway",
      cancelText: "Stay with GenWrite",
    })
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-inter">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100 rounded-full blur-[120px] opacity-40 -mr-64 -mt-64" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-12 text-center relative overflow-hidden border border-white"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-200">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
            You're One of Us! 🚀
          </h1>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">
            Spectral link maintained. Your 30% credit bonus has been successfully integrated into
            your next billing cycle.
          </p>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 mb-10 flex items-center justify-center gap-4 group">
            <Gift className="w-6 h-6 text-emerald-600 transition-transform group-hover:rotate-12" />
            <span className="text-emerald-900 font-black uppercase tracking-widest text-xs">
              30% Bonus Credits Applied
            </span>
          </div>

          <Link
            to="/dashboard"
            className="btn btn-primary w-full h-16 rounded-2xl bg-slate-900 border-none text-white font-black shadow-xl hover:bg-black transition-all gap-3"
          >
            Enter Dashboard Matrix
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-inter relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Orbs */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-40 animate-pulse" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-100 rounded-full blur-[100px] opacity-40" />

      <div className="max-w-5xl w-full relative z-10">
        {/* Hero Section */}
        <section className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-rose-100 mb-4"
          >
            <AlertTriangle className="w-3 h-3" /> Exclusive Retention offer Detected
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter"
          >
            Leaving So <span className="text-blue-600 underline decoration-blue-200">Soon?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-500 font-medium"
          >
            Don't miss out on our{" "}
            <span className="text-slate-900 font-black">30% Neural Credit Boost</span> for your next
            cycle.
          </motion.p>
        </section>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[48px] p-10 shadow-2xl shadow-slate-200/50 border border-white space-y-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8">
              <Crown className="w-8 h-8 text-amber-100 opacity-50 group-hover:scale-125 transition-transform" />
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Gift className="text-rose-500" />
                The Loyalty Reward
              </h2>

              <div className="space-y-4">
                {[
                  "30% Extra Neural Credits on next billing",
                  "Priority Spectrum Support Access",
                  "Early Access to GPT-5 Pro Features",
                  "No commitment - keep the bonus and cancel later",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 transition-colors">
                      <Star className="w-4 h-4 text-blue-600 group-hover:text-white" />
                    </div>
                    <span className="text-slate-700 font-bold text-sm tracking-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <button
                onClick={handleStay}
                disabled={isProcessing}
                className="btn btn-primary w-full h-16 rounded-2xl bg-slate-900 border-none text-white font-black shadow-xl hover:bg-black transition-all group scale-[1.02]"
              >
                {isProcessing ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <>
                    Upgrade My Loyalty • Get 30% More
                    <Zap className="w-5 h-5 ml-2 text-amber-400 group-hover:rotate-12 transition-transform" />
                  </>
                )}
              </button>

              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="btn btn-ghost w-full h-14 rounded-2xl text-slate-400 hover:text-rose-500 font-black uppercase tracking-widest text-[10px]"
              >
                Proceed to Cancellation Sequence
              </button>
            </div>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Why maintain sync?
            </h2>

            <div className="grid gap-6">
              {[
                {
                  icon: <Sparkles className="text-blue-600" />,
                  title: "Semantic Content Engine",
                  desc: "High-entropy text generation that converts like magic.",
                },
                {
                  icon: <BrainCircuit className="text-purple-600" />,
                  title: "Neural Research Core",
                  desc: "Sync PDFs and webpages to build the ultimate research base.",
                },
                {
                  icon: <ShieldCheck className="text-emerald-600" />,
                  title: "Enterprise Security",
                  desc: "Your data is encrypted and never used for training models.",
                },
              ].map((benefit, i) => (
                <div
                  key={i}
                  className="flex gap-5 p-6 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all border border-transparent hover:border-slate-50 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-md transition-all">
                    {benefit.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 tracking-tight">{benefit.title}</h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8">
              <Link
                to="/pricing"
                className="text-sm font-black text-blue-600 flex items-center gap-2 group"
              >
                Explore Higher Neural Tiers
                <ChevronRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Trust Footer */}
      <footer className="mt-20 w-full max-w-5xl border-t border-slate-200/50 pt-10 pb-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-8 opacity-40">
            {["No Hidden Latency", "Eject Anytime", "Neural Encryption"].map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-right max-w-xs">
            Terms of synchronization apply. 30% bonus limited to one billing cycle per user ID.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default CancellationPage
