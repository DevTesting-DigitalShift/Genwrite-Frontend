import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axiosInstance from "@api/index"
import { useNavigate } from "react-router-dom"

const PricingCard = ({ plan, isAnnual, index, onBuy }) => {
  const [customCredits, setCustomCredits] = useState(0) // State for custom credits
  const calculatedPrice = isAnnual ? plan.price * 10 : plan.price

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
        transition: { type: "spring", stiffness: 300 },
      }}
      className={`relative p-8 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 ${
        plan.featured ? "border-2 border-blue-500" : "border border-gray-100"
      }`}
    >
      {plan.featured && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-xl text-sm font-semibold"
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
                placeholder="Enter credits"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500 text-lg">${calculateCustomPrice()} (calculated)</span>
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
              <span className="text-gray-500 text-lg">/{isAnnual ? "year" : "month"}</span>
            </>
          )}
        </div>
        <p className="text-gray-600 text-sm">{plan.description}</p>
      </div>

      <motion.button
        whileHover={{
          scale: 1.05,
          boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
        }}
        whileTap={{ scale: 0.95 }}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          plan.featured
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => {
          if(plan.type === "credit_purchase"){
            if(customCredits == 0){
              alert("Kindly add the credits first")
            }else{
              onBuy(plan, customCredits)
            }
          }else{
            onBuy(plan)
          }
        }}
      >
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
  const [isAnnual, setIsAnnual] = useState(false)
  const navigate = useNavigate()
  const plans = [
    {
      name: "GenWrite Pro Plan",
      price: 5000 / 100, // Convert cents to dollars
      credits: 3000,
      description: "GenWrite Pro — 3000 credits/month, AI blogging, proofreading, images.",
      features: ["3000 credits", "Monthly billing", "Priority support"],
      cta: "Subscribe Now",
      type: "subscription",
      frequency: "month",
      featured: true,
    },
    {
      name: "GenWrite Enterprise Plan",
      price: 50000 / 100, // Convert cents to dollars
      credits: 50000,
      description: "GenWrite Enterprise — Custom limits & priority support. Contact us.",
      features: ["50000 credits", "Monthly billing", "Priority support"],
      cta: "Subscribe Now",
      type: "subscription",
      frequency: "month",
    },
    {
      name: "GenWrite Credit Pack",
      price: null, // Price will be calculated dynamically
      credits: null, // Credits will be entered by the user
      description: "One-time credit top-up",
      features: ["Custom credits", "One-time purchase"],
      cta: "Buy Credits",
      type: "credit_purchase",
    },
  ]

  const handleBuy = async (plan, customCredits = 0) => {
    navigate("/payment/confirm", {
      state: {
        plan,
        customCredits,
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
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

          <motion.div
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
          </motion.div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              isAnnual={isAnnual}
              index={index}
              onBuy={handleBuy}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Upgrade
