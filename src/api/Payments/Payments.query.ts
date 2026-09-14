// src/api/Payments/Payments.query.ts
import { QueryBase } from "@api/QueryBase"
import { PaymentsAPI } from "./Payments.api"

class PaymentsQuery extends QueryBase<unknown> {
  baseKey = ["payments"]
  api = PaymentsAPI

  useCreateCheckoutSession = () =>
    this.useMutate<Awaited<ReturnType<typeof PaymentsAPI.createCheckoutSession>>, unknown>(
      (payload) => this.api.createCheckoutSession(payload)
    )

  useCreatePortalSession = () =>
    this.useMutate<Awaited<ReturnType<typeof PaymentsAPI.createPortalSession>>, unknown>(
      (returnUrl) => this.api.createPortalSession(returnUrl)
    )

  useCancelSubscription = () =>
    this.useMutate<Awaited<ReturnType<typeof PaymentsAPI.cancelSubscription>>, void>(() =>
      this.api.cancelSubscription()
    )
}

export const paymentsQuery = new PaymentsQuery() as PaymentsQuery
