import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axiosInstance from "@api/index"
import { useNavigate } from "react-router-dom"
import { loadStripe } from "@stripe/stripe-js"
import { MailOutlined } from "@ant-design/icons"
import { SkeletonCard } from "@components/Projects/SkeletonLoader"

const PricingCard = ({ plan, index, onBuy }) => {
  const [customCredits, setCustomCredits] = useState(0) // State for custom credits
  const calculatedPrice = plan.price

  const handleCustomCreditsChange = (e) => {
    const value = parseInt(e.target.value, 10) || 0
    setCustomCredits(value)
  }

  const calculateCustomPrice = () => {
    return ((customCredits * 5) / 100).toFixed(2) // $5 per 100 credits
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{
        y: -5,
        scale: 1.02,
        transition: { type: "spring", stiffness: 300 },
      }}
      className={`relative p-8 rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300 ${
        plan.featured
          ? "border-2 border-blue-500 bg-gradient-to-br from-blue-50 via-blue-100 to-violet-100 text-gray-800"
          : "border-gray-200 hover:border-blue-500 border-2"
      }`}
    >
      {plan.featured && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold"
        >
          Most Popular
        </motion.div>
      )}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
        <div className="flex items-end gap-2 mb-4">
          {plan.type === "credit_purchase" ? (
            <>
              <input
                type="number"
                min="0"
                value={customCredits}
                onChange={handleCustomCreditsChange}
                placeholder="0"
                className="w-full px-4 py-2  text-gray-800 bg-transparent border-b-2 border-gray-300 focus:outline-none focus:border-blue-500 appearance-none"
              />

              <span className="text-gray-500 text-lg">
                ${calculateCustomPrice()}
                <p className="text-xs">(calculated) </p>
              </span>
            </>
          ) : (
            <>
              <motion.span
                key={calculatedPrice}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="text-4xl font-bold text-gray-900"
              >
                ${calculatedPrice}
              </motion.span>
              <span className="text-gray-500 text-sm">/month</span>
            </>
          )}
        </div>
        <p className="text-gray-600 text-sm">{plan.description}</p>
      </div>
      {/* [ s] on clicking contact team for enterprise, open email to support@genwrite.com with
      subject request for genwrite enterprise plan or something. Use anchor tag instead of button for enterprise*/}
      <motion.button
        whileHover={{
          scale: 1.05,
          boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
        }}
        whileTap={{ scale: 0.95 }}
        className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
          plan.featured
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg"
            : "bg-gray-100 text-gray-700 border border-gray-200 shadow-lg tracking-wider hover:bg-gradient-to-br hover:from-blue-100 hover:via-blue-200 hover:to-violet-200 hover:text-blue-700 hover:shadow-xl hover:backdrop-blur-md"
        }`}
        onClick={() => {
          if (plan.type === "credit_purchase") {
            if (customCredits == 0) {
              alert("Kindly add the credits first")
            } else {
              onBuy(plan, customCredits)
            }
          } else if (plan.name.toLowerCase().includes("enterprise")) {
            window.open(
              `https://mail.google.com/mail/?view=cm&fs=1&to=supportGenwrite@gmail.com&su=Genwrite Enterprise Subscription&body=.`,
              "_blank"
            )
          } else {
            onBuy(plan)
          }
        }}
      >
        {plan.name.toLowerCase().includes("enterprise") && <MailOutlined className="mr-2" />}{" "}
        {plan.cta}
      </motion.button>
      <ul className="mt-8 space-y-3">
        {plan.features.map((feature, idx) => (
          <motion.li
            key={feature}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + idx * 0.05 }}
            className="flex items-center gap-3 text-gray-600"
          >
            <motion.svg
              className="w-5 h-5 text-green-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              whileHover={{ scale: 1.2 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </motion.svg>
            {feature}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}

