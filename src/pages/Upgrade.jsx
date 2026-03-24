import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axiosInstance from "@api/index"
import { useCreateCheckoutSession } from "@/api/queries/paymentQueries"

import { loadStripe } from "@stripe/stripe-js"
import { Check, Coins, Crown, Mail, Shield, Star, Zap } from "lucide-react"
import { Helmet } from "react-helmet"
import { SkeletonCard } from "@components/ui/SkeletonLoader"
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

  // USD to INR conversion rate
  const CREDIT_CONVERSION_RATE = 90

  const handleCustomCreditsChange = e => {
    const value = parseInt(e.target.value, 10)
    setCustomCredits(value)
  }

  // Calculate credit price based on currency
  const calculateCustomPrice = () => {
    const usdPrice = customCredits * 0.01
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
    if (!sub || plan.type === "credit_purchase" || userPlan === "free") return false

    if (!sub.renewalDate) {
      return plan.tier === userPlan.toLowerCase()
    }

    if (["active", "trialing"].includes(userStatus)) {
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
        ? `bg-gray-50 border-gray-200 opacity-90`
        : `bg-white border-gray-200 hover:border-primary/40 hover:shadow-lg`,
      price: `text-gray-900`,
      button: isDisabled
        ? `bg-gray-300 text-gray-600`
        : `bg-primary hover:bg-primary/90 text-white`,
    }

    switch (plan.tier) {
      case "basic":
        return baseStyles
      case "pro":
        return {
          container: isDisabled
            ? `bg-gray-50 border-gray-200 opacity-90`
            : `bg-white border-primary/30 shadow-none hover:shadow-xl hover:border-primary/60`,
          price: `text-primary`,
          button: isDisabled
            ? `bg-gray-300 text-gray-600`
            : `bg-primary hover:bg-primary/90 text-white`,
        }
      case "enterprise":
        return {
          container: isDisabled
            ? `bg-gray-50 border-gray-200 opacity-90`
            : `bg-white border-purple-200 hover:border-purple-400 hover:shadow-xl`,
          price: `text-purple-700`,
          button: isDisabled
            ? `bg-gray-300 text-gray-600`
            : `bg-purple-600 hover:bg-purple-700 text-white`,
        }
      case "credits":
        return {
          container: `bg-white border-emerald-200 hover:border-emerald-400 hover:shadow-xl`,
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

    proceedToBuy(plan)
  }

  const proceedToBuy = planToBuy => {
    if (planToBuy.type === "credit_purchase") {
      onBuy(planToBuy, customCredits, billingPeriod)
    } else if (planToBuy.name.toLowerCase().includes("enterprise")) {
      window.open(
        `https://mail.google.com/mail/?view=cm&fs=1&to=support@genwrite.com&su=GenWrite Enterprise Subscription&body=I'm interested in the Enterprise plan.`,
        "_blank"
      )
    } else {
      onBuy(planToBuy, planToBuy.credits, billingPeriod)
    }
  }

  return (
    <div className={`relative group ${plan.featured && !isDisabled ? "lg:scale-105" : ""}`}>
      {/* Most Popular Badge (unchanged) */}
      {plan.featured &&
        !isDisabled &&
        (userSubscription?.plan?.toLowerCase() === "basic" && plan.tier === "pro" ? (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10 w-full flex justify-center">
            <div className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <Star className="w-3.5 h-3.5 fill-white" />
              MOST POPULAR
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
        className={`relative rounded-xl transition-all duration-300 ${styles.container} overflow-hidden h-full flex flex-col shadow-none`}
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
                      ${calculateCustomPrice()}
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
                        ? `₹${billingPeriod === "annual" ? Math.round(plan.annualPrice) : Math.round(plan.priceMonthlyINR)}`
                        : `$${billingPeriod === "annual" ? Number(plan.annualPrice).toFixed(2) : Number(displayPrice).toFixed(2)}`}
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
                ? "bg-slate-300 text-slate-600 cursor-not-allowed opacity-80"
                : "hover:transform hover:scale-[1.02] hover:shadow-lg " + styles.button
            } ${
              plan.type === "credit_purchase" && customCredits < 500
                ? "opacity-50 cursor-not-allowed"
                : ""
            } flex items-center justify-center gap-2`}
            disabled={isDisabled || (plan.type === "credit_purchase" && customCredits < 500)}
            onClick={() => handleButtonClick()}
          >
            {plan.name.toLowerCase().includes("enterprise") && <Mail className="w-4 h-4" />}
            {isDisabled ? "Current Plan" : plan.cta}
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
                    : ""
                }`}
              >
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const Upgrade = () => {
  const [loading, setLoading] = useState(true)
  const [apiPlans, setApiPlans] = useState([])
  const [billingPeriod, setBillingPeriod] = useState("annual")
  const [currency, setCurrency] = useState("USD")
  const [showComparisonTable, setShowComparisonTable] = useState(true)
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { mutateAsync: createCheckoutSession } = useCreateCheckoutSession()



  const CONVERSION_RATE = 90 // USD to INR conversion rate

  const countryMapping = { INR: "IN", USD: "US" }
  const countryToSend = countryMapping[currency] || "US"

  // Auto-set currency based on user's country
  useEffect(() => {
    if (user?.countryCode === "IN") {
      setCurrency("INR")
    } else {
      setCurrency("USD")
    }
  }, [user?.countryCode])

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axiosInstance.get("/user/plans", {
          params: { country: countryToSend },
        })
        if (response.data && response.data.data) {
          setApiPlans(response.data.data)
        }
      } catch (error) {
        console.error("Failed to fetch plans", error)
      }
    }
    fetchPlans()
  }, [countryToSend])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  const getPlans = (billingPeriod, userPlan) => {
    const isProUser = userPlan === "pro"

    // Helper to find plan in API
    const getApiPlan = (tier, freq) => {
      return apiPlans.find(
        p =>
          p.tier === tier &&
          (p.frequency === freq || (tier === "credits" && p.type === "credit_purchase"))
      )
    }

    const basicMonthly = getApiPlan("basic", "month")
    const basicAnnual = getApiPlan("basic", "year")
    const proMonthly = getApiPlan("pro", "month")
    const proAnnual = getApiPlan("pro", "year")
    const creditsPlan = getApiPlan("credits", "one-time") || getApiPlan("credits", "month")

    const getPrice = (plan, fallbackUSD, fallbackINR) => {
      if (plan) return plan.price
      return currency === "INR" ? fallbackINR : fallbackUSD
    }

    const getCredits = (plan, fallback) => {
      if (plan) return plan.credits
      return fallback
    }

    const basicPriceMonthlyRaw = getPrice(basicMonthly, 20, 1799)
    const basicPriceAnnualRaw = getPrice(basicAnnual, 199, 1499 * 12)
    const proPriceMonthlyRaw = getPrice(proMonthly, 50, 4499)
    const proPriceAnnualRaw = getPrice(proAnnual, 499, 3749 * 12)

    const basicPriceMonthly = basicPriceMonthlyRaw
    const basicPriceAnnual = Number((basicPriceAnnualRaw / 12).toFixed(1))

    const proPriceMonthly = proPriceMonthlyRaw
    const proPriceAnnual = Number((proPriceAnnualRaw / 12).toFixed(1))

    return [
      {
        name: "GenWrite Basic",
        eventName: "Basic_" + billingPeriod + "_clicks",
        priceMonthly: basicPriceMonthly,
        priceAnnual: basicPriceAnnual,
        priceMonthlyINR: basicPriceMonthly,
        priceAnnualINR: basicPriceAnnual,
        annualPrice: basicPriceAnnualRaw,
        credits:
          billingPeriod === "annual"
            ? getCredits(basicAnnual, 12000)
            : getCredits(basicMonthly, 1000),
        description: "Perfect for individuals getting started with AI content creation.",
        features: [
          billingPeriod === "annual"
            ? `${getCredits(basicAnnual, 12000).toLocaleString()} annual credits`
            : `${getCredits(basicMonthly, 1000).toLocaleString()} monthly credits`,
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
        cta: !user?.subscription?.trialOpted
          ? currency === "INR"
            ? "Start your free trial"
            : "Start today for $1"
          : "Get Started",
        type: "subscription",
        icon: <Zap className="w-8 h-8" />,
        tier: "basic",
        featured: false,
        slug: billingPeriod === "annual" ? basicAnnual?.slug : basicMonthly?.slug,
      },
      {
        name: "GenWrite Pro",
        eventName: "Pro_" + billingPeriod + "_clicks",
        priceMonthly: proPriceMonthly,
        priceAnnual: proPriceAnnual,
        priceMonthlyINR: proPriceMonthly,
        priceAnnualINR: proPriceAnnual,
        annualPrice: proPriceAnnualRaw,
        credits:
          billingPeriod === "annual" ? getCredits(proAnnual, 54000) : getCredits(proMonthly, 4500),
        description: "Advanced AI features with priority support for growing teams.",
        features: [
          "Everything in Basic, additionally:",
          billingPeriod === "annual"
            ? `${getCredits(proAnnual, 54000).toLocaleString()} annual credits`
            : `${getCredits(proMonthly, 4500).toLocaleString()} monthly credits`,
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
        cta: !user?.subscription?.trialOpted
          ? currency === "INR"
            ? "Start your free trial"
            : "Start today for $1"
          : "Upgrade to Pro",
        type: "subscription",
        icon: <Shield className="w-8 h-8" />,
        tier: "pro",
        featured: !isProUser && userPlan !== "enterprise",
        slug: billingPeriod === "annual" ? proAnnual?.slug : proMonthly?.slug,
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
        slug: "enterprise",
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
        slug: creditsPlan?.slug,
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

  const handleManageSubscription = () => {
    navigate("/transactions")
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
      toast.error("Failed to load payment gateway.")
      return
    }

    try {
      // 1. Construct Plan Slug
      // Format: tier-frequency-country (e.g., basic-monthly-us)
      const tier = plan.tier.toLowerCase()
      const frequency = billingPeriod.toLowerCase() // 'monthly' or 'annual'
      const countryCode = countryToSend.toLowerCase() // 'us' or 'in'

      let planSlug = plan.slug || ""

      if (!planSlug) {
        if (plan.type === "credit_purchase") {
          // For credits, we rely on the backend's credit purchase fallback or a base slug
          planSlug = "credits-base-us" // Using a generic slug; backend logic handles (!targetPlan && credits)
        } else {
          planSlug = `${tier}-${frequency}-${countryCode}`
        }
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

      const data = response.data

      // if (data?.sessionId) {
      //   sendStripeGTMEvent(plan, credits, billingPeriod, user._id)
      //   const result = await stripe.redirectToCheckout({ sessionId: data.sessionId })
      //   if (result?.error) throw result.error
      //   return
      // }

      if (data?.url) {
        sendStripeGTMEvent(plan, credits, billingPeriod, user._id)
        window.location.href = data.url
        return
      }

      // New cases from upgrade endpoint — handle 3DS/SCA natively via Stripe SDK
      if (data?.requiresAction && data?.clientSecret) {
        toast.info(`Authenticating payment of ${data.amountDue} ${data.currency}...`)
        const { paymentIntent: confirmedIntent, error: actionError } = await stripe.handleNextAction({
          clientSecret: data.clientSecret,
        })
        if (actionError) {
          toast.error(actionError.message || "Payment authentication failed. Please try again.")
        } else if (confirmedIntent?.status === "succeeded") {
          toast.success("Payment successful! Your plan will update shortly.")
          navigate("/transactions", { replace: true })
        } else {
          toast.warning("Payment is pending. Check your transactions for updates.")
          navigate("/transactions", { replace: true })
        }
        return
      }

      if (data?.requiresPayment && data?.hostedInvoiceUrl) {
        // Redirect to Stripe's hosted invoice page
        // It shows amount, lets user pay with card / other methods, handles 3DS, etc.
        toast.info(
          `Redirecting to secure payment page for ${data.amountDue || "the prorated amount"}...`
        )
        window.location.href = data.hostedInvoiceUrl
        return
      }

      if (data?.success) {
        toast.success(response.data?.message || "Your Upcoming Plan has been set successfully.")
        navigate("/transactions", { replace: true })
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
          whileHover={{ scale: 1.01 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight"
        >
          Flexible Pricing Plans
        </motion.h1>

        <motion.div
          className="h-1.5 w-20 bg-primary rounded-full mt-4"
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
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                    billingPeriod === period
                      ? "bg-primary text-white shadow-none"
                      : "text-gray-500 hover:text-gray-900"
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
            className="text-sm font-bold text-white transition-colors 
        bg-gray-900 
        rounded-xl px-5 py-2.5 shadow-none 
        hover:bg-gray-800"
          >
            Thinking of leaving GenWrite?
          </a>
        </div>
      )}


    </div>
  )
}

export default Upgrade
