// Central multi-account session storage. Plain module (no React/Zustand import) so it
// can be used from axios interceptors, socket.js, and Zustand stores alike without
// import cycles. Backed by a single localStorage key holding every logged-in account's
// token — this is the seam to change (activeUserId -> sessionStorage, per tab) if we
// ever want independent active accounts per browser tab; v1 shares one active account
// across all tabs of the browser.

const STORAGE_KEY = "gw_sessions"
export const SESSIONS_CHANGED_EVENT = "gw:sessions-changed"
// Dispatched by the axios response interceptor on a 401 for the active session, while
// other sessions remain logged in. SessionExpiredModal (mounted at the app root)
// listens for this to offer "re-authenticate" / "switch account" instead of a hard
// redirect to /login.
export const SESSION_EXPIRED_EVENT = "gw:session-expired"
const LEGACY_TOKEN_KEY = "token"

/**
 * How many accounts may be signed in on one browser at once. Every session holds a live
 * token in localStorage, so this is a blast-radius limit as much as a UI one — and the
 * account dropdown stops being scannable well before it.
 */
export const MAX_SESSIONS = 5

export const SESSION_LIMIT_ERROR_CODE = "SESSION_LIMIT_REACHED"

export const SESSION_LIMIT_MESSAGE = `You can be signed into at most ${MAX_SESSIONS} accounts on this browser. Sign out of one before adding another.`

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.version !== 1 || !Array.isArray(parsed.sessions)) return null
    return parsed
  } catch {
    return null
  }
}

function writeRaw(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent(SESSIONS_CHANGED_EVENT))
}

// One-time upgrade path: wrap a pre-multi-account single token into a session so
// existing logged-in users aren't logged out when this ships. The real userId isn't
// known yet — upsertSession() patches this placeholder in once loadAuthenticatedUser
// resolves.
function migrateLegacyToken() {
  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY)
  if (!legacyToken) return null

  const data = {
    version: 1,
    sessions: [
      {
        userId: "pending",
        email: "",
        name: "",
        avatar: "",
        token: legacyToken,
        addedAt: Date.now(),
        lastActiveAt: Date.now(),
      },
    ],
    activeUserId: "pending",
  }
  writeRaw(data)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
  return data
}

function getStore() {
  return readRaw() || migrateLegacyToken() || { version: 1, sessions: [], activeUserId: null }
}

export function getSessions() {
  return getStore().sessions
}

export function getActiveSession() {
  const store = getStore()
  return store.sessions.find((s) => s.userId === store.activeUserId) || null
}

export function getActiveToken() {
  return getActiveSession()?.token || null
}

export function hasAnySession() {
  return getStore().sessions.length > 0
}

/**
 * True when no further *new* account can be added. Signing back into an account that is
 * already in the list is always allowed — it replaces a slot rather than taking one.
 */
export function isAtSessionLimit() {
  return getStore().sessions.length >= MAX_SESSIONS
}

/** @returns {Error & {code?: string}} */
function sessionLimitError() {
  const err = new Error(SESSION_LIMIT_MESSAGE)
  err.code = SESSION_LIMIT_ERROR_CODE
  return err
}

export function isSessionLimitError(err) {
  return err?.code === SESSION_LIMIT_ERROR_CODE
}

/**
 * Adds a new session or refreshes an existing one (matched by userId), then makes it
 * active. Used on login/signup/googleLogin and on re-authenticating an expired session.
 * @param {{user: {_id: string, email: string, name: string, avatar?: string}, token: string}} params
 * @throws when adding a brand-new account would exceed MAX_SESSIONS. Callers are expected
 *   to check isAtSessionLimit() first and never get here; this is the backstop that keeps
 *   an over-limit token out of storage (check with isSessionLimitError).
 */
export function upsertSession({ user, token }) {
  const store = getStore()
  const userId = user._id
  const existingIndex = store.sessions.findIndex((s) => s.userId === userId)
  const pendingIndex = store.sessions.findIndex((s) => s.userId === "pending")

  const snapshot = {
    userId,
    email: user.email || "",
    name: user.name || "",
    avatar: user.avatar || "",
    token,
    addedAt: Date.now(),
    lastActiveAt: Date.now(),
  }

  let sessions
  if (existingIndex !== -1) {
    sessions = store.sessions.map((s, i) =>
      i === existingIndex ? { ...snapshot, addedAt: s.addedAt } : s
    )
  } else if (pendingIndex !== -1) {
    sessions = store.sessions.map((s, i) => (i === pendingIndex ? snapshot : s))
  } else {
    if (store.sessions.length >= MAX_SESSIONS) throw sessionLimitError()
    sessions = [...store.sessions, snapshot]
  }

  const activeUserId = store.activeUserId === "pending" ? userId : (store.activeUserId ?? userId)
  writeRaw({ version: 1, sessions, activeUserId })
  return snapshot
}

/** Updates just the active session's token in place (no user snapshot change). */
export function updateActiveSessionToken(token) {
  const store = getStore()
  if (!store.activeUserId) return
  const sessions = store.sessions.map((s) =>
    s.userId === store.activeUserId ? { ...s, token } : s
  )
  writeRaw({ ...store, sessions })
}

/** Switches which already-added session is active. No-ops if userId isn't present. */
export function setActiveUserId(userId) {
  const store = getStore()
  if (!store.sessions.some((s) => s.userId === userId)) return
  const sessions = store.sessions.map((s) =>
    s.userId === userId ? { ...s, lastActiveAt: Date.now() } : s
  )
  writeRaw({ ...store, activeUserId: userId, sessions })
}

/** Removes a session. If it was active, the next remaining session (if any) becomes active. */
export function removeSession(userId) {
  const store = getStore()
  const sessions = store.sessions.filter((s) => s.userId !== userId)
  const activeUserId =
    store.activeUserId === userId ? (sessions[0]?.userId ?? null) : store.activeUserId
  writeRaw({ version: 1, sessions, activeUserId })
  return activeUserId
}

export function removeAllSessions() {
  writeRaw({ version: 1, sessions: [], activeUserId: null })
}
