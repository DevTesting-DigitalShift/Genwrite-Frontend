import { motion } from "framer-motion"
import { X } from "lucide-react"
import { Check } from "lucide-react"
import React from "react"

const featureCategories = [
  {
    index: 1,
    name: "Blog Creation",
    features: [
      {
        name: "Single blog",
        available: ["basic", "pro", "enterprise", "credits"],
      },
      { name: "Multiple blogs", available: ["pro", "enterprise", "credits"] },
      {
        name: "Quick blog",
        available: ["basic", "pro", "enterprise", "credits"],
      },
      {
        name: "Automated job runs",
        available: ["pro", "enterprise", "credits"],
        details: {
          basic: "10 Jobs",
          pro: "50 Jobs",
          enterprise: "50 Jobs",
        },
      },
    ],
  },
  {
    index: 2,
    name: "AI Features",
    features: [
      {
        name: "AI-generated blogs",
        available: ["basic", "pro", "enterprise", "credits"],
        details: {
          basic: "10 Images",
          pro: "50 Images",
          enterprise: "50 Images",
        },
      },
      {
        name: "AI images with blogs",
        available: ["basic", "pro", "enterprise", "credits"],
      },
      { name: "Proofreading", available: ["pro", "enterprise", "credits"] },
      {
        name: "Custom AI Model",
        available: ["pro", "enterprise", "credits"],
      },
    ],
  },
  {
    index: 3,
    name: "Data & Analytics",
    features: [
      {
        name: "Google Search Console data",
        available: ["basic", "pro", "enterprise", "credits"],
      },
      {
        name: "Competitive analysis",
        available: ["pro", "enterprise", "credits"],
      },
    ],
  },
  {
    index: 4,
    name: "Blog Improvisation",
    features: [
      {
        name: "Retry Blogs Generation",
        available: ["pro", "enterprise", "credits"],
      },
      {
        name: "Re-Write Blogs/Lines",
        available: ["basic", "pro", "enterprise", "credits"],
      },
      {
        name: "Re-Generate Blogs Generation",
        available: ["pro", "enterprise", "credits"],
      },
    ],
  },
  {
    index: 5,
    name: "Exports & Posting",
    features: [
      { name: "Export blogs", available: ["pro", "enterprise", "credits"] },
      {
        name: "Automatic Wordpress Posting",
        available: ["pro", "enterprise", "credits"],
      },
    ],
  },
]

const ComparisonTable = ({ plans }) => {
  const getPlanStyles = (tier) => {
    switch (tier) {
      case "basic":
        return { text: "text-green-600", icon: "text-green-600" }
      case "pro":
        return {
          text: "bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent",
          icon: "text-blue-500",
        }
      case "enterprise":
        return { text: "text-orange-500", icon: "text-orange-500" }
      case "credits":
        return { text: "text-purple-600", icon: "text-purple-600" }
      default:
        return { text: "text-orange-400", icon: "text-orange-400" }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-8 mt-20"
    >
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mt-6 mb-40 tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-pink-500 bg-clip-text text-transparent">
        Compare Our{" "}
        <span className="bg-gradient-to-r from-orange-500 to-pink-400 bg-clip-text text-transparent">
          GenWrite
        </span>{" "}
        Plans
      </h1>

      <div className="rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="sticky top-0 z-20 bg-white">
                <th className="p-2 sm:p-3 md:p-4 text-left text-gray-900 font-semibold text-sm sm:text-base md:text-lg"></th>
                {plans.map((plan) => {
                  const styles = getPlanStyles(plan.tier)
                  return (
                    <th
                      key={plan.name}
                      className="p-2 sm:p-3 md:p-4 text-center min-w-[120px] sm:min-w-[150px]"
                    >
                      <div className={`text-lg sm:text-xl md:text-2xl font-bold ${styles.text}`}>
                        {plan.name}
                      </div>
                      {plan.seats && (
                        <div className="text-xs sm:text-sm text-gray-500 mt-1">
                          {plan.seats} seats
                          {plan.extraSeatsMonthly && (
                            <span>
                              , +${plan.extraSeatsMonthly}/mo per extra seat
                              {plan.extraSeatsAnnual && (
                                <span className="text-gray-400">
                                  (${plan.extraSeatsAnnual}/mo, billed yearly)
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {featureCategories.map((category, catIndex) => (
                <React.Fragment key={category.name}>
                  <tr className={`${category.index > 0 ? "mt-6 sm:mt-10" : ""}`}>
                    <td
                      colSpan={plans.length + 1}
                      className={`p-2 sm:p-3 md:p-4 uppercase tracking-widest font-bold text-gray-700 text-sm sm:text-base md:text-lg ${
                        category.index > 1 ? "pt-6 sm:pt-8 md:pt-10" : ""
                      }`}
                    >
                      {category.name}
                    </td>
                  </tr>
                  {category.features.map((feature, featIndex) => {
                    const globalIndex =
                      featureCategories
                        .slice(0, catIndex)
                        .reduce((acc, c) => acc + c.features.length + 1, 0) +
                      featIndex +
                      1

                    return (
                      <tr
                        key={feature.name}
                        className={`${
                          globalIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100 transition-all duration-200`}
                      >
                        <td className="p-2 sm:p-3 md:p-4 text-gray-700 text-xs sm:text-sm md:text-base">
                          {feature.name}
                        </td>
                        {plans.map((plan) => {
                          const styles = getPlanStyles(plan.tier)
                          return (
                            <td key={plan.name} className="p-2 sm:p-3 md:p-4 text-center">
                              {feature.available.includes(plan.tier) ? (
                                feature.details && feature.details[plan.tier] ? (
                                  <span className={`text-xs sm:text-sm ${styles.text} font-medium`}>
                                    {feature.details[plan.tier]}
                                  </span>
                                ) : (
                                  <Check
                                    className={`w-4 sm:w-5 h-4 sm:h-5 mx-auto ${styles.icon}`}
                                  />
                                )
                              ) : (
                                <X
                                  className={`w-4 sm:w-5 h-4 sm:h-5 mx-auto ${styles.icon.replace(
                                    "600",
                                    "400"
                                  )}`}
                                />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}

export default ComparisonTable
