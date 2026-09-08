import { useMutation } from "@tanstack/react-query"
import axiosInstance from "../index"

// Both endpoints are auth-gated — the backend reads the target account off the bearer
// token, never off a client-supplied email, so no email needs to be sent here.

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      const { data } = await axiosInstance.post("/auth/verify-email", { code })
      return data
    },
  })
}

export const useResendVerification = () => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosInstance.post("/auth/resend-verification-email")
      return data
    },
  })
}
