// src/api/Payments/Payments.api.ts
// Backend module is `payments` (covers both Stripe and Razorpay), but only Stripe routes
// exist in apiSchema.d.ts today — there is no frontend razorpay*.ts file to fold in.
import { apiGet, apiPatch, apiPost, rethrow } from "@api/typedClient"

export const PaymentsAPI = {
  /**
   * Used by Upgrade.tsx, which branches on the real HTTP status of a failure (403
   * credit-purchase block, 409 subscription conflict, 404 missing plan) — left to throw the
   * real ApiRequestError (status/details intact) rather than collapsing it through
   * `rethrow`'s plain Error.
   */
  createCheckoutSession: (payload: unknown) => apiPost("/stripe/checkout", payload as never),

  cancelSubscription: async () => {
    try {
      return await apiPatch("/stripe/cancel-subscription")
    } catch (err) {
      return rethrow(err, "Failed to cancel subscription")
    }
  },

  /**
   * The backend reads `returnUrl` from the request *body* on this GET route
   * (stripe.controller.js#createPortalSession — `req.body?.returnUrl`), a pre-existing quirk
   * this migration didn't introduce. A GET request's body isn't something axios/fetch send
   * reliably (and this typed client only supports query params on GET), so `returnUrl` is sent
   * as a query param here same as before — meaning it's silently ignored server-side and every
   * portal session falls back to the default return URL. Flagged, not fixed: changing that is a
   * backend HTTP-contract decision beyond this pass's scope.
   */
  createPortalSession: async (returnUrl: unknown) => {
    try {
      return await apiGet("/stripe/portal", { query: { returnUrl } as never })
    } catch (err) {
      return rethrow(err, "Failed to create portal session")
    }
  },
}
