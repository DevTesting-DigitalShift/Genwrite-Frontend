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
  BrainCircuit,
  CheckCircle,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
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
      confirmText: "Cancel Anyway",
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
    <div>
      {/* Hero Section */}
      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-black">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Don't Leave Yet! 😢
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl font-semibold mb-6"
          >
            Stay with us and enjoy a{" "}
            <span className="text-orange-400 font-bold uppercase">30% MORE credits </span> on next
            billing cycle!
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8">
        {/* Offer Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-orange-400/10 to-red-400/10 rounded-full -translate-y-12 translate-x-12" />
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">Exclusive Retention Offer</h2>
          </div>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-500" />
              <span>30% more credits on next billing cycle</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-500" />
              <span>Better priority support and faster response times</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-500" />
              <span>No long-term commitment required</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStay}
            disabled={isProcessing}
            className={`w-full mt-6 py-4 px-6 bg-linear-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${
              isProcessing
                ? "opacity-70 cursor-not-allowed"
                : "hover:from-blue-400 hover:to-purple-400"
            }`}
          >
            {isProcessing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 rounded-full border-t-white"
                />
                <span>Applying Discount...</span>
              </>
            ) : (
              <>
                <Gift className="w-5 h-5" />
                <span>Claim 30% More Credits & Stay 🙌</span>
                <Zap className="w-5 h-5" />
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleCancel}
            disabled={isProcessing}
            className={`w-full mt-3 py-4 px-6 border-2 border-red-500 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:border-red-600 hover:bg-red-100 ${
              isProcessing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Cancel Anyway
          </motion.button>
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-gray-900">Why Stay with GenWrite?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-800">Powerful AI Writing Tools</h3>
                <p className="text-gray-600">
                  Generate high-quality content effortlessly with our advanced AI features.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Heart className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-gray-800">Personalized Support</h3>
                <p className="text-gray-600">
                  Get dedicated support to help you succeed with your writing projects.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Crown className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-gray-800">Premium Features</h3>
                <p className="text-gray-600">
                  Access exclusive tools and templates to elevate your content creation.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Testimonial Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-2xl font-bold text-gray-900 text-center mb-8"
          >
            What Our Users Say
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl shadow-lg p-6 text-center"
          >
            <p className="text-gray-600 italic mb-4">
              "GenWrite has transformed the way I create content. The AI tools are a game-changer!"
            </p>
            <p className="font-semibold text-gray-800">— Sarah M., Content Creator</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex items-center justify-center gap-6 text-xs text-gray-500 mb-4"
          >
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>No Hidden Fees</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Instant Activation</span>
            </div>
          </motion.div>
          <p className="text-xs text-gray-500">
            This offer is valid for existing subscribers only and cannot be combined with other
            promotions. You can cancel anytime after applying the discount.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default CancellationPage
