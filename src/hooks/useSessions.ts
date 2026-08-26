import { useSyncExternalStore } from "react"
import * as sessionStore from "@utils/sessionStore"

/**
 * Subscribes to the session pool so account UI re-renders when accounts are added,
 * removed, or switched — including changes made in another tab, which arrive via the
 * native `storage` event.
 *
 * Read through this rather than calling sessionStore.getSessions() during render: that
 * snapshots at render time and then goes stale until something unrelated re-renders the
 * component.
 */
function subscribe(onChange) {
  window.addEventListener(sessionStore.SESSIONS_CHANGED_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(sessionStore.SESSIONS_CHANGED_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

// useSyncExternalStore compares snapshots by identity, and getSessions() builds a fresh
// array each call — so we snapshot the serialized form and parse it in the selector.
const getSnapshot = () =>
  `${sessionStore.getActiveUserId() ?? ""}|${sessionStore
    .getSessions()
    .map((s) => `${s.userId}:${s.name}:${s.email}:${s.avatar}`)
    .join(",")}`

export function useSessions() {
  useSyncExternalStore(subscribe, getSnapshot, () => "")

  const sessions = sessionStore.getSessions()
  const activeUserId = sessionStore.getActiveUserId()

  return {
    sessions,
    activeUserId,
    activeSession: sessions.find((s) => s.userId === activeUserId) || null,
    atLimit: sessions.length >= sessionStore.MAX_SESSIONS,
    maxSessions: sessionStore.MAX_SESSIONS,
  }
}

/** Convenience for components that only need to know whether a switch is possible. */
export function useHasMultipleSessions() {
  const { sessions } = useSessions()
  return sessions.length > 1
}

export default useSessions
