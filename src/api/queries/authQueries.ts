import { useMutation } from "@tanstack/react-query"
import axiosInstance from "../index"

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      const { data } = await axiosInstance.post("/auth/verify-email", { token })
      return data
    },
  })
}

export const useResendVerification = () => {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const { data } = await axiosInstance.post("/auth/resend-verification-email", { email })
      return data
    },
  })
}
