import { apiGet, apiPatch, apiPost, ApiRequestError } from "./typedClient"

const rethrow = (err: unknown, fallback: string): never => {
  if (err instanceof ApiRequestError) throw new Error(err.message || fallback)
  throw err instanceof Error ? err : new Error(fallback)
}

/**
 * Used by Upgrade.tsx, which branches on the real HTTP status of a failure (403 credit-purchase
 * block, 409 subscription conflict, 404 missing plan) — left to throw the real ApiRequestError
 * (status/details intact) rather than collapsing it through `rethrow`'s plain Error. The path
 * this used to call, /stripe/create-checkout-session, never existed; the real route is
 * /stripe/checkout (stripe.route.js) — fixed here.
 */
export const createStripeSession = (payload: unknown) =>
  apiPost("/api/v1/stripe/checkout", payload as never)

export const cancelStripeSubscription = async () => {
  try {
    return await apiPatch("/api/v1/stripe/cancel-subscription")
  } catch (err) {
    return rethrow(err, "Failed to cancel subscription")
  }
}

/**
 * The backend reads `returnUrl` from the request *body* on this GET route
 * (stripe.controller.js#createPortalSession — `req.body?.returnUrl`), a pre-existing quirk
 * this migration didn't introduce. A GET request's body isn't something axios/fetch send
 * reliably (and this typed client only supports query params on GET), so `returnUrl` is sent
 * as a query param here same as before — meaning it's silently ignored server-side and every
 * portal session falls back to the default return URL. Flagged, not fixed: changing that is a
 * backend HTTP-contract decision beyond this pass's scope.
 */
export const createPortalSession = async (returnUrl: unknown) => {
  try {
    return await apiGet("/api/v1/stripe/portal", { query: { returnUrl } as never })
  } catch (err) {
    return rethrow(err, "Failed to create portal session")
  }
}
