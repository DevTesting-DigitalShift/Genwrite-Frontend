import type { NavigateFunction } from "react-router-dom"
import useAnalysisStore from "@store/useAnalysisStore"
import useAuthStore from "@store/useAuthStore"
import useBlogStore from "@store/useBlogStore"
import useBrandStore from "@store/useBrandStore"
import useContentStore from "@store/useContentStore"
import useCreditLogStore from "@store/useCreditLogStore"
import useGscStore from "@store/useGscStore"
import useImageStore from "@store/useImageStore"
import useJobStore from "@store/useJobStore"
import useWorkspaceStore from "@store/useWorkspaceStore"
import { queryClient } from "@utils/queryClient"
import * as sessionStore from "@utils/sessionStore"
import { connectSocket, disconnectSocket } from "@utils/socket"

// Every account-scoped Zustand store that caches data in plain (non-persisted) module
// state and would otherwise leak from one account into another across a switch.
const ACCOUNT_SCOPED_STORES = [
  useJobStore,
  useBlogStore,
  useBrandStore,
  useAnalysisStore,
  useGscStore,
  useContentStore,
  useCreditLogStore,
  useImageStore,
]

/** react-router's `useNavigate` return value. */
type NavigateFn = NavigateFunction

/** Full teardown for "signing out of everything" — no account remains to switch into. */
export function clearAllAccountState(): void {
  disconnectSocket()
  clearAccountScopedState()
}

function clearAccountScopedState(): void {
  queryClient.clear()
  for (const store of ACCOUNT_SCOPED_STORES) {
    store.getState().reset?.()
  }
  // No account should silently inherit another account's "viewing a shared
  // workspace" context.
  useWorkspaceStore.getState().exitToOwnWorkspace()
}

interface SwitchOptions {
  navigate?: NavigateFn
  /**
   * Overrides the landing route, e.g. a freshly signed-up second account goes to
   * /onboarding rather than straight to the dashboard.
   */
  redirectTo?: string
}

/**
 * Switches the active account to an already-added session, refetching that user's
 * profile and reconnecting the socket, then clearing every other account-scoped
 * cache/store so nothing from the previous account leaks into the new one.
 */
export async function switchToAccount(
  userId: string,
  { navigate, redirectTo = "/dashboard" }: SwitchOptions = {}
): Promise<void> {
  disconnectSocket()
  clearAccountScopedState()

  const { token } = await useAuthStore.getState().switchAccount(userId)

  connectSocket(token)

  if (navigate) navigate(redirectTo, { replace: true })
  else window.location.href = redirectTo
}

/**
 * Removes the current session and, if any others remain, switches to the next one.
 * If none remain, the caller (useAuthStore.logoutUser) falls back to redirecting to
 * /login itself.
 *
 * @returns the next active userId, or null if no sessions remain
 */
export async function switchToNextOrNull(
  removedUserId: string,
  { navigate }: { navigate?: NavigateFn } = {}
): Promise<string | null> {
  const nextUserId = sessionStore.removeSession(removedUserId)
  disconnectSocket()
  clearAccountScopedState()

  if (!nextUserId) return null

  const { token } = await useAuthStore.getState().switchAccount(nextUserId)
  connectSocket(token)

  if (navigate) navigate("/dashboard")
  else window.location.href = "/dashboard"

  return nextUserId
}
