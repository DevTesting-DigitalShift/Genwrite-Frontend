import { pushToDataLayer } from "@utils/DataLayer"

export function sendStripeGTMEvent(plan, credits, billingPeriod, userId) {
  const isCreditPack = /credit/gi.test(plan.name)
  console.log(userId)
  // 1️⃣ Send unique click event for the plan
  pushToDataLayer({
    event: plan.eventName, // Already generated in getPlans
    user_id: userId,
    plan_name: plan.name,
    currency: "USD",
    value: isCreditPack
      ? credits / 100
      : billingPeriod === "annual"
      ? plan.annualPrice
      : plan.priceMonthly, // fallback for credit packs
    billing_period: isCreditPack ? "one_time" : billingPeriod,
    credits: isCreditPack ? credits : billingPeriod === "monthly" ? credits : 12 * credits, // 12x for annual
  })

  // 2️⃣ Send "begin_checkout" event for ALL plans
  pushToDataLayer({
    event: "begin_checkout",
    ecommerce: {
      currency: "USD",
      value: isCreditPack
        ? credits / 100
        : billingPeriod === "annual"
        ? plan.annualPrice
        : plan.priceMonthly,
      items: [
        {
          item_name: plan.name,
          price: isCreditPack
            ? credits / 100
            : billingPeriod === "annual"
            ? plan.annualPrice
            : plan.priceMonthly,

          billing_period: isCreditPack ? "one_time" : billingPeriod,
          credits: isCreditPack ? credits : billingPeriod === "monthly" ? credits : 12 * credits, // 12x for annual
        },
      ],
    },
  })
}
