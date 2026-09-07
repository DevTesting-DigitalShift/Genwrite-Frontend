const STORAGE_KEY = "postAuthRedirect"

/**
 * Remembers a path (e.g. /accept-invite?token=...) to return to once the
 * user finishes logging in, signing up, or onboarding.
 */
export const setPostAuthRedirect = (path: string): void => {
  sessionStorage.setItem(STORAGE_KEY, path)
}

/**
 * Reads and clears the pending post-auth redirect, if any. Returns null
 * when there isn't one, so callers can fall back to their default route.
 */
export const consumePostAuthRedirect = (): string | null => {
  const path = sessionStorage.getItem(STORAGE_KEY)
  if (path) sessionStorage.removeItem(STORAGE_KEY)
  return path
}
