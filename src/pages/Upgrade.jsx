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
}) => {
  const [customCredits, setCustomCredits] = useState(500)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingPlan, setPendingPlan] = useState(null)
  const [pendingCredits, setPendingCredits] = useState(0)
  const [modalType, setModalType] = useState(null)
  const [modalMessage, setModalMessage] = useState({ title: "", body: "" })

  const tierLevels = { basic: 1, pro: 2, enterprise: 3 }

  const handleCustomCreditsChange = e => {
    const value = parseInt(e.target.value, 10)
    setCustomCredits(value)
  }

  const calculateCustomPrice = () => (customCredits * 0.01).toFixed(2)

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
        ? `bg-white border border-gray-200 opacity-80 cursor-not-allowed`
        : `bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg`,
      icon: `bg-gray-50 text-gray-600`,
      price: `text-gray-900`,
      button: isDisabled
        ? `bg-gray-300 text-white cursor-not-allowed`
        : `bg-gray-900 hover:bg-gray-800 text-white`,
      accent: `text-gray-600`,
    }

    switch (plan.tier) {
      case "basic":
        return baseStyles
      case "pro":
        return {
          ...baseStyles,
          container: isDisabled
            ? `bg-white border-2 border-blue-200 opacity-80 cursor-not-allowed`
            : `bg-white border-2 border-blue-200 hover:border-blue-300 hover:shadow-xl shadow-lg`,
          icon: `bg-blue-50 text-blue-600`,
          price: `text-blue-600`,
          button: isDisabled
            ? `bg-blue-300 text-white cursor-not-allowed`
            : `bg-blue-600 hover:bg-blue-700 text-white`,
          accent: `text-blue-600`,
        }
      case "enterprise":
        return {
          ...baseStyles,
          container: isDisabled
            ? `bg-white border border-purple-200 opacity-80 cursor-not-allowed`
            : `bg-white border border-purple-200 hover:border-purple-300 hover:shadow-lg`,
          icon: `bg-purple-50 text-purple-600`,
          price: `text-purple-600`,
          button: isDisabled
            ? `bg-purple-300 text-white cursor-not-allowed`
            : `bg-purple-600 hover:bg-purple-700 text-white`,
          accent: `text-purple-600`,
        }
      case "credits":
        return {
          ...baseStyles,
          container: `bg-white border border-emerald-200 hover:border-emerald-300 hover:shadow-lg`,
          icon: `bg-emerald-50 text-emerald-600`,
          price: `text-emerald-600`,
          button: `bg-emerald-600 hover:bg-emerald-700 text-white`,
          accent: `text-emerald-600`,
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
        className={`relative rounded-2xl transition-all duration-300 ${
          isDisabled ? "" : "hover:scale-[1.02]"
        } ${styles.container} overflow-hidden p-8 h-full flex flex-col`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center ${styles.icon}`}
          >
            {plan.icon}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{plan.name}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="text-center mb-8">
          {plan.type === "credit_purchase" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="500"
                  value={customCredits}
                  onChange={handleCustomCreditsChange}
                  className={`flex-1 py-3 text-center text-xl font-bold bg-gray-50 border-2 rounded-lg focus:outline-none w-1/2 transition-all ${
                    customCredits < 500
                      ? "border-red-300 focus:border-red-500 text-red-600"
                      : `border-emerald-300 focus:border-emerald-500 ${styles.accent}`
                  }`}
                  placeholder="Credits"
                />
                <div className="text-right">
                  {customCredits >= 500 ? (
                    <div className={`${styles.price} text-2xl font-bold`}>
                      ${calculateCustomPrice()}
                    </div>
                  ) : (
                    <div className="text-red-500 text-sm font-medium">Min 500 credits</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-end justify-center gap-1">
                <span className={`text-4xl font-bold ${styles.price}`}>
                  {typeof displayPrice === "string" ? displayPrice : `$${displayPrice}`}
                </span>
                {typeof displayPrice !== "string" && (
                  <span className="text-gray-500 text-lg pb-1">/monthly</span>
                )}
              </div>
              {billingPeriod === "annual" && typeof displayPrice === "number" && (
                <div className="space-y-1 mt-2">
                  <div className="text-gray-500 text-sm font-medium">
                    Billed annually at <strong>${plan.annualPrice}</strong>
                  </div>
                  <div className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full inline-block">
                    Save ${(plan.annualPrice / 0.833 - plan.annualPrice).toFixed(0)} per year
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6 flex-grow">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span
                className={`text-sm ${
                  feature === "Everything in Basic, additionally:" ||
                  feature === "Everything in Pro, additionally:"
                    ? "text-blue-600 font-bold"
                    : "text-gray-700 font-medium"
                }`}
              >
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleButtonClick}
          className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${
            isDisabled ? "" : "hover:transform hover:scale-105 hover:shadow-lg"
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
  const [showComparisonTable, setShowComparisonTable] = useState(true)
  const user = useSelector(state => state.auth.user)
  const navigate = useNavigate()

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
        priceAnnual: 16.58,
        annualPrice: 199,
        credits: 1000,
        description: "Perfect for individuals getting started with AI content creation.",
        features: [
          billingPeriod === "annual" ? "12,000 annual credits" : "1,000 monthly credits",
          "Blog generation: single, quick, multiple",
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
        annualPrice: 499,
        credits: 4500,
        description: "Advanced AI features with priority support for growing teams.",
        features: [
          "Everything in Basic, additionally:",
          billingPeriod === "annual" ? "54,000 annual credits" : "4,500 monthly credits",
          "Competitor analysis",
          "Retry blog",
          "Regenerate content",
          "Rewrite blog",
          "Proofreading",
          "Jobs scheduling",
          "Priority support",
          "Advanced export options",
          "Custom templates",
          "SEO optimization",
          "AI content suggestions",
          "Automatic Blog Posting",
          "Custom AI models & workflows",
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
    <div className="bg-gray-50 py-10 px-4">
      <Helmet>
        <title>Subscription | GenWrite</title>
      </Helmet>
      <div className="mx-auto">
        {/* Global trial banner (unchanged) */}
        {showTrialMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl shadow-lg border border-blue-200 max-w-3xl mx-auto"
          >
            <div className="flex flex-col items-center text-center">
              <Star className="w-8 h-8 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Your 7-Day Free Trial</h2>
              <p className="text-gray-600 text-lg max-w-xl mb-6">
                Unlock the full potential of GenWrite with a 7-day free trial. Experience our
                powerful AI content creation tools at no cost. Select a plan below to begin your
                trial and elevate your content creation journey.
              </p>
              <p className="text-blue-600">Any remaining trial credits will roll over to your next plan.</p>
            </div>
          </motion.div>
        )}

        {/* Enterprise message (unchanged) */}
        {user?.subscription?.plan === "enterprise" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8"
          >
            <p className="text-lg font-semibold text-purple-600">
              You are at the top tier with our Enterprise plan! Contact our dedicated support team
              for any tailored solutions you require.
            </p>
          </motion.div>
        )}

        {/* Header & toggle (unchanged) */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-16">
          <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="inline-block mb-4">
            <motion.h1
              whileHover={{ scale: 1.02 }}
              className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-10"
            >
              Flexible Pricing Plans
            </motion.h1>
            <motion.div
              className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto w-24 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3 }}
            />
          </motion.div>

          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Choose the perfect plan for your team. Scale seamlessly as your needs grow.
          </p>

          <div className="flex justify-center mt-8">
            <div className="inline-flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm">
              {["monthly", "annual"].map(period => (
                <button
                  key={period}
                  onClick={() => setBillingPeriod(period)}
                  className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
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

        {/* Cards */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-10">
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
              className="mt-20"
            >
              <ComparisonTable plans={plans} billingPeriod={billingPeriod} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cancel link (unchanged) */}
      {user?.subscription?.plan !== "free" && (
        <div className="flex justify-end mt-4 mr-20">
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
