// Central multi-account session storage. Plain module (no React/Zustand import) so it
// can be used from axios interceptors, socket.js, and Zustand stores alike without
// import cycles.
//
// Storage is split deliberately across two scopes:
//
//   localStorage["gw_sessions"]      the shared *pool* of logged-in accounts and their
//                                    tokens, plus `lastActiveUserId` used only as the
//                                    opening default for a brand-new tab. Shared so that
//                                    adding an account in one tab makes it available to
//                                    switch into from any other.
//
//   sessionStorage["gw_active_user"] which account THIS TAB is acting as. sessionStorage
//                                    is per-tab and survives reloads, which is what lets
//                                    several tabs each run a different account at the
//                                    same time. Nothing another tab does may change it.
//
// The consequence to preserve when editing this file: writes to the shared pool must
// never implicitly repoint a tab's active account. A tab changes accounts only when that
// tab itself calls setActiveUserId, or when its own account disappears from the pool.

const STORAGE_KEY = "gw_sessions"
const ACTIVE_USER_KEY = "gw_active_user"
// Sentinel distinguishing "this tab signed out" from "this tab is brand new".
const TAB_DETACHED = "__detached__"
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
    if (!Array.isArray(parsed?.sessions)) return null

    // v1 kept a single browser-wide `activeUserId` here. Carry it over as this browser's
    // default starting account; per-tab selection now lives in sessionStorage.
    if (parsed.version === 1) {
      const upgraded = {
        version: 2,
        sessions: parsed.sessions,
        lastActiveUserId: parsed.activeUserId ?? null,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded))
      return upgraded
    }
    if (parsed.version !== 2) return null
    return parsed
  } catch {
    return null
  }
}

function writeRaw(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent(SESSIONS_CHANGED_EVENT))
}

/** This tab's active account id, or null if the tab hasn't pinned one yet. */
function readTabActiveUserId() {
  try {
    return sessionStorage.getItem(ACTIVE_USER_KEY)
  } catch {
    return null
  }
}

function writeTabActiveUserId(userId) {
  try {
    if (userId) sessionStorage.setItem(ACTIVE_USER_KEY, userId)
    else sessionStorage.removeItem(ACTIVE_USER_KEY)
  } catch {
    /* private-mode sessionStorage can throw; the tab just falls back to the default */
  }
  window.dispatchEvent(new CustomEvent(SESSIONS_CHANGED_EVENT))
}

/**
 * Marks this tab as deliberately signed out, as opposed to merely never having chosen an
 * account. Both look like "no pin", but only the latter should quietly adopt the
 * browser's default account — a tab whose own session just expired must NOT silently
 * start acting as some other logged-in account behind the session-expired modal.
 */
function detachTab() {
  try {
    sessionStorage.setItem(ACTIVE_USER_KEY, TAB_DETACHED)
  } catch {
    /* ignore */
  }
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
    version: 2,
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
    lastActiveUserId: "pending",
  }
  writeRaw(data)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
  return data
}

function getStore() {
  return readRaw() || migrateLegacyToken() || { version: 2, sessions: [], lastActiveUserId: null }
}

/**
 * Resolves which account this tab is acting as, pinning the choice on first use.
 *
 * A fresh tab has no pinned account, so it opens on the browser's last-used one. The
 * moment it resolves, it is written to sessionStorage — that pin is what stops the tab
 * from drifting to a different account later when another tab switches.
 */
function resolveActiveUserId(store) {
  const isValid = (id) => !!id && store.sessions.some((s) => s.userId === id)

  const pinned = readTabActiveUserId()
  if (isValid(pinned)) return pinned
  // Signed out here on purpose — stay signed out rather than adopting another account.
  if (pinned === TAB_DETACHED) return null

  const fallback = isValid(store.lastActiveUserId)
    ? store.lastActiveUserId
    : (store.sessions[0]?.userId ?? null)

  // Pin it without re-broadcasting; this is resolution, not a user-initiated switch.
  if (fallback) {
    try {
      sessionStorage.setItem(ACTIVE_USER_KEY, fallback)
    } catch {
      /* ignore */
    }
  }
  return fallback
}

/** The account id this tab is acting as. */
export function getActiveUserId() {
  return resolveActiveUserId(getStore())
}

export function getSessions() {
  return getStore().sessions
}

export function getActiveSession() {
  const store = getStore()
  const activeUserId = resolveActiveUserId(store)
  return store.sessions.find((s) => s.userId === activeUserId) || null
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

  // Whether THIS tab should start acting as the account just authenticated. It should
  // when the tab isn't acting as anybody yet, when it still points at the legacy
  // "pending" placeholder, or when the account it pointed at is gone (re-login after an
  // expiry). It should NOT when the tab is happily running another account — that's the
  // add-account flow, where switchToAccount decides when to repoint.
  const pinned = readTabActiveUserId()
  const pinnedStillExists = !!pinned && pinned !== "pending" && sessions.some((s) => s.userId === pinned)
  const claimTab = !pinnedStillExists

  writeRaw({
    version: 2,
    sessions,
    lastActiveUserId: claimTab ? userId : (store.lastActiveUserId ?? userId),
  })
  if (claimTab) writeTabActiveUserId(userId)

  return snapshot
}

/** Updates this tab's active session's token in place (no user snapshot change). */
export function updateActiveSessionToken(token) {
  const store = getStore()
  const activeUserId = resolveActiveUserId(store)
  if (!activeUserId) return
  const sessions = store.sessions.map((s) => (s.userId === activeUserId ? { ...s, token } : s))
  writeRaw({ ...store, sessions })
}

/**
 * Switches which account THIS TAB acts as. No-ops if userId isn't in the pool.
 * Other tabs are unaffected — they keep their own pinned account.
 */
export function setActiveUserId(userId) {
  const store = getStore()
  if (!store.sessions.some((s) => s.userId === userId)) return
  const sessions = store.sessions.map((s) =>
    s.userId === userId ? { ...s, lastActiveAt: Date.now() } : s
  )
  // lastActiveUserId only seeds future new tabs; it never repoints existing ones.
  writeRaw({ ...store, lastActiveUserId: userId, sessions })
  writeTabActiveUserId(userId)
}

/**
 * Removes a session from the shared pool. If it was the account THIS tab was acting as,
 * the tab falls to the next remaining session (if any).
 * @returns {string | null} this tab's account id afterwards, or null if none remain
 */
export function removeSession(userId) {
  const store = getStore()
  const wasActiveHere = resolveActiveUserId(store) === userId
  const sessions = store.sessions.filter((s) => s.userId !== userId)

  const nextForThisTab = wasActiveHere ? (sessions[0]?.userId ?? null) : resolveActiveUserId(store)

  writeRaw({
    version: 2,
    sessions,
    lastActiveUserId: store.lastActiveUserId === userId ? nextForThisTab : store.lastActiveUserId,
  })
  if (wasActiveHere) writeTabActiveUserId(nextForThisTab)

  return nextForThisTab
}

export function removeAllSessions() {
  writeRaw({ version: 2, sessions: [], lastActiveUserId: null })
  writeTabActiveUserId(null)
}
