import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axiosInstance from "@api/index"
import { loadStripe } from "@stripe/stripe-js"
import { Check, Coins, Crown, Mail, Shield, Star, Zap } from "lucide-react"
import { Helmet } from "react-helmet"
import { SkeletonCard } from "@components/UI/SkeletonLoader"
import { Button, message, Modal } from "antd"
import { sendStripeGTMEvent } from "@utils/stripeGTMEvents"
import { useSelector } from "react-redux"
import ComparisonTable from "@components/ComparisonTable"
import { useNavigate } from "react-router-dom"
import CountdownTimer from "@components/CountdownTimer"

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
        ? `bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-200 opacity-80 cursor-not-allowed`
        : `bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-200 hover:border-teal-300 hover:shadow-xl`,
      price: `text-teal-700`,
      button: isDisabled
        ? `bg-teal-300 text-white cursor-not-allowed`
        : `bg-teal-600 hover:bg-teal-700 text-white`,
    }

    switch (plan.tier) {
      case "basic":
        return baseStyles
      case "pro":
        return {
          container: isDisabled
            ? `bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 opacity-80 cursor-not-allowed`
            : `bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 hover:border-blue-400 hover:shadow-xl shadow-lg`,
          price: `text-blue-700`,
          button: isDisabled
            ? `bg-blue-300 text-white cursor-not-allowed`
            : `bg-blue-600 hover:bg-blue-700 text-white`,
        }
      case "enterprise":
        return {
          container: isDisabled
            ? `bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 opacity-80 cursor-not-allowed`
            : `bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:border-purple-300 hover:shadow-xl`,
          price: `text-purple-700`,
          button: isDisabled
            ? `bg-purple-300 text-white cursor-not-allowed`
            : `bg-purple-600 hover:bg-purple-700 text-white`,
        }
      case "credits":
        return {
          container: `bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-xl`,
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
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
              <Star className="w-4 h-4" />
              Most Popular
            </div>
          </div>
        ) : userSubscription?.plan?.toLowerCase() === "pro" && plan.tier === "enterprise" ? (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
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

          {/* 50% OFF Badge */}
          {plan.type !== "credit_purchase" && typeof displayPrice === "number" && (
            <div className="mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-200 text-red-600">
                50% OFF {billingPeriod === "monthly" ? "FIRST MONTH" : "FIRST TIME"}
              </span>
            </div>
          )}
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
                  {/* Original Price with Strike-through */}
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-semibold text-gray-400 line-through">
                      {currency === "INR"
                        ? `₹${
                            plan[billingPeriod === "annual" ? "priceAnnualINR" : "priceMonthlyINR"]
                          }`
                        : `$${displayPrice}`}
                    </span>
                    <span className="text-gray-400 text-sm">/month</span>
                  </div>

                  {/* Discounted Price (50% off) */}
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${styles.price}`}>
                      {currency === "INR"
                        ? `₹${(
                            plan[
                              billingPeriod === "annual" ? "priceAnnualINR" : "priceMonthlyINR"
                            ] * 0.5
                          ).toFixed(0)}`
                        : `$${(displayPrice * 0.5).toFixed(2)}`}
                    </span>
                    <span className="text-gray-600 text-sm">/month</span>
                  </div>

                  {/* Billed Amount */}
                  <div className="mt-2">
                    <span className="text-sm font-se text-gray-500">
                      Billed{" "}
                    {currency === "INR"
  ? `₹${Math.round(
      plan[billingPeriod === "annual" ? "priceAnnualINR" : "priceMonthlyINR"] *
        (billingPeriod === "annual" ? 12 : 1) *
        0.5 +
        (billingPeriod === "annual" ? 6 : 0) // ✅ INR annual only
    )}`
  : `$${(
      Math.round(
        displayPrice *
          (billingPeriod === "annual" ? 12 : 1) *
          0.5 *
          100
      ) / 100
    ).toFixed(2)}`}
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

        {/* CTA Button */}
        <div className="px-6 pb-6">
          <button
            onClick={handleButtonClick}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
              isDisabled ? "" : "hover:transform hover:scale-[1.02] hover:shadow-lg"
            } ${styles.button} ${
              plan.type === "credit_purchase" && customCredits < 500
                ? "opacity-50 cursor-not-allowed"
                : ""
            } flex items-center justify-center gap-2`}
            disabled={isDisabled || (plan.type === "credit_purchase" && customCredits < 500)}
          >
            {plan.name.toLowerCase().includes("enterprise") && <Mail className="w-4 h-4" />}
            {isDisabled ? "Current Plan" : plan.cta}
          </button>
        </div>

        {/* Features */}
        <div className="px-6 pb-6 space-y-2.5 flex-grow">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
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

      {/* Confirmation Modal (unchanged) */}
      <Modal
        title={<span className="text-lg">{modalMessage.title}</span>}
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        centered
        styles={{ padding: "10px", fontSize: "16px" }}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="border border-gray-300 px-4 py-2 rounded-md font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowConfirmModal(false)
                proceedToBuy(pendingPlan)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold"
            >
              Confirm
            </button>
          </div>
        }
      >
        <p className="text-gray-700">
          You already have an active subscription:{" "}
          <span className="font-bold text-gray-900">{userSubscription?.plan}</span>.
        </p>
        <p className="text-gray-700">{modalMessage.body}</p>
        <p className="text-gray-600 mt-2 text-sm italic">
          Please confirm to proceed with your purchase.
        </p>
      </Modal>
    </div>
  )
}

