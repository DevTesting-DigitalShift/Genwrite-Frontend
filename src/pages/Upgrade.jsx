import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axiosInstance from "@api/index"
import { useCreateCheckoutSession } from "@/api/queries/paymentQueries"
import { createPortalSession } from "@api/otherApi"
import { loadStripe } from "@stripe/stripe-js"
import { Check, Coins, Crown, Mail, Shield, Star, Zap } from "lucide-react"
import { Helmet } from "react-helmet"
import { SkeletonCard } from "@components/UI/SkeletonLoader"
import { sendStripeGTMEvent } from "@utils/stripeGTMEvents"
import useAuthStore from "@store/useAuthStore"
import ComparisonTable from "@components/ComparisonTable"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

const PricingCard = ({
  plan,
  index,
  onBuy,
  billingPeriod,
  userPlan,
  userStatus,
  userStartDate,
  userSubscription,
  user,
  currency,
  onManage,
}) => {
  const [customCredits, setCustomCredits] = useState(500)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingPlan, setPendingPlan] = useState(null)
  const [pendingCredits, setPendingCredits] = useState(0)
  const [modalType, setModalType] = useState(null)
  const [modalMessage, setModalMessage] = useState({ title: "", body: "" })

  const tierLevels = { basic: 1, pro: 2, enterprise: 3 }

  // USD to INR conversion rate
  const CREDIT_CONVERSION_RATE = 90

  const handleCustomCreditsChange = e => {
    const value = parseInt(e.target.value, 10)
    setCustomCredits(value)
  }

  // Calculate credit price based on currency
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

  const isWithinBillingCycle = userStatus === "active"

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
    const baseStyles = {
      container: isDisabled
        ? `bg-linear-to-br from-teal-50 to-emerald-50 border-2 border-teal-200 opacity-90`
        : `bg-linear-to-br from-teal-50 to-emerald-50 border-2 border-teal-200 hover:border-teal-300 hover:shadow-xl`,
      price: `text-teal-700`,
      button: isDisabled
        ? `bg-teal-600 hover:bg-teal-700 text-white`
        : `bg-teal-600 hover:bg-teal-700 text-white`,
    }

    switch (plan.tier) {
      case "basic":
        return baseStyles
      case "pro":
        return {
          container: isDisabled
            ? `bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 opacity-90`
            : `bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 hover:border-blue-400 hover:shadow-xl shadow-lg`,
          price: `text-blue-700`,
          button: isDisabled
            ? `bg-blue-600 hover:bg-blue-700 text-white`
            : `bg-blue-600 hover:bg-blue-700 text-white`,
        }
      case "enterprise":
        return {
          container: isDisabled
            ? `bg-linear-to-br from-purple-50 to-pink-50 border-2 border-purple-200 opacity-90`
            : `bg-linear-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:border-purple-300 hover:shadow-xl`,
          price: `text-purple-700`,
          button: isDisabled
            ? `bg-purple-600 hover:bg-purple-700 text-white`
            : `bg-purple-600 hover:bg-purple-700 text-white`,
        }
      case "credits":
        return {
          container: `bg-linear-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-xl`,
          price: `text-emerald-700`,
          button: `bg-emerald-600 hover:bg-emerald-700 text-white`,
        }
      default:
        return baseStyles
    }
  }

  const styles = getCardStyles()

  let userBillingPeriod = null
  if (userSubscription && userSubscription.renewalDate && userSubscription.startDate) {
    const start = new Date(userSubscription.startDate)
    const renewal = new Date(userSubscription.renewalDate)
    const diffDays = (renewal - start) / (1000 * 60 * 60 * 24)
    userBillingPeriod = diffDays > 60 ? "annual" : "monthly"
  }

  // ----- NEW: Badge & Rollover Logic -----
  const currentUserTier = userPlan?.toLowerCase()
  const isBasic = plan.tier === "basic"
  const isPro = plan.tier === "pro"

  const showTrialBadge =
    (currentUserTier === "basic" && isPro) || (currentUserTier === "pro" && isBasic)

  const showRolloverMessage = user?.subscription?.trialOpted === false

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

    let thisModalType = ""
    let thisModalMessage = { title: "", body: "" }

    const isSameTier = plan.tier === userPlan.toLowerCase()

    if (
      isSameTier &&
      userPlan.toLowerCase() === "pro" &&
      userBillingPeriod === "monthly" &&
      billingPeriod === "annual"
    ) {
      thisModalType = "same-tier"
      thisModalMessage = {
        title: "Confirm Plan Change",
        body: `Your new ${plan.name} plan will start on ${startDateStr} at the beginning of your next billing cycle.`,
      }
    } else if (!isSameTier && currentTier < newTier) {
      thisModalType = "upgrade"
      thisModalMessage = {
        title: "Confirm Upgrade",
        body: `Your current subscription will be replaced, and your new ${plan.name} plan will start immediately.`,
      }
    } else {
      thisModalType = "downgrade"
      thisModalMessage = {
        title: "Confirm Downgrade",
        body: `Your new ${plan.name} plan will start on ${startDateStr} at the beginning of your next billing cycle.`,
      }
    }

    setModalType(thisModalType)
    setModalMessage(thisModalMessage)
    setShowConfirmModal(true)
  }

  const proceedToBuy = planToBuy => {
    if (planToBuy.type === "credit_purchase") {
      onBuy(planToBuy, pendingCredits, billingPeriod)
    } else if (planToBuy.name.toLowerCase().includes("enterprise")) {
      window.open(
        `https://mail.google.com/mail/?view=cm&fs=1&to=support@genwrite.com&su=GenWrite Enterprise Subscription&body=I'm interested in the Enterprise plan.`,
        "_blank"
      )
    } else {
      onBuy(planToBuy, pendingCredits || planToBuy.credits, billingPeriod)
    }
  }

  return (
    <div className={`relative group ${plan.featured && !isDisabled ? "lg:scale-105" : ""}`}>
      {/* Most Popular Badge (unchanged) */}
      {plan.featured &&
        !isDisabled &&
        (userSubscription?.plan?.toLowerCase() === "basic" && plan.tier === "pro" ? (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
              <Star className="w-4 h-4" />
              Most Popular
            </div>
          </div>
        ) : userSubscription?.plan?.toLowerCase() === "pro" && plan.tier === "enterprise" ? (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
              <Star className="w-4 h-4" />
              Most Popular
            </div>
          </div>
        ) : null)}

      <div
        className={`relative rounded-2xl transition-all duration-300 ${styles.container} overflow-hidden h-full flex flex-col`}
      >
        {/* Header Section */}
        <div className="px-6 pt-5 rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900 mb-2 mt-6">{plan.name}</h3>
          <p className="text-gray-600 text-sm leading-relaxed h-[48px] font-medium">
            {plan.description}
          </p>
        </div>

        {/* Price Section */}
        <div className="px-6 pb-6 min-h-[140px] flex flex-col justify-center">
          {plan.type === "credit_purchase" ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <input
                  type="number"
                  min="500"
                  value={customCredits}
                  onChange={handleCustomCreditsChange}
                  className={`flex-1 py-3 text-center text-xl font-bold bg-white border-2 rounded-lg focus:outline-none transition-all ${
                    customCredits < 500
                      ? "border-red-300 focus:border-red-500 text-red-600"
                      : `border-emerald-300 focus:border-emerald-500 text-emerald-700`
                  }`}
                  placeholder="Credits"
                />
                <div className="text-right">
                  {customCredits >= 500 ? (
                    <div className={`${styles.price} text-2xl font-bold`}>
                      {currency === "INR" ? "₹" : "$"}
                      {calculateCustomPrice()}
                    </div>
                  ) : (
                    <div className="text-red-500 text-sm font-medium">Min 500 credits</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {typeof displayPrice === "number" && (
                <>
                  {/* Main Price */}
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-bold ${styles.price}`}>
                      {currency === "INR"
                        ? `₹${
                            plan[billingPeriod === "annual" ? "priceAnnualINR" : "priceMonthlyINR"]
                          }`
                        : `$${displayPrice}`}
                    </span>
                    <span className="text-gray-600 text-sm">/month</span>
                  </div>

                  {/* Billed Amount */}
                  <div className="mt-2 text-center">
                    <span className="text-sm font-se text-gray-500">
                      Billed{" "}
                      {currency === "INR"
                        ? `₹${Math.round(
                            plan[
                              billingPeriod === "annual" ? "priceAnnualINR" : "priceMonthlyINR"
                            ] * (billingPeriod === "annual" ? 12 : 1)
                          )}`
                        : `$${(displayPrice * (billingPeriod === "annual" ? 12 : 1)).toFixed(2)}`}
                      {billingPeriod === "annual" ? " annually" : " monthly"}
                    </span>
                  </div>
                </>
              )}

              {/* Custom/Enterprise Pricing */}
              {typeof displayPrice === "string" && (
                <div className="flex items-baseline justify-center">
                  <span className={`text-4xl font-bold ${styles.price}`}>{displayPrice}</span>
                </div>
              )}
            </div>
          )}
        </div>
        {/* THERE IS AN PROBLEM HERE */}
        {/* CTA Button */}
        <div className="px-6 pb-6">
          <button
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
              isDisabled
                ? "bg-opacity-80 hover:bg-opacity-100 cursor-pointer hover:transform hover:scale-[1.02] hover:shadow-lg"
                : "hover:transform hover:scale-[1.02] hover:shadow-lg"
            } ${styles.button} ${
              plan.type === "credit_purchase" && customCredits < 500
                ? "opacity-50 cursor-not-allowed"
                : ""
            } flex items-center justify-center gap-2`}
            disabled={!isDisabled && plan.type === "credit_purchase" && customCredits < 500} // Allow clicking current plan
            onClick={() => (isDisabled ? onManage() : handleButtonClick())}
          >
            {plan.name.toLowerCase().includes("enterprise") && <Mail className="w-4 h-4" />}
            {isDisabled ? "Manage Subscription" : plan.cta}
          </button>
        </div>

        {/* Features */}
        <div className="px-6 pb-6 space-y-2.5 grow">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 text-white stroke-3" />
              </div>
              <span
                className={`text-sm leading-relaxed ${
                  feature === "Everything in Basic, additionally:" ||
                  feature === "Everything in Pro, additionally:"
                    ? "text-gray-900 font-bold"
                    : "text-gray-700"
                }`}
              >
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
          <div className="modal-box bg-white max-w-sm rounded-[16px] shadow-2xl p-6 relative">
            <h3 className="font-bold text-lg text-slate-800 mb-2">{modalMessage.title}</h3>

            <div className="py-2 text-slate-700">
              <p className="mb-2">
                You already have an active subscription:{" "}
                <span className="font-bold text-gray-900">{userSubscription?.plan}</span>.
              </p>
              <p>{modalMessage.body}</p>
              <p className="text-gray-500 mt-4 text-sm italic">
                Please confirm to proceed with your purchase.
              </p>
            </div>

            <div className="modal-action flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-outline border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium px-6 rounded-lg min-h-0 h-10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  proceedToBuy(pendingPlan)
                }}
                className="btn bg-blue-600 border-none hover:bg-blue-700 text-white font-semibold px-6 rounded-lg min-h-0 h-10"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Upgrade = () => {
  const [loading, setLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState("annual")
  const [currency, setCurrency] = useState("USD")
  const [showComparisonTable, setShowComparisonTable] = useState(true)
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { mutateAsync: createCheckoutSession } = useCreateCheckoutSession()

  const CONVERSION_RATE = 90 // USD to INR conversion rate

  // Auto-set currency based on user's country
  useEffect(() => {
    if (user?.countryCode === "IN") {
      setCurrency("INR")
    } else {
      setCurrency("USD")
    }
  }, [user?.countryCode])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  const getPlans = (billingPeriod, userPlan) => {
    const isProUser = userPlan === "pro"
    return [
      {
        name: "GenWrite Basic",
        eventName: "Basic_" + billingPeriod + "_clicks",
        priceMonthly: 20,
        priceAnnual: 16.66,
        priceMonthlyINR: 1799,
        priceAnnualINR: 1499,
        annualPrice: 199,
        credits: 1000,
        description: "Perfect for individuals getting started with AI content creation.",
        features: [
          billingPeriod === "annual" ? "12,000 annual credits" : "1,000 monthly credits",
          "Blog generation: single, quick, multiple",
          "upto 10 blog of 1000-words",
          "Keyword research",
          "Performance monitoring",
          "Humanize pasted content",
          "Email support",
          "Standard templates",
          "Automatic Blog Posting",
          "Basic content analytics",
        ],
        cta: "Get Started",
        type: "subscription",
        icon: <Zap className="w-8 h-8" />,
        tier: "basic",
        featured: false,
      },
      {
        name: "GenWrite Pro",
        eventName: "Pro_" + billingPeriod + "_clicks",
        priceMonthly: 50,
        priceAnnual: 41.58,
        priceMonthlyINR: 4499,
        priceAnnualINR: 3749,
        annualPrice: 499,
        credits: 4500,
        description: "Advanced AI features with priority support for growing teams.",
        features: [
          "Everything in Basic, additionally:",
          billingPeriod === "annual" ? "54,000 annual credits" : "4,500 monthly credits",
          "upto 45 blog of 1000-words",
          "Competitor analysis",
          "Retry blog",
          "Regenerate content",
          "Rewrite blog",
          "Proofreading",
          "Jobs scheduling",
          "Priority support",
          "Advanced export options",
          "30+ templates",
          "SEO optimization",
          "AI content suggestions",
          "Advanced content insights",
        ],
        cta: "Upgrade to Pro",
        type: "subscription",
        icon: <Shield className="w-8 h-8" />,
        tier: "pro",
        featured: !isProUser && userPlan !== "enterprise",
      },
      {
        name: "GenWrite Enterprise",
        eventName: "Enterprise_" + billingPeriod + "_clicks",
        priceMonthly: "Custom",
        priceAnnual: "Custom",
        credits: "Unlimited",
        description: "Tailored solutions with unlimited access and dedicated support.",
        features: [
          "Everything in Pro, additionally:",
          "Flexible usage based on your needs",
          "Dedicated support manager",
          "Custom integrations",
          "Early access to beta tools",
          "Automatic Blog Posting",
          "Approval workflows",
        ],
        cta: "Contact Sales",
        type: "subscription",
        icon: <Crown className="w-8 h-8" />,
        tier: "enterprise",
        featured: isProUser || userPlan === "basic",
      },
      {
        name: "Credit Pack",
        eventName: "Credits_clicks",
        priceMonthly: null,
        priceAnnual: null,
        credits: null,
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
          "Humanize pasted content",
          "Email support",
          "Basic content analytics",
        ],
        cta: "Buy Credits",
        type: "credit_purchase",
        icon: <Coins className="w-8 h-8" />,
        tier: "credits",
        featured: false,
      },
    ]
  }

  const plans = getPlans(billingPeriod, user?.subscription?.plan)

  function getGaClientId() {
    const gaCookie = document.cookie.split("; ").find(row => row.startsWith("_ga="))
    if (gaCookie) {
      const parts = gaCookie.split(".")
      if (parts.length > 2) return parts[2] + "." + parts[3]
    }
    return null
  }

  const countryMapping = { INR: "IN", USD: "US" }

  const countryToSend = countryMapping[currency] || "US"

  const handleManageSubscription = async () => {
    try {
      toast.loading({ content: "Opening billing portal...", key: "portal" })
      const data = await createPortalSession(window.location.href)
      if (data?.url) {
        window.location.href = data.url
      } else {
        toast.warning({ content: "Could not open billing settings.", key: "portal" })
      }
    } catch (error) {
      console.error(error)
      toast.error({ content: "Failed to manage subscription.", key: "portal" })
    }
  }

  const handleBuy = async (plan, credits, billingPeriod) => {
    // Check if user's email is verified before allowing purchase
    if (user?.emailVerified === false) {
      toast.warning("Please verify your email before purchasing a plan.")
      navigate(`/email-verify/${user.email}`, { replace: true })
      return
    }

    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    if (!stripe) {
      console.error("Stripe.js failed to load.")
      toast.error("Failed to load payment gateway. Please try again later.")
      return
    }

    try {
      // 1. Construct Plan Slug
      // Format: tier-frequency-country (e.g., basic-monthly-us)
      const tier = plan.tier.toLowerCase()
      const frequency = billingPeriod.toLowerCase() // 'monthly' or 'annual'
      const countryCode = countryToSend.toLowerCase() // 'us' or 'in'

      let planSlug = ""

      if (plan.type === "credit_purchase") {
        // For credits, we rely on the backend's credit purchase fallback or a base slug
        planSlug = "get-credits" // Using a generic slug; backend logic handles (!targetPlan && credits)
      } else {
        planSlug = `${tier}-${frequency}-${countryCode}`
      }

      // 2. Prepare Payload
      const payload = {
        planSlug,
        credits: plan.type === "credit_purchase" ? credits : undefined,
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
        client_id: getGaClientId(),
      }

      // 3. Call API
      const response = await createCheckoutSession(payload)

      if ([200, 201].includes(response.status)) {
        if (response.data?.url) {
          // Modern Stripe Checkout redirection (server-side generation)
          sendStripeGTMEvent(plan, credits, billingPeriod, user._id)
          window.location.href = response.data.url
        } else if (response.data?.sessionId) {
          sendStripeGTMEvent(plan, credits, billingPeriod, user._id)
          const result = await stripe.redirectToCheckout({ sessionId: response.data.sessionId })
          if (result?.error) throw result.error
        } else {
          toast.success(response.data?.toast || "Your Upcoming Plan has been set successfully.")
          navigate("/transactions", { replace: true })
        }
      }
    } catch (error) {
      console.error("Checkout Error:", error)
      if (error?.status === 409) {
        toast.error(error?.response?.data?.toast || "User Subscription Conflict Error")
      } else if (error?.status === 404) {
        toast.error("Selected plan configuration unavailable.")
      } else {
        toast.error("Failed to initiate checkout. Please try again.")
      }
    }
  }

  const totalCredits = user?.credits?.base + user?.credits?.extra
  const showTrialMessage = !user?.subscription?.trialOpted

  return (
    <div className="pb-10 pt-5 px-3 sm:px-6 lg:px-8 mt-10">
      <Helmet>
        <title>Subscription | GenWrite</title>
      </Helmet>
      <motion.div className="flex flex-col items-center justify-center mb-8 sm:mb-10 md:mb-12 text-center px-4">
        <motion.h1
          whileHover={{ scale: 1.02 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          Flexible Pricing Plans
        </motion.h1>

        <motion.div
          className="h-1 w-16 sm:w-20 md:w-24 bg-linear-to-r from-blue-500 to-purple-500 rounded-full mt-3"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3 }}
        />

        <p className="mt-4 text-gray-600 text-sm sm:text-base md:text-lg max-w-xl md:max-w-2xl">
          Choose the perfect plan for your team. Scale seamlessly as your needs grow.
        </p>
      </motion.div>

      <div className="mx-auto">
        {/* Enterprise toast (unchanged) */}
        {user?.subscription?.plan === "enterprise" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-6 sm:mb-8 px-4"
          >
            <p className="text-base sm:text-lg font-semibold text-purple-600">
              You are at the top tier with our Enterprise plan! Contact our dedicated support team
              for any tailored solutions you require.
            </p>
          </motion.div>
        )}

        {/* Billing Period Toggle - Centered */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
          <div className="flex justify-center px-4">
            <div className="inline-flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm">
              {["monthly", "annual"].map(period => (
                <button
                  key={period}
                  onClick={() => setBillingPeriod(period)}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    billingPeriod === period
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {period === "annual" ? (
                    <>
                      Annual
                      <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        Save 20%
                      </span>
                    </>
                  ) : (
                    "Monthly"
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Currency Toggle - Top Right Above Cards */}
        {/* <div className="mx-auto px-4 mb-10">
          <div className="flex justify-end">
            <div className="inline-flex items-center bg-white rounded-lg p-0.5 border border-gray-200 shadow-sm">
              {["USD", "INR"].map(curr => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-300 ${
                    currency === curr
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {curr === "USD" ? "USD" : "INR"}
                </button>
              ))}
            </div>
          </div>
        </div> */}

        {/* Cards */}
        <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-0 md:px-4 mt-20">
          <AnimatePresence>
            {loading
              ? Array.from({ length: 4 }).map((_, idx) => <SkeletonCard key={idx} />)
              : plans.map((plan, index) => (
                  <PricingCard
                    user={user}
                    key={plan.name}
                    plan={plan}
                    index={index}
                    onBuy={handleBuy}
                    billingPeriod={billingPeriod}
                    currency={currency}
                    userPlan={user?.subscription?.plan}
                    userStatus={user?.subscription?.status}
                    userStartDate={user?.subscription?.startDate}
                    userSubscription={user?.subscription}
                    onManage={handleManageSubscription}
                  />
                ))}
          </AnimatePresence>
        </div>

        {/* Comparison Table (unchanged) */}
        <AnimatePresence>
          {showComparisonTable && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-12 sm:mt-16 lg:mt-20"
            >
              <ComparisonTable plans={plans} billingPeriod={billingPeriod} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cancel link (unchanged) */}
      {user?.subscription?.plan !== "free" && user?.subscription?.status !== "trialing" && (
        <div className="flex justify-center sm:justify-end mt-4 sm:mt-6 px-4 sm:mr-8 lg:mr-20">
          <a
            href="/cancel-subscription"
            className="text-sm font-medium text-white transition-colors 
        bg-linear-to-r from-blue-600 to-purple-600 
        rounded-lg px-4 py-2 shadow-sm 
        hover:from-blue-700 hover:to-purple-700"
          >
            Thinking of leaving GenWrite?
          </a>
        </div>
      )}
    </div>
  )
}

export default Upgrade
