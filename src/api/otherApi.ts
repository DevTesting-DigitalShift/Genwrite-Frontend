import { asApiError } from "@/types/api"
import axiosInstance from "."

// 🔵 Stripe API
export const createStripeSession = async (payload: unknown) => {
  const response = await axiosInstance.post("/stripe/create-checkout-session", payload)
  return response.data
}

// 🔵 Stripe API
export const cancelStripeSubscription = async () => {
  const response = await axiosInstance.patch("/stripe/cancel-subscription")
  return response.data
}

export const createPortalSession = async (returnUrl: unknown) => {
  const response = await axiosInstance.get("/stripe/portal", { params: { returnUrl } })
  return response.data
}

// Unsubscribe API
export const unsubscribeUser = async (email: string) => {
  try {
    const res = await axiosInstance.get(`/public/unsubscribe?email=${encodeURIComponent(email)}`)
    return res.data
  } catch (rawError) {
    const error = asApiError(rawError)
    throw new Error(error.response?.data?.message || error.message || "Failed to unsubscribe")
  }
}