const Upgrade = () => {
  // [s ] Remove annual plan config completely
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1200) // 1.2s delay for animation simulation

    return () => clearTimeout(timer)
  }, [])

  const navigate = useNavigate()
  const plans = [
    {
      name: "Basic Plan",
      price: 20,
      credits: 450,
      description:
        "Get started with 500 free credits per month. Ideal for individuals exploring GenWrite.",
      features: ["450 credits", "Monthly renewal", "Community support", "Basic AI features"],
      cta: "Buy Now",
      type: "subscription",
      frequency: "month",
      featured: false,
    },
    {
      name: "GenWrite Pro Plan",
      price: 5000 / 100, // Convert cents to dollars
      credits: 1200,
      description: "GenWrite Pro — 3000 credits/month, AI blogging, proofreading, images.",
      features: ["1200 credits", "Monthly billing", "Priority support", "Advanced AI features"],
      cta: "Subscribe Now",
      type: "subscription",
      frequency: "month",
      featured: true,
    },
    {
      name: "GenWrite Enterprise Plan",
      price: "custom", // Convert cents to dollars
      credits: "",
      description: "GenWrite Enterprise — Custom limits & priority support. Contact us.",
      features: ["Unlimited credits", "Monthly billing", "Priority support", "Custom AI features"],
      cta: "Contact Team",
      type: "subscription",
      frequency: "month",
    },
    {
      name: "GenWrite Credit Pack",
      price: null, // Price will be calculated dynamically
      credits: null, // Credits will be entered by the user
      description: "One-time credit top-up",
      features: ["Custom credits", "One-time purchase", "flexible payment", "user defined"],
      cta: "Buy Credits",
      type: "credit_purchase",
    },
  ]

  const handleBuy = async (plan, customCredits = 0) => {
    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

    try {
      const response = await axiosInstance.post("/stripe/checkout", {
        planName: plan.name.toLowerCase().includes("pro")
          ? "pro"
          : plan.name.toLowerCase().includes("basic")
          ? "basic"
          : "credits",
        credits: plan.type === "credit_purchase" ? customCredits : plan.credits,
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
      })

      // Redirect to Stripe checkout
      console.log(response.data)
      if (response?.data.sessionId) {
        const result = await stripe.redirectToCheckout({ sessionId: response.data.sessionId })
        if (result?.error) {
          throw error
        }
      } else {
        throw new Error("Something went wrong")
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
      alert("Failed to initiate checkout. Please try again.")
    }
  }

  return (
    <div className=" bg-gray-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-16">
          <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="inline-block mb-4">
            <motion.h1
              whileHover={{ scale: 1.02 }}
              className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
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

          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Choose the perfect plan for your team. Scale seamlessly as your needs grow.
          </p>

          {/* <motion.div
            className="flex items-center justify-center gap-4 mb-12"
            whileHover={{ scale: 1.02 }}
          >
            <span
              className={`text-sm ${!isAnnual ? "font-semibold text-gray-900" : "text-gray-500"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${
                isAnnual ? "bg-blue-500" : "bg-gray-200"
              }`}
            >
              <motion.div
                className="w-6 h-6 bg-white rounded-full shadow-md"
                animate={{ x: isAnnual ? 26 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            </button>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm ${isAnnual ? "font-semibold text-gray-900" : "text-gray-500"}`}
              >
                Yearly
              </span>
              <AnimatePresence>
                {isAnnual && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="px-2 py-1 bg-blue-100 text-blue-600 rounded-md text-xs font-medium"
                  >
                    Save 20%
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.div> */}
        </motion.div>

        {/* [s ] Use framer-motion to show skeletons & then cards with animate presence. Also update ui of the card header & all */}
        {/* <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} onBuy={handleBuy} />
          ))}
        </div> */}
        <div className="grid md:grid-cols-4 gap-10 ">
          <AnimatePresence mode="wait">
            {loading
              ? Array.from({ length: 3 }).map((_, idx) => <SkeletonCard key={idx} />)
              : plans.map((plan, index) => (
                  <PricingCard key={plan.name} plan={plan} index={index} onBuy={handleBuy} />
                ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default Upgrade
