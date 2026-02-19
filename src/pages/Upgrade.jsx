import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axiosInstance from "@api/index"
import { useCreateCheckoutSession } from "@/api/queries/paymentQueries"
import { loadStripe } from "@stripe/stripe-js"
import {
  Check,
  Coins,
  Crown,
  Mail,
  Shield,
  Star,
  Zap,
  ArrowRight,
  ChevronRight,
  Info,
  AlertTriangle,
  X,
} from "lucide-react"
import { Helmet } from "react-helmet"
import { SkeletonCard } from "@components/UI/SkeletonLoader"
import { sendStripeGTMEvent } from "@utils/stripeGTMEvents"
import useAuthStore from "@store/useAuthStore"
import ComparisonTable from "@components/ComparisonTable"
import { useNavigate } from "react-router-dom"
import toast from "@utils/toast"

const PricingCard = ({
  plan,
  onBuy,
  billingPeriod,
  userPlan,
  userStatus,
  userSubscription,
  user,
  currency,
}) => {
  const [customCredits, setCustomCredits] = useState(500)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingPlan, setPendingPlan] = useState(null)
  const [pendingCredits, setPendingCredits] = useState(0)
  const [modalMessage, setModalMessage] = useState({ title: "", body: "", type: "" })

  const tierLevels = { basic: 1, pro: 2, enterprise: 3 }
  const CREDIT_CONVERSION_RATE = 90

  const handleCustomCreditsChange = e => {
    const value = parseInt(e.target.value, 10)
    setCustomCredits(value)
  }

  const calculateCustomPrice = () => {
    const usdPrice = customCredits * 0.01
    if (currency === "INR") {
      return Math.ceil(usdPrice * CREDIT_CONVERSION_RATE)
    }
    return usdPrice.toFixed(2)
  }

  const displayPrice =
    plan.type === "credit_purchase"
      ? null
      : billingPeriod === "annual"
        ? plan.priceAnnual
        : plan.priceMonthly

  const isDisabled = (() => {
    const sub = userSubscription
    if (!sub || plan.type === "credit_purchase") return false
    if (!sub.renewalDate) {
      return plan.tier === userPlan.toLowerCase()
    }
    if (userStatus === "active") {
      const start = new Date(sub.startDate)
      const renewal = new Date(sub.renewalDate)
      const diffDays = (renewal - start) / (1000 * 60 * 60 * 24)
      const userBillingPeriod = diffDays > 60 ? "annual" : "monthly"
      return plan.tier === userPlan.toLowerCase() && billingPeriod === userBillingPeriod
    }
    return false
  })()

  const getCardStyles = () => {
    const baseTransitions = "transition-all duration-300 transform hover:scale-[1.02]"
    switch (plan.tier) {
      case "pro":
        return {
          container: `bg-linear-to-br from-indigo-50/50 to-white border-2 ${isDisabled ? "border-gray-100 opacity-60" : "border-indigo-200 hover:border-indigo-400 shadow-lg shadow-indigo-100/20"}`,
          price: "text-indigo-600",
          button: `btn btn-primary bg-indigo-600 hover:bg-indigo-700 border-none text-white shadow-lg shadow-indigo-200`,
        }
      case "enterprise":
        return {
          container: `bg-linear-to-br from-purple-50/50 to-white border-2 ${isDisabled ? "border-gray-100 opacity-60" : "border-purple-200 hover:border-purple-400 shadow-lg shadow-purple-100/20"}`,
          price: "text-purple-600",
          button: `btn btn-primary bg-purple-600 hover:bg-purple-700 border-none text-white shadow-lg shadow-purple-200`,
        }
      case "credits":
        return {
          container: `bg-linear-to-br from-emerald-50/50 to-white border-2 border-emerald-200 hover:border-emerald-400 shadow-lg shadow-emerald-100/20`,
          price: "text-emerald-600",
          button: `btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-none text-white shadow-lg shadow-emerald-200`,
        }
      default:
        return {
          container: `bg-linear-to-br from-blue-50/50 to-white border-2 ${isDisabled ? "border-gray-100 opacity-60" : "border-blue-200 hover:border-blue-400 shadow-lg shadow-blue-100/20"}`,
          price: "text-blue-600",
          button: `btn btn-primary bg-blue-600 hover:bg-blue-700 border-none text-white shadow-lg shadow-blue-200`,
        }
    }
  }

  const styles = getCardStyles()

  let userBillingPeriod = null
  if (userSubscription?.renewalDate && userSubscription?.startDate) {
    const start = new Date(userSubscription.startDate)
    const renewal = new Date(userSubscription.renewalDate)
    const diffDays = (renewal - start) / (1000 * 60 * 60 * 24)
    userBillingPeriod = diffDays > 60 ? "annual" : "monthly"
  }

  const handleButtonClick = () => {
    if (isDisabled) return
    if (plan.type === "credit_purchase" && customCredits < 500) return

    if (plan.type === "credit_purchase") {
      onBuy(plan, customCredits, billingPeriod)
      return
    }

    if (plan.name.toLowerCase().includes("enterprise")) {
      proceedToBuy(plan)
      return
    }

    if (!userSubscription || userSubscription.status !== "active") {
      onBuy(plan, plan.credits, billingPeriod)
      return
    }

    setPendingPlan(plan)
    setPendingCredits(plan.credits)

    const currentTier = tierLevels[userPlan.toLowerCase()]
    const newTier = tierLevels[plan.tier]
    const startDateStr = userSubscription.renewalDate
      ? new Date(userSubscription.renewalDate).toLocaleDateString()
      : "immediately"

    const isSameTier = plan.tier === userPlan.toLowerCase()

    if (
      isSameTier &&
      userPlan.toLowerCase() === "pro" &&
      userBillingPeriod === "monthly" &&
      billingPeriod === "annual"
    ) {
      setModalMessage({
        title: "Confirm Plan Migration",
        body: `Your upgrade to Annual billing will start on ${startDateStr}.`,
        type: "migration",
      })
    } else if (!isSameTier && currentTier < newTier) {
      setModalMessage({
        title: "Upgrade Subscription",
        body: `Your current plan will be replaced by ${plan.name} immediately.`,
        type: "upgrade",
      })
    } else {
      setModalMessage({
        title: "Downgrade Subscription",
        body: `Your new ${plan.name} plan will take effect on ${startDateStr}.`,
        type: "downgrade",
      })
    }
    setShowConfirmModal(true)
  }

  const proceedToBuy = planToBuy => {
    if (planToBuy.type === "credit_purchase") {
      onBuy(planToBuy, pendingCredits, billingPeriod)
    } else if (planToBuy.name.toLowerCase().includes("enterprise")) {
      window.open(
        `https://mail.google.com/mail/?view=cm&fs=1&to=support@genwrite.com&su=Enterprise Subscription&body=Interested in Enterprise plan.`,
        "_blank"
      )
    } else {
      onBuy(planToBuy, pendingCredits || planToBuy.credits, billingPeriod)
    }
  }

  return (
    <div
      className={`relative flex flex-col h-full ${plan.featured && !isDisabled ? "lg:-mt-4 lg:mb-4" : ""}`}
    >
      {plan.featured && !isDisabled && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10 w-full flex justify-center">
          <div className="bg-linear-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-full text-xs font-black tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-200 uppercase">
            <Star className="size-3 fill-current" /> Most Popular
          </div>
        </div>
      )}

      <div className={`flex flex-col h-full rounded-[32px] p-8 ${styles.container}`}>
        <div className="mb-8">
          <h3 className="text-2xl font-black text-gray-900 mb-2">{plan.name}</h3>
          <p className="text-gray-500 font-medium text-sm leading-relaxed min-h-[44px]">
            {plan.description}
          </p>
        </div>

        <div className="mb-10 min-h-[100px] flex flex-col justify-center">
          {plan.type === "credit_purchase" ? (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="number"
                  min="500"
                  value={customCredits}
                  onChange={handleCustomCreditsChange}
                  className="input input-bordered w-full h-16 text-center text-2xl font-black text-emerald-600 rounded-2xl border-emerald-100 focus:border-emerald-500 pr-16"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">
                  CREDITS
                </div>
              </div>
              <div className="text-center">
                {customCredits >= 500 ? (
                  <p className="text-3xl font-black text-emerald-600">
                    {currency === "INR" ? "₹" : "$"}
                    {calculateCustomPrice()}
                  </p>
                ) : (
                  <p className="text-rose-500 text-xs font-bold uppercase tracking-widest">
                    Minimum 500 Credits required
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
              {typeof displayPrice === "number" ? (
                <>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-5xl font-black ${styles.price}`}>
                      {currency === "INR"
                        ? `₹${plan[billingPeriod === "annual" ? "priceAnnualINR" : "priceMonthlyINR"]}`
                        : `$${displayPrice}`}
                    </span>
                    <span className="text-gray-400 font-bold text-sm tracking-widest uppercase">
                      /mon
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">
                    Billed {billingPeriod === "annual" ? "annually" : "monthly"}
                  </p>
                </>
              ) : (
                <span className={`text-4xl font-black ${styles.price}`}>{displayPrice}</span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleButtonClick}
          disabled={isDisabled || (plan.type === "credit_purchase" && customCredits < 500)}
          className={`btn btn-lg rounded-2xl normal-case font-black text-lg h-16 w-full gap-2 transition-all ${isDisabled ? "btn-ghost bg-gray-100 text-gray-400" : styles.button}`}
        >
          {plan.name.toLowerCase().includes("enterprise") && <Mail className="size-5" />}
          {isDisabled ? "Current Active Plan" : plan.cta}
        </button>

        <div className="mt-10 space-y-4 grow">
          {plan.features.map((feature, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="size-3 text-emerald-600 stroke-4" />
              </div>
              <span
                className={`text-sm ${feature.includes("Everything in") ? "font-black text-gray-900" : "font-medium text-gray-500"}`}
              >
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="btn btn-ghost btn-circle btn-sm"
                >
                  <X className="size-5 text-gray-400" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                  <Info className="size-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">{modalMessage.title}</h3>
                <div className="bg-gray-50 p-4 rounded-2xl mb-8 w-full">
                  <p className="text-gray-600 font-medium leading-relaxed">{modalMessage.body}</p>
                </div>

                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false)
                      proceedToBuy(pendingPlan)
                    }}
                    className="btn btn-primary btn-lg rounded-2xl bg-blue-600 border-none text-white font-black h-16 normal-case"
                  >
                    Confirm Change
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="btn btn-ghost btn-lg rounded-2xl font-bold text-gray-400 h-16 normal-case"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

const Upgrade = () => {
  const [loading, setLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState("annual")
  const [currency, setCurrency] = useState("USD")
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { mutateAsync: createCheckoutSession } = useCreateCheckoutSession()

  useEffect(() => {
    if (user?.countryCode === "IN") setCurrency("INR")
  }, [user?.countryCode])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const getPlans = (billing, userTier) => {
    const isProUser = userTier === "pro"
    return [
      {
        name: "Basic Plan",
        priceMonthly: 20,
        priceAnnual: 16.66,
        priceMonthlyINR: 1799,
        priceAnnualINR: 1499,
        credits: 1000,
        description: "Perfect for individuals and solo creators getting started.",
        features: [
          billing === "annual" ? "12,000 annual credits" : "1,000 monthly credits",
          "Blog generation: single & quick",
          "Up to 10 blogs (1k words) / mon",
          "Keyword research tools",
          "Humanize content module",
          "Standard export templates",
          "Email support access",
          "Basic content analytics",
        ],
        cta: "Start Basic",
        tier: "basic",
        featured: false,
      },
      {
        name: "Pro Plan",
        priceMonthly: 50,
        priceAnnual: 41.58,
        priceMonthlyINR: 4499,
        priceAnnualINR: 3749,
        credits: 4500,
        description: "Advanced AI power with priority support for scaling teams.",
        features: [
          "Everything in Basic, additionally:",
          billing === "annual" ? "54,000 annual credits" : "4,500 monthly credits",
          "Up to 45 blogs (1k words) / mon",
          "Competitor site analysis",
          "Regenerate & Rewrite tools",
          "Proofreading AI engine",
          "Job scheduling & scheduling",
          "Priority 24/7 support",
          "Advanced SEO insights",
        ],
        cta: "Scale with Pro",
        tier: "pro",
        featured: !isProUser && userTier !== "enterprise",
      },
      {
        name: "Enterprise",
        priceMonthly: "Custom",
        priceAnnual: "Custom",
        credits: "Unlimited",
        description: "Bespoke AI solutions for high-volume publishing agencies.",
        features: [
          "Everything in Pro, additionally:",
          "Custom usage scalability",
          "Dedicated Account Manager",
          "Custom API integrations",
          "White-label options",
          "Early access to beta tools",
          "Advanced approval workflows",
        ],
        cta: "Talk to Sales",
        tier: "enterprise",
        featured: isProUser || userTier === "basic",
      },
      {
        name: "Credit Pack",
        description: "One-time flexible credit purchase. No commitment.",
        features: [
          "Custom credit amounts",
          "No recurrent subscription",
          "Credits never expires",
          "Full feature access enabled",
          "Occasional power usage",
          "Ideal for spill-overs",
        ],
        cta: "Buy Credits",
        type: "credit_purchase",
        tier: "credits",
        featured: false,
      },
    ]
  }

  const plans = getPlans(billingPeriod, user?.subscription?.plan)

  const handleBuy = async (plan, credits, period) => {
    if (user?.emailVerified === false) {
      toast.warning("Please verify your email before purchasing a plan.")
      navigate(`/email-verify/${user.email}`)
      return
    }

    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    if (!stripe) {
      toast.error("Stripe gateway failure.")
      return
    }

    try {
      const response = await createCheckoutSession({
        planName: plan.name.toLowerCase().includes("pro")
          ? "pro"
          : plan.name.toLowerCase().includes("basic")
            ? "basic"
            : "credits",
        credits: plan.type === "credit_purchase" ? credits : plan.credits,
        billingPeriod: period,
        country: currency === "INR" ? "IN" : "US",
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
      })

      if (response.data?.sessionId) {
        sendStripeGTMEvent(plan, credits, period, user._id)
        await stripe.redirectToCheckout({ sessionId: response.data.sessionId })
      } else {
        toast.success("Subscription updated successfully.")
        navigate("/transactions")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment initiation failed.")
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-white to-gray-50/50">
      <Helmet>
        <title>Flexible Pricing | GenWrite</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Powerful Plans for{" "}
              <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Every Creator
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-gray-500 text-lg sm:text-xl font-medium leading-relaxed">
              Unlock the full potential of Generative AI. Choose from flexible subscriptions or
              pay-as-you-go credits.
            </p>
          </motion.div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-16 px-4">
          <div className="bg-gray-100/80 backdrop-blur-md p-1.5 rounded-3xl flex items-center border border-gray-100 shadow-inner w-full max-w-sm">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`flex-1 h-14 rounded-2xl font-black text-sm transition-all normal-case ${billingPeriod === "monthly" ? "bg-white shadow-xl text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`flex-1 h-14 rounded-2xl font-black text-sm transition-all normal-case relative group ${billingPeriod === "annual" ? "bg-white shadow-xl text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              Annually
              <span className="absolute -top-3 -right-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 px-2 lg:px-0">
          <AnimatePresence>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : plans.map(plan => (
                  <PricingCard
                    key={plan.name}
                    plan={plan}
                    user={user}
                    onBuy={handleBuy}
                    billingPeriod={billingPeriod}
                    currency={currency}
                    userPlan={user?.subscription?.plan}
                    userStatus={user?.subscription?.status}
                    userSubscription={user?.subscription}
                  />
                ))}
          </AnimatePresence>
        </div>

        <div className="mt-32">
          <ComparisonTable plans={plans} billingPeriod={billingPeriod} />
        </div>

        {user?.subscription?.plan !== "free" && user?.subscription?.status !== "trialing" && (
          <div className="mt-12 text-center">
            <button
              onClick={() => navigate("/cancel-subscription")}
              className="btn btn-ghost btn-sm text-gray-400 hover:text-rose-600 font-bold transition-colors gap-2"
            >
              <AlertTriangle className="size-4" /> Thinking of canceling subscription?
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Upgrade
