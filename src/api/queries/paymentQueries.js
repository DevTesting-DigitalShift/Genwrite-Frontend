import { useMutation } from "@tanstack/react-query"
import axiosInstance from "../index"

export const useCreateCheckoutSession = () => {
  return useMutation({
    mutationFn: async payload => {
      const response = await axiosInstance.post("/stripe/checkout", payload)
      return response // Returning the whole response for status check
    },
  })
}

export const useCreatePortalSession = () => {
  return useMutation({
    mutationFn: async returnUrl => {
      const response = await axiosInstance.get("/stripe/portal", { params: { returnUrl } })
      return response.data
    },
  })
}
