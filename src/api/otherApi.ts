import { asApiError } from "@/types/api"
import axiosInstance from "."

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
