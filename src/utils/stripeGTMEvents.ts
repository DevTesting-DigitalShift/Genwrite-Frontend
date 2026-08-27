import { pushToDataLayer } from "@utils/DataLayer"

export interface StripePlan {
  name: string
  eventName: string
  annualPrice?: number
  priceMonthly?: number
}

export type BillingPeriod = "monthly" | "annual"

export function sendStripeGTMEvent(
  plan: StripePlan,
  credits: number,
  billingPeriod: BillingPeriod,
  userId?: string
): void {
  const isCreditPack = /credit/gi.test(plan.name)
  const value = isCreditPack
    ? credits / 100
    : billingPeriod === "annual"
      ? plan.annualPrice
      : plan.priceMonthly
  const creditsForPeriod = isCreditPack
    ? credits
    : billingPeriod === "monthly"
      ? credits
      : 12 * credits // 12x for annual

  // 1️⃣ Send unique click event for the plan
  pushToDataLayer({
    event: plan.eventName, // Already generated in getPlans
    user_id: userId,
    plan_name: plan.name,
    currency: "USD",
    value, // fallback for credit packs
    billing_period: isCreditPack ? "one_time" : billingPeriod,
    credits: creditsForPeriod,
  })

  // 2️⃣ Send "begin_checkout" event for ALL plans
  pushToDataLayer({
    event: "begin_checkout",
    ecommerce: {
      currency: "USD",
      value,
      items: [
        {
          item_name: plan.name,
          price: value,
          billing_period: isCreditPack ? "one_time" : billingPeriod,
          credits: creditsForPeriod,
        },
      ],
    },
  })
}

interface CancellationUser {
  _id?: string
  subscription?: {
    plan?: string
    startDate?: string
    renewalDate?: string
  }
}

export function sendCancellationRelatedEvent(
  user: CancellationUser,
  key: "cancel" | "discount"
): void {
  pushToDataLayer({
    event: key === "cancel" ? "subscription_cancellation" : "credit_discount_opted",
    user_id: user._id,
    user_subscription: user.subscription?.plan,
    user_subscription_startDate: user.subscription?.startDate,
    user_subscription_renewalDate: user.subscription?.renewalDate,
    user_discount: key === "discount" ? 30 : undefined,
    user_action_reason: "user_initiated", // You can customize this based on actual reason
  })
}
