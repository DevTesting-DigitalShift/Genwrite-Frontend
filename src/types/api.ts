/**
 * Loosely-typed error from an axios call. Stores and catch blocks read the backend
 * message off `response.data.message`, falling back to the native `Error.message`.
 */
export interface ApiError extends Error {
  response?: {
    status?: number
    data?: {
      message?: string
      error?: string
      /** Endpoints attach their own fields here (neededCredits, code, …). */
      [key: string]: any
    }
  }
  code?: string
}

/** Narrows an unknown catch-block value to the axios-ish error shape. */
export const asApiError = (err: unknown): ApiError => err as ApiError

/** The backend message if there is one, otherwise the given fallback. */
export const apiErrorMessage = (err: unknown, fallback: string): string => {
  const e = asApiError(err)
  return e?.response?.data?.message || e?.message || fallback
}

/**
 * Error thrown by the blog/job creation APIs when the account is short on credits.
 * `status` is 402 and `neededCredits` is how many the operation required.
 */
export interface CreditError extends Error {
  status?: number
  neededCredits?: number
}

/** Builds a CreditError without the `as any` dance at each throw site. */
export const creditError = (message: string, neededCredits?: number): CreditError => {
  const err = new Error(message) as CreditError
  err.status = 402
  err.neededCredits = neededCredits
  return err
}
