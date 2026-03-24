import { useMutation } from "@tanstack/react-query"
import axiosInstance from "../index"

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: async ({ token }) => {
      const { data } = await axiosInstance.post("/auth/verify-email", { token })
      return data
    },
  })
}

export const useResendVerification = () => {
  return useMutation({
    mutationFn: async ({ email }) => {
      const { data } = await axiosInstance.post("/auth/resend-verification-email", { email })
      return data
    },
  })
}
