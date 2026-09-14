// src/api/Payments/Payments.query.ts
import { QueryBase } from "@api/QueryBase"
import { PaymentsAPI } from "./Payments.api"
import type { ApiRequestBody, ApiResponse } from "@/types/apiHelpers"

class PaymentsQuery extends QueryBase<unknown> {
  baseKey = ["payments"]
  api = PaymentsAPI

  useCreateCheckoutSession = () =>
    this.useMutate<
      ApiResponse<"/stripe/checkout", "post">,
      ApiRequestBody<"/stripe/checkout", "post">
    >((payload) => this.api.createCheckoutSession(payload))

  useCreatePortalSession = () =>
    this.useMutate<ApiResponse<"/stripe/portal", "get">, string | undefined>((returnUrl) =>
      this.api.createPortalSession(returnUrl)
    )

  useCancelSubscription = () =>
    this.useMutate<ApiResponse<"/stripe/cancel-subscription", "patch">, void>(() =>
      this.api.cancelSubscription()
    )
}

export const paymentsQuery = new PaymentsQuery() as PaymentsQuery
