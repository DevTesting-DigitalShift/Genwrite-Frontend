import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useCreateCheckoutSession } from "@/api/queries/paymentQueries"
import { loadStripe } from "@stripe/stripe-js"
import { Check, Mail, Star, Zap, ChevronRight, Info, AlertTriangle, X } from "lucide-react"
import { Helmet } from "react-helmet"
import { SkeletonCard } from "@components/ui/SkeletonLoader"
import { sendStripeGTMEvent } from "@utils/stripeGTMEvents"
import useAuthStore from "@store/useAuthStore"
import ComparisonTable from "@components/ComparisonTable"
import { useNavigate } from "react-router-dom"
import toast from "@utils/toast"
import clsx from "clsx"

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
    switch (plan.tier) {
      case "basic":
        return {
          container: `bg-white border ${isDisabled ? "border-gray-100 opacity-60" : "border-green-100 hover:border-green-200 shadow-sm"}`,
          price: "text-green-600",
          button: `bg-green-600 hover:bg-green-700 text-white`,
          title: "text-green-700",
        }
      case "pro":
        return {
          container: `bg-white border ${isDisabled ? "border-gray-100 opacity-60" : "border-blue-100 hover:border-blue-200 shadow-sm"}`,
          price: "text-blue-600",
          button: `bg-blue-600 hover:bg-blue-700 text-white`,
          title: "text-blue-700",
        }
      case "enterprise":
        return {
          container: `bg-[#FDF4FF] border ${isDisabled ? "border-gray-100 opacity-60" : "border-purple-100 hover:border-purple-200 shadow-sm"}`,
          price: "text-purple-600",
          button: `bg-purple-600 hover:bg-purple-700 text-white`,
          title: "text-purple-700",
        }
      case "credits":
        return {
          container: `bg-[#F0FDF4] border border-emerald-100 hover:border-emerald-200 shadow-sm`,
          price: "text-emerald-600",
          button: `bg-emerald-600 hover:bg-emerald-700 text-white`,
          title: "text-emerald-700",
        }
      default:
        return {
          container: `bg-white border border-gray-100 shadow-sm`,
          price: "text-blue-600",
          button: `bg-blue-600 hover:bg-blue-700 text-white`,
          title: "text-blue-700",
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
          <div className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-base font-semibold flex items-center gap-1">
            <Star size={16} /> Most Popular
          </div>
        </div>
      )}

      <div
        className={`flex flex-col h-full rounded-xl p-8 transition-all duration-300 ${styles.container}`}
      >
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">{plan.name}</h3>
          <p className="text-slate-500 font-medium text-xs leading-relaxed min-h-[40px]">
            {plan.description}
          </p>
        </div>

        <div className="mb-8 min-h-[90px] flex flex-col justify-center items-center">
          {plan.type === "credit_purchase" ? (
            <div className="space-y-4 w-full">
              <div className="flex justify-center">
                <input
                  type="number"
                  min="500"
                  value={customCredits}
                  onChange={handleCustomCreditsChange}
                  className="w-32 h-12 text-center text-xl font-semibold text-emerald-600 rounded-lg border border-emerald-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="text-center">
                {customCredits >= 500 ? (
                  <p className="text-3xl font-semibold text-emerald-600">
                    {currency === "INR" ? "₹" : "$"}
                    {calculateCustomPrice()}
                  </p>
                ) : (
                  <p className="text-rose-500 text-[10px] font-semibold uppercase tracking-widest">
                    Min 500 Credits required
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
              {typeof displayPrice === "number" ? (
                <>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-5xl font-semibold ${styles.price}`}>
                      {currency === "INR"
                        ? `₹${plan[billingPeriod === "annual" ? "priceAnnualINR" : "priceMonthlyINR"]}`
                        : `$${displayPrice}`}
                    </span>
                    <span className="text-gray-400 font-medium text-sm">/month</span>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-400 mt-2 uppercase tracking-wide">
                    Billed{" "}
                    {billingPeriod === "annual"
                      ? `$${(displayPrice * 12).toFixed(2)} annually`
                      : "monthly"}
                  </p>
                </>
              ) : (
                <span className={`text-4xl font-semibold ${styles.price}`}>{displayPrice}</span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleButtonClick}
          disabled={isDisabled || (plan.type === "credit_purchase" && customCredits < 500)}
          className={clsx(
            "w-full h-12 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2",
            isDisabled ? "bg-blue-100 text-blue-400 cursor-default" : styles.button
          )}
        >
          {plan.name.toLowerCase().includes("enterprise") ? (
            <>
              {" "}
              <Mail size={16} /> Contact Sales{" "}
            </>
          ) : isDisabled ? (
            "Current Plan"
          ) : plan.type === "credit_purchase" ? (
            "Buy Credits"
          ) : (
            "Get Started"
          )}
        </button>

        <div className="mt-8 space-y-3 grow">
          {plan.features.map((feature, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <Check className="size-4 text-emerald-500 mt-0.5 shrink-0" />
              <span className="text-xs font-medium text-slate-500">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-sm rounded-xl p-6 shadow-xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Info className="size-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">{modalMessage.title}</h3>
                <p className="text-slate-500 text-sm">{modalMessage.body}</p>
                <div className="flex w-full gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false)
                      proceedToBuy(pendingPlan)
                    }}
                    className="flex-1 h-12 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 h-12 bg-white text-slate-500 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition-all"
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
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const getPlans = billing => {
    return [
      {
        name: "GenWrite Basic",
        priceMonthly: 20,
        priceAnnual: 16.66,
        priceMonthlyINR: 1799,
        priceAnnualINR: 1499,
        credits: 1000,
        description: "Perfect for individuals getting started with AI content creation.",
        features: [
          billing === "annual" ? "12,000 annual credits" : "1,000 monthly credits",
          "Blog generation: single, quick, multiple",
          "upto 10 blog of 1000 words",
          "Keyword research",
          "Performance monitoring",
          "Humanized pocket content",
          "Email support",
          "Standard templates",
          "Automatic Blog Posting",
          "Basic content analytics",
        ],
        cta: "Get Started",
        tier: "basic",
        featured: false,
      },
      {
        name: "GenWrite Pro",
        priceMonthly: 50,
        priceAnnual: 41.58,
        priceMonthlyINR: 4499,
        priceAnnualINR: 3749,
        credits: 4500,
        description: "Advanced AI features with priority support for growing teams.",
        features: [
          "Everything in Basic, additionally:",
          billing === "annual" ? "54,000 annual credits" : "4,500 monthly credits",
          "upto 45 blog of 1000 words",
          "Competitor analysis",
          "Retry blog",
          "Regenerate content",
          "Rewrite blog",
          "Proofreading",
          "Job scheduling",
          "Priority support",
          "Advanced export options",
          "30+ templates",
          "SEO optimization",
          "A/B test suggestions",
          "Advanced content insights",
        ],
        cta: "Scale with Pro",
        tier: "pro",
        featured: false,
      },
      {
        name: "GenWrite Enterprise",
        priceMonthly: "Custom",
        priceAnnual: "Custom",
        credits: "Unlimited",
        description: "Tailored solutions with unlimited access and dedicated support.",
        features: [
          "Everything in Pro, additionally:",
          "Flexible usage based on your needs",
          "Dedicated support manager",
          "Custom Integrations",
          "Early access to beta tools",
          "Automatic Blog Posting",
          "Approval workflows",
        ],
        cta: "Contact Sales",
        tier: "enterprise",
        featured: true,
      },
      {
        name: "Credit Pack",
        description: "Flexible one-time credit purchase for occasional users.",
        features: [
          "Custom credit amount",
          "No subscription required",
          "Credits never expire",
          "All features unlocked based on usage",
          "Automatic Blog Posting",
          "Blog generation: single, quick, multiple",
          "Keyword research",
          "Performance monitoring",
          "Humanized pocket content",
          "Email support",
          "Basic content analytics",
        ],
        cta: "Buy Credits",
        type: "credit_purchase",
        tier: "credits",
        featured: false,
      },
    ]
  }

  const plans = getPlans(billingPeriod)

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
    <div className="min-h-screen bg-slate-50/30 p-6 md:p-10 font-sans text-slate-700">
      <Helmet>
        <title>Pricing Plans | GenWrite</title>
      </Helmet>

      <div className="space-y-12">
        {/* Simple Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center px-4">
            Flexible Pricing Plans
          </h1>
          <div className="h-1 bg-linear-to-r from-blue-500 to-purple-500 mx-auto w-24 rounded-full"></div>
          <p className="text-gray-600 font-medium mt-2 text-sm sm:text-base md:text-lg max-w-2xl mx-auto text-center px-4">
            Choose the perfect plan for your team. Scale seamlessly as your needs grow.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center">
          <div className="bg-slate-100 p-1 rounded-full flex items-center shadow-inner">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={clsx(
                "px-6 py-2 rounded-full text-xs font-semibold transition-all",
                billingPeriod === "monthly" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"
              )}
            >
              Monthly
            </button>
            <div className="relative group">
              <button
                onClick={() => setBillingPeriod("annual")}
                className={clsx(
                  "px-6 py-2 rounded-full text-xs font-semibold transition-all",
                  billingPeriod === "annual" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400"
                )}
              >
                Annual
              </button>
              <span className="absolute -top-4 -right-2 bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-semibold shadow-sm">
                Save 20%
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Comparison Table */}
        <div className="mt-20">
          <ComparisonTable plans={plans} />
        </div>

        {/* Footer Link */}
        <div className="flex justify-end pt-10">
          <button
            onClick={() => navigate("/cancel-subscription")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold px-4 py-2 rounded-lg transition-all shadow-md"
          >
            Thinking of leaving GenWrite?
          </button>
        </div>
      </div>
    </div>
  )
}

export default Upgrade
