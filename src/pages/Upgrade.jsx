import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "@api/index";
import { loadStripe } from "@stripe/stripe-js";
import { Check, Coins, Crown, Mail, Shield, Star, X, Zap } from "lucide-react";
import { Helmet } from "react-helmet";
import { SkeletonCard } from "@components/Projects/SkeletonLoader";
import { message } from "antd";
import ReactGA from "react-ga4";

const PricingCard = ({ plan, index, onBuy, billingPeriod }) => {
  const [customCredits, setCustomCredits] = useState(500);

  const handleCustomCreditsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setCustomCredits(value);
  };

  const calculateCustomPrice = () => {
    return (customCredits * 0.01).toFixed(2);
  };

  const displayPrice =
    plan.type === "credit_purchase"
      ? null
      : billingPeriod === "annual"
      ? plan.priceAnnual
      : plan.priceMonthly;

  const getCardStyles = () => {
    switch (plan.tier) {
      case "basic":
        return {
          container: "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg",
          icon: "bg-gray-50 text-gray-600",
          price: "text-gray-900",
          button: "bg-gray-900 hover:bg-gray-800 text-white",
          accent: "text-gray-600",
        };
      case "pro":
        return {
          container:
            "bg-white border-2 border-blue-200 hover:border-blue-300 hover:shadow-xl shadow-lg",
          icon: "bg-blue-50 text-blue-600",
          price: "text-blue-600",
          button: "bg-blue-600 hover:bg-blue-700 text-white",
          accent: "text-blue-600",
        };
      case "enterprise":
        return {
          container: "bg-white border border-purple-200 hover:border-purple-300 hover:shadow-lg",
          icon: "bg-purple-50 text-purple-600",
          price: "text-purple-600",
          button: "bg-purple-600 hover:bg-purple-700 text-white",
          accent: "text-purple-600",
        };
      case "credits":
        return {
          container: "bg-white border border-emerald-200 hover:border-emerald-300 hover:shadow-lg",
          icon: "bg-emerald-50 text-emerald-600",
          price: "text-emerald-600",
          button: "bg-emerald-600 hover:bg-emerald-700 text-white",
          accent: "text-emerald-600",
        };
      default:
        return {
          container: "bg-white border border-gray-200",
          icon: "bg-gray-50 text-gray-600",
          price: "text-gray-900",
          button: "bg-gray-900 hover:bg-gray-800 text-white",
          accent: "text-gray-600",
        };
    }
  };

  const styles = getCardStyles();

  return (
    <div className={`relative group ${plan.featured ? "lg:scale-105" : ""}`}>
      {plan.featured && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
            <Star className="w-4 h-4" />
            Most Popular
          </div>
        </div>
      )}

      <div
        className={`relative rounded-2xl transition-all duration-300 hover:scale-[1.02] ${styles.container} overflow-hidden p-8 h-full flex flex-col`}
      >
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center ${styles.icon}`}
          >
            {plan.icon}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{plan.name}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{plan.description}</p>
        </div>

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
                  <span className="text-gray-500 text-lg pb-1">/{billingPeriod}</span>
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

        <div className="space-y-3 mb-8 flex-grow">
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

        <button
          onClick={() => {
            if (plan.type === "credit_purchase") {
              if (customCredits < 500) return;
              onBuy(plan, customCredits, billingPeriod);
            } else if (plan.name.toLowerCase().includes("enterprise")) {
              ReactGA.event("contact_sales", {
                plan: plan.name,
              });
              window.open(
                `https://mail.google.com/mail/?view=cm&fs=1&to=support@genwrite.com&su=GenWrite Enterprise Subscription&body=I'm interested in the Enterprise plan.`,
                "_blank"
              );
            } else {
              onBuy(plan, plan.credits, billingPeriod);
            }
          }}
          className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg ${
            styles.button
          } ${
            plan.type === "credit_purchase" && customCredits < 500
              ? "opacity-50 cursor-not-allowed"
              : ""
          } flex items-center justify-center gap-2`}
          disabled={plan.type === "credit_purchase" && customCredits < 500}
        >
          {plan.name.toLowerCase().includes("enterprise") && <Mail className="w-4 h-4" />}
          {plan.cta}
        </button>
      </div>
    </div>
  );
};

const ComparisonTable = ({ plans, billingPeriod }) => {
  // Define feature categories and features inspired by Canva and tailored for GenWrite
  const featureCategories = [
    {
      name: "General Features",
      features: [
        {
          name: "Blog generation (single, quick, multiple)",
          available: ["basic", "pro", "enterprise", "credits"],
        },
        { name: "Keyword research", available: ["basic", "pro", "enterprise", "credits"] },
        { name: "Performance monitoring", available: ["basic", "pro", "enterprise", "credits"] },
        {
          name: "Automatic WordPress posting",
          available: ["basic", "pro", "enterprise", "credits"],
        },
        { name: "Custom templates", available: ["pro", "enterprise"] },
        { name: "Advanced export options (PDF, CSV, JSON)", available: ["pro", "enterprise"] },
        { name: "Custom dimensions for designs", available: ["pro", "enterprise"] },
        { name: "Bulk content creation", available: ["pro", "enterprise"] },
      ],
    },
    {
      name: "AI Features",
      features: [
        { name: "Humanize pasted content", available: ["basic", "pro", "enterprise", "credits"] },
        { name: "Retry blog generation", available: ["pro", "enterprise", "credits"] },
        { name: "Regenerate content", available: ["pro", "enterprise", "credits"] },
        { name: "Rewrite blog", available: ["pro", "enterprise", "credits"] },
        { name: "Proofreading", available: ["pro", "enterprise", "credits"] },
        { name: "SEO optimization", available: ["pro", "enterprise"] },
        { name: "AI content suggestions", available: ["pro", "enterprise"] },
        // { name: "Text-to-image generation", available: ["pro", "enterprise"] },
        { name: "Custom AI models", available: ["enterprise"] },
        {
          name: "AI usage credits",
          available: ["basic", "pro", "enterprise", "credits"],
          details: {
            basic: billingPeriod === "annual" ? "12,000/year" : "1,000/month",
            pro: billingPeriod === "annual" ? "54,000/year" : "4,500/month",
            enterprise: "Unlimited",
            credits: "Custom",
          },
        },
      ],
    },
    // {
    //   name: "Collaboration & Workflow",
    //   features: [
    //     { name: "Jobs scheduling", available: ["pro", "enterprise"] },
    //     { name: "Real-time collaboration", available: ["pro", "enterprise"] },
    //     { name: "Commenting and feedback", available: ["pro", "enterprise"] },
    //     { name: "Approval workflows", available: ["enterprise"] },
    //     { name: "Team asset library", available: ["enterprise"] },
    //     { name: "Role-based access control", available: ["enterprise"] },
    //   ],
    // },
    {
      name: "Analytics & Insights",
      features: [
        { name: "Competitor analysis", available: ["pro", "enterprise"] },
        { name: "Basic content analytics", available: ["basic", "pro", "enterprise", "credits"] },
        { name: "Advanced content insights", available: ["pro", "enterprise"] },
        // { name: "Performance reports", available: ["enterprise"] },
      ],
    },
    // {
    //   name: "Integrations & Security",
    //   features: [
    //     {
    //       name: "Third-party integrations (e.g., Google Drive, Slack)",
    //       available: ["pro", "enterprise"],
    //     },
    //     { name: "Custom integrations via API", available: ["enterprise"] },
    //     { name: "Single sign-on (SSO)", available: ["enterprise"] },
    //     { name: "Multi-factor authentication (MFA)", available: ["enterprise"] },
    //     { name: "ISO 27001 certification", available: ["enterprise"] },
    //     { name: "SOC 2 Type II compliance", available: ["enterprise"] },
    //   ],
    // },
    {
      name: "Support & Training",
      features: [
        { name: "Email support", available: ["basic", "pro", "enterprise", "credits"] },
        { name: "Priority support", available: ["pro", "enterprise"] },
        { name: "Dedicated support manager", available: ["enterprise"] },
        { name: "Training & onboarding", available: ["enterprise"] },
        // { name: "SLA guarantee", available: ["enterprise"] },
        { name: "Early access to beta tools", available: ["enterprise"] },
      ],
    },
    // {
    //   name: "Storage",
    //   features: [
    //     {
    //       name: "Cloud storage",
    //       available: ["basic", "pro", "enterprise", "credits"],
    //       details: {
    //         basic: "5GB",
    //         pro: "100GB",
    //         enterprise: "1TB",
    //         credits: "Based on usage",
    //       },
    //     },
    //   ],
    // },
  ];

  // Compute monthly cost for annual billing
  const getMonthlyCost = (plan) => {
    if (plan.tier === "enterprise") return "Custom";
    if (plan.tier === "credits") return "Pay-as-you-go";
    if (billingPeriod === "monthly") return `$${plan.priceMonthly}/month`;
    // For annual, calculate equivalent monthly cost
    const monthlyEquivalent = (plan.annualPrice / 12).toFixed(2);
    return `$${monthlyEquivalent}/month, charged annually`;
  };

  return (
    <div className="mt-20 bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-8 sm:px-10">
        {/* <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Compare Plans</h2> */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 sticky top-0 z-10">
                <th className="p-6 text-left text-gray-900 font-semibold w-1/3"></th>
                {plans.map((plan) => (
                  <th
                    key={plan.name}
                    className={`p-6 text-center font-semibold ${
                      plan.tier === "basic"
                        ? "text-gray-600"
                        : plan.tier === "pro"
                        ? "text-blue-600"
                        : plan.tier === "enterprise"
                        ? "text-purple-600"
                        : "text-emerald-600"
                    }`}
                  >
                    <div>{plan.name}</div>
                    <div className="text-sm mt-1 text-gray-500">{getMonthlyCost(plan)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureCategories.map((category, catIndex) => (
                <React.Fragment key={category.name}>
                  <tr className="bg-gray-100">
                    <td colSpan={plans.length + 1} className="p-4 font-bold text-gray-800 text-lg">
                      {category.name}
                    </td>
                  </tr>
                  {category.features.map((feature, featIndex) => (
                    <tr
                      key={feature.name}
                      className={`${
                        (catIndex + featIndex) % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-gray-100 transition-all duration-200`}
                    >
                      <td className="p-4 text-gray-700 font-medium border-b border-gray-200">
                        {feature.name}
                      </td>
                      {plans.map((plan) => (
                        <td key={plan.name} className="p-4 text-center border-b border-gray-200">
                          {feature.available.includes(plan.tier) ? (
                            feature.details && feature.details[plan.tier] ? (
                              <span
                                className={`text-sm ${
                                  plan.tier === "basic"
                                    ? "text-gray-600"
                                    : plan.tier === "pro"
                                    ? "text-blue-600"
                                    : plan.tier === "enterprise"
                                    ? "text-purple-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {feature.details[plan.tier]}
                              </span>
                            ) : (
                              <Check
                                className={`w-5 h-5 mx-auto ${
                                  plan.tier === "basic"
                                    ? "text-gray-600"
                                    : plan.tier === "pro"
                                    ? "text-blue-600"
                                    : plan.tier === "enterprise"
                                    ? "text-purple-600"
                                    : "text-emerald-600"
                                }`}
                              />
                            )
                          ) : (
                            <X
                              className={`w-5 h-5 mx-auto ${
                                plan.tier === "basic"
                                  ? "text-gray-600"
                                  : plan.tier === "pro"
                                  ? "text-blue-600"
                                  : plan.tier === "enterprise"
                                  ? "text-purple-600"
                                  : "text-emerald-600"
                              }`}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Upgrade = () => {
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState("annual");
  const [showComparisonTable, setShowComparisonTable] = useState(true);

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/upgrade", title: "Upgrade Page" });
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const getPlans = (billingPeriod) => {
    return [
      {
        name: "Basic Plan",
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
          "Automatic WordPress Posting",
          "Basic content analytics",
          // "5GB cloud storage",
        ],
        cta: "Get Started",
        type: "subscription",
        icon: <Zap className="w-8 h-8" />,
        tier: "basic",
        featured: false,
      },
      {
        name: "GenWrite Pro",
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
          "Automatic WordPress Posting",
          "Custom AI models & workflows",
          // "Text-to-image generation",
          // "Real-time collaboration",
          // "Commenting and feedback",
          // "Third-party integrations",
          "Advanced content insights",
          // "100GB cloud storage",
        ],
        cta: "Upgrade to Pro",
        type: "subscription",
        icon: <Shield className="w-8 h-8" />,
        tier: "pro",
        featured: true,
      },
      {
        name: "Enterprise",
        priceMonthly: "Custom",
        priceAnnual: "Custom",
        credits: "Unlimited",
        description: "Tailored solutions with unlimited access and dedicated support.",
        features: [
          "Everything in Pro, additionally:",
          "Flexible usage based on your needs",
          "Dedicated support manager",
          "Custom integrations",
          // "SSO & advanced security",
          // "Training & onboarding",
          // "SLA guarantee",
          "Early access to beta tools",
          "Automatic WordPress Posting",
          "Approval workflows",
          // "Team asset library",
          // "Role-based access control",
          // "Team performance reports",
          // "ISO 27001 certification",
          // "SOC 2 Type II compliance",
          // "Multi-factor authentication (MFA)",
          // "1TB cloud storage",
        ],
        cta: "Contact Sales",
        type: "subscription",
        icon: <Crown className="w-8 h-8" />,
        tier: "enterprise",
        featured: false,
      },
      {
        name: "Credit Pack",
        priceMonthly: null,
        priceAnnual: null,
        credits: null,
        description: "Flexible one-time credit purchase for occasional users.",
        features: [
          "Custom credit amount",
          "No subscription required",
          "Credits never expire",
          "All features unlocked based on usage",
          "Automatic WordPress Posting",
          "Blog generation: single, quick, multiple",
          "Keyword research",
          "Performance monitoring",
          "Humanize pasted content",
          "Email support",
          "Basic content analytics",
          // "Cloud storage based on usage",
        ],
        cta: "Buy Credits",
        type: "credit_purchase",
        icon: <Coins className="w-8 h-8" />,
        tier: "credits",
        featured: false,
      },
    ];
  };

  const plans = getPlans(billingPeriod);

  const handleBuy = async (plan, credits, billingPeriod) => {
    ReactGA.event("begin_checkout", {
      currency: "USD",
      value: billingPeriod === "annual" ? plan.annualPrice : plan.priceMonthly,
      items: [
        {
          item_id: plan.tier,
          item_name: plan.name,
          price: billingPeriod === "annual" ? plan.priceAnnual : plan.priceMonthly,
          quantity: 1,
        },
      ],
    });

    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

    try {
      const { data } = await axiosInstance.post("/stripe/checkout", {
        planName: plan.name.toLowerCase().includes("pro")
          ? "pro"
          : plan.name.toLowerCase().includes("basic")
          ? "basic"
          : "credits",
        credits: plan.type === "credit_purchase" ? credits : plan.credits,
        billingPeriod,
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
      });

      console.log(data.sessionId)

      const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (result?.error) throw result.error;
    } catch (error) {
      console.error("Checkout error:", error);
      message.error("Failed to initiate checkout. Please try again.");
    }
  };

  return (
    <div className="bg-gray-50 py-10 px-4">
      <Helmet>
        <title>Subscription | GenWrite</title>
      </Helmet>
      <div className="mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-16">
          <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="inline-block mb-4">
            <motion.h1
              whileHover={{ scale: 1.02 }}
              className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
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
              {["monthly", "annual"].map((period) => (
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

        <AnimatePresence>
          {showComparisonTable && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ComparisonTable plans={plans} billingPeriod={billingPeriod} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Upgrade;