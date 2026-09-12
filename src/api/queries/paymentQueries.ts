import { useMutation } from "@tanstack/react-query"
import { createStripeSession, createPortalSession } from "@api/stripeApi"

export const useCreateCheckoutSession = () => {
  return useMutation({ mutationFn: createStripeSession })
}

export const useCreatePortalSession = () => {
  return useMutation({ mutationFn: createPortalSession })
}