const Upgrade = () => {
  const [loading, setLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState("annual")
  const [currency, setCurrency] = useState("USD")
  const [showComparisonTable, setShowComparisonTable] = useState(true)
  const user = useSelector(state => state.auth.user)
  const navigate = useNavigate()

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

  const countryMapping = {
    INR: "IN",
    USD: "US",
  }

  const countryToSend = countryMapping[currency] || "US"

  const handleBuy = async (plan, credits, billingPeriod) => {
    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    if (!stripe) {
      console.error("Stripe.js failed to load.")
      message.error("Failed to load payment gateway. Please try again later.")
      return
    }
    try {
      const response = await axiosInstance.post("/stripe/checkout", {
        planName: plan.name.toLowerCase().includes("pro")
          ? "pro"
          : plan.name.toLowerCase().includes("basic")
          ? "basic"
          : "credits",
        credits: plan.type === "credit_purchase" ? credits : plan.credits,
        billingPeriod,
        country: countryToSend,
        client_id: getGaClientId(),
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
      })
      if ([200, 201].includes(response.status)) {
        if (response.data?.sessionId) {
          sendStripeGTMEvent(plan, credits, billingPeriod, user._id)
          const result = await stripe.redirectToCheckout({ sessionId: response.data.sessionId })
          if (result?.error) throw result.error
        } else {
          message.success(response.data?.message || "Your Upcoming Plan has been set successfully.")
          navigate("/transactions", { replace: true })
        }
      }
    } catch (error) {
      if (error?.status === 409) {
        message.error(error?.response?.data?.message || "User Subscription Conflict Error")
      } else {
        message.error("Failed to initiate checkout. Please try again.")
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
      <motion.div className="flex flex-col justify-center items-center mb-6 sm:mb-8 mx-auto">
        <motion.h1
          whileHover={{ scale: 1.02 }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center px-4"
        >
          Flexible Pricing Plans
        </motion.h1>
        <motion.div
          className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto w-24 rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3 }}
        />

        <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto text-center px-4">
          Choose the perfect plan for your team. Scale seamlessly as your needs grow.
        </p>
      </motion.div>

      <div className="mx-auto">
        {/* Christmas Sale Countdown Timer Banner */}
        <div className="max-w-6xl mx-auto mb-6 sm:mb-8 grid grid-cols-1 lg:grid-cols-2 place-content-center place-items-center gap-4 sm:gap-6">
          <CountdownTimer
            startDate="2025-12-01T00:00:00"
            endDate="2026-01-01T23:59:59"
            discount="50%"
          />
          {/* Important Sale Terms Notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 sm:p-5 shadow-md w-full"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1 flex-col justify-around">
                <h4 className="text-base sm:text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                  🎅 Christmas Sale - Important Terms
                </h4>
                <div className="space-y-1.5 text-xs sm:text-sm text-amber-800">
                  <p className="flex items-start gap-2">
                    <span className="text-lg leading-none">•</span>
                    <span>
                      <strong className="font-bold">First-Time Subscribers Only:</strong> This 50%
                      discount is exclusively available for new customers who have never subscribed
                      to GenWrite before.
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-lg leading-none">•</span>
                    <span>
                      <strong className="font-bold">First Month Only:</strong> The 50% discount
                      applies to your{" "}
                      <strong className="underline">first month of subscription only</strong>.
                      Starting from the second month, you will be charged the regular subscription
                      price.
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-lg leading-none">•</span>
                    <span>
                      <strong className="font-bold">Limited Time:</strong> This special Christmas &
                      New Year offer is valid only during the promotional period shown in the
                      countdown timer above.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Global trial banner (unchanged) */}
        {/* {showTrialMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-xl shadow-lg border border-blue-200 max-w-3xl mx-auto"
          >
            <div className="flex flex-col items-center text-center">
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 px-4">
                Start Your 3-Day Free Trial
              </h2>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-xl mb-4 sm:mb-6 px-4">
                Unlock the full potential of GenWrite with a 3-day free trial. Experience our
                powerful AI content creation tools at no cost. Select a plan below to begin your
                trial and elevate your content creation journey.
              </p>
              <p className="text-blue-600 text-sm sm:text-base px-4">
                Any remaining trial credits will roll over to your next plan.
              </p>
            </div>
          </motion.div>
        )} */}

        {/* Enterprise message (unchanged) */}
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
        <div className="mx-auto px-4 mb-10">
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
        </div>

        {/* Cards */}
        <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-0 md:px-4">
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
      {user?.subscription?.plan !== "free" && (
        <div className="flex justify-center sm:justify-end mt-4 sm:mt-6 px-4 sm:mr-8 lg:mr-20">
          <a
            href="/cancel-subscription"
            className="text-sm font-medium text-white transition-colors 
               bg-gradient-to-r from-blue-600 to-purple-600 
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
