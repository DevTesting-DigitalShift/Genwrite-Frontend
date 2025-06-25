import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "@api/index";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { MailOutlined } from "@ant-design/icons";
import { SkeletonCard } from "@components/Projects/SkeletonLoader";
import { Check, Coins, Crown, Mail, Shield, Star, Zap } from "lucide-react";
import { Helmet } from "react-helmet";

const PricingCard = ({ plan, index, onBuy, billingPeriod }) => {
  const [customCredits, setCustomCredits] = useState(5);

  const handleCustomCreditsChange = (e) => {
    const value = parseInt(e.target.value, 10) || 0;
    setCustomCredits(value);
  };

  const calculateCustomPrice = () => {
    return ((customCredits * 5) / 100).toFixed(2);
  };

  // Get the price based on the billing period
  const displayPrice =
    plan.type === "credit_purchase"
      ? null
      : billingPeriod === "annual"
      ? plan.priceAnnual
      : plan.priceMonthly;

  return (
    <div
      className={`relative rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
        plan.featured
          ? "ring-2 ring-blue-500 shadow-xl scale-105"
          : plan.type === "credit_purchase"
          ? "bg-blue-100"
          : "shadow-lg hover:shadow-xl border border-gray-100"
      }`}
    >
      {plan.featured && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
            <Star className="w-4 h-4" /> Most Popular
          </div>
        </div>
      )}

      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
              plan.featured
                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {plan.icon || <Check />}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <p className="text-gray-600 text-sm">{plan.description}</p>
        </div>

        {/* Pricing */}
        <div className="text-center mb-8">
          {plan.type === "credit_purchase" ? (
            <div className="flex gap-4">
              <input
                type="number"
                min="5"
                value={customCredits}
                onChange={handleCustomCreditsChange}
                className={`w-full px-4 py-2 text-center text-blue-600 bg-transparent border-b-2 focus:outline-none appearance-none mb-2 ${
                  customCredits < 5
                    ? "border-red-500 focus:border-red-500"
                    : "border-blue-500 focus:border-blue-500"
                }`}
              />
              <div className="text-blue-600 text-lg">
                ${calculateCustomPrice()} <p className="text-xs">(calculated)</p>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-4xl font-bold text-gray-900">
                {typeof displayPrice === "string" ? displayPrice : `$${displayPrice}`}
              </span>
              {typeof displayPrice !== "string" && (
                <span className="text-gray-500 text-lg">/{billingPeriod}</span>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  plan.featured ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                }`}
              >
                <Check className="w-3 h-3" />
              </div>
              <span className="text-gray-700 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          onClick={() => {
            if (plan.type === "credit_purchase") {
              if (customCredits < 5) return;
              onBuy(plan, customCredits, billingPeriod);
            } else if (plan.name.toLowerCase().includes("enterprise")) {
              window.open(
                `https://mail.google.com/mail/?view=cm&fs=1&to=supportGenwrite@gmail.com&su=Genwrite Enterprise Subscription&body=.`,
                "_blank"
              );
            } else {
              onBuy(plan, plan.credits, billingPeriod);
            }
          }}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 hover:transform hover:scale-105 ${
            plan.featured
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
              : plan.type === "credit_purchase"
              ? "bg-blue-500 text-white"
              : "bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg"
          } ${
            plan.type === "credit_purchase" && customCredits < 5
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          {plan.name.toLowerCase().includes("enterprise") && (
            <Mail className="inline mr-2 w-4 h-4" />
          )}
          {plan.cta}
        </button>
      </div>
    </div>
  );
};

const Upgrade = () => {
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState("monthly"); // State for billing period

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200); // 1.2s delay for animation simulation

    return () => clearTimeout(timer);
  }, []);

  const plans = [
    {
      name: "Basic Plan",
      priceMonthly: 20,
      priceAnnual: 200, // 16.67/month (2 months free)
      credits: 450,
      description:
        "Get started with 450 credits per month. Ideal for individuals exploring GenWrite.",
      features: ["450 credits", "Community support", "Basic AI features"],
      cta: "Buy Now",
      type: "subscription",
      frequency: "month",
      icon: <Zap className="w-8 h-8" />,
      featured: false,
    },
    {
      name: "GenWrite Pro Plan",
      priceMonthly: 50, // 5000 cents
      priceAnnual: 500, // 41.67/month (2 months free)
      credits: 1200,
      description: "GenWrite Pro — 1200 credits/month, AI blogging, proofreading, images.",
      features: ["1200 credits", "Priority support", "Advanced AI features"],
      cta: "Subscribe Now",
      type: "subscription",
      frequency: "month",
      icon: <Shield className="w-8 h-8" />,
      featured: true,
    },
    {
      name: "GenWrite Enterprise Plan",
      priceMonthly: "Custom",
      priceAnnual: "Custom",
      credits: "",
      description: "GenWrite Enterprise — Custom limits & priority support. Contact us.",
      features: ["Unlimited credits", "Priority support", "Custom AI features"],
      cta: "Contact Team",
      type: "subscription",
      icon: <Crown className="w-8 h-8" />,
      frequency: "month",
    },
    {
      name: "GenWrite Credit Pack",
      priceMonthly: null,
      priceAnnual: null,
      credits: null,
      description: "One-time credit top-up",
      features: ["Custom credits", "One-time purchase", "Flexible payment", "User defined"],
      cta: "Buy Credits",
      icon: <Coins className="w-8 h-8" />,
      type: "credit_purchase",
    },
  ];

  const handleBuy = async (plan, credits, billingPeriod) => {
    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

    try {
      const response = await axiosInstance.post("/stripe/checkout", {
        planName: plan.name.toLowerCase().includes("pro")
          ? "pro"
          : plan.name.toLowerCase().includes("basic")
          ? "basic"
          : "credits",
        credits: plan.type === "credit_purchase" ? credits : plan.credits,
        billingPeriod: billingPeriod, // Send billing period to backend
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
      });

      // Redirect to Stripe checkout
      if (response?.data.sessionId) {
        const result = await stripe.redirectToCheckout({ sessionId: response.data.sessionId });
        if (result?.error) {
          throw result.error;
        }
      } else {
        throw new Error("Something went wrong");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to initiate checkout. Please try again.");
    }
  };

  return (
    <div className="bg-gray-50 py-20 px-4">
      <Helmet>
        <title>Subscription | GenWrite</title>
      </Helmet>
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

          {/* Toggle Button */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-full bg-gray-200 p-1">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  billingPeriod === "monthly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  billingPeriod === "annual"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Annual <span className="text-xs text-green-600 ml-1">(Save ~17%)</span>
              </button>
            </div>
          </div>
        </motion.div>
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-10">
          <AnimatePresence>
            {loading
              ? Array.from({ length: 4 }).map((_, idx) => <SkeletonCard key={idx} />)
              : plans.map((plan, index) => (
                  <PricingCard
                    key={plan.name}
                    plan={plan}
                    index={index}
                    onBuy={handleBuy}
                    billingPeriod={billingPeriod}
                  />
                ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;