// Central multi-account session storage. Plain module (no React/Zustand import) so it
// can be used from axios interceptors, socket.js, and Zustand stores alike without
// import cycles.
//
// Storage is split deliberately across two scopes:
//
//   localStorage["gw_sessions"]      the shared *pool* of logged-in accounts, in the
//                                    order they were added. Shared so that adding an
//                                    account in one tab makes it available to switch
//                                    into from any other. A brand-new tab defaults to
//                                    sessions[0] — the first account still logged into
//                                    this browser — falling through in add-order if that
//                                    one signs out.
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
 * How many accounts may be signed in on one browser at once. This is a blast-radius
 * limit as much as a UI one — and the account dropdown stops being scannable well
 * before it.
 */
export const MAX_SESSIONS = 5

export const SESSION_LIMIT_ERROR_CODE = "SESSION_LIMIT_REACHED"

export const SESSION_LIMIT_MESSAGE = `You can be signed into at most ${MAX_SESSIONS} accounts on this browser. Sign out of one before adding another.`

/** One signed-in account held in the shared pool. No token — the access token now lives
 * only in memory (@utils/accessTokenStore), never persisted. */
export interface Session {
  userId: string
  email: string
  name: string
  avatar: string
  addedAt: number
  lastActiveAt: number
}

/** The v2 shape persisted under localStorage["gw_sessions"]. */
interface SessionStoreData {
  version: 2
  sessions: Session[]
}

/** Minimal user shape upsertSession needs from the auth response. */
export interface SessionUser {
  _id: string
  email?: string
  name?: string
  avatar?: string
}

export interface SessionLimitError extends Error {
  code?: string
}

function readRaw(): SessionStoreData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.sessions)) return null

    // v1 kept a single browser-wide `activeUserId` here; per-tab selection now lives in
    // sessionStorage and the default for a fresh tab is simply sessions[0].
    if (parsed.version === 1) {
      const upgraded: SessionStoreData = { version: 2, sessions: parsed.sessions }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded))
      return upgraded
    }
    if (parsed.version !== 2) return null
    return parsed
  } catch {
    return null
  }
}

function writeRaw(data: SessionStoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent(SESSIONS_CHANGED_EVENT))
}

/** This tab's active account id, or null if the tab hasn't pinned one yet. */
function readTabActiveUserId(): string | null {
  try {
    return sessionStorage.getItem(ACTIVE_USER_KEY)
  } catch {
    return null
  }
}

function writeTabActiveUserId(userId: string | null): void {
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
function detachTab(): void {
  try {
    sessionStorage.setItem(ACTIVE_USER_KEY, TAB_DETACHED)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(SESSIONS_CHANGED_EVENT))
}

// One-time cleanup of the pre-multi-account single localStorage token key. There's no
// way to turn an old-format token into a valid new-format session (no refresh cookie
// exists for it), so this just clears the stale key — the user will need to log in
// again.
function migrateLegacyToken(): null {
  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY)
  if (!legacyToken) return null
  localStorage.removeItem(LEGACY_TOKEN_KEY)
  return null
}

function getStore(): SessionStoreData {
  return readRaw() || migrateLegacyToken() || { version: 2, sessions: [] }
}

/**
 * Resolves which account this tab is acting as, pinning the choice on first use.
 *
 * A fresh tab has no pinned account, so it opens on sessions[0] — the first account
 * still logged into this browser, in the order accounts were added. The moment it
 * resolves, it is written to sessionStorage — that pin is what stops the tab from
 * drifting to a different account later when another tab switches or a new one logs in.
 */
function resolveActiveUserId(store: SessionStoreData): string | null {
  const isValid = (id: string | null | undefined): boolean => !!id && store.sessions.some((s) => s.userId === id)

  const pinned = readTabActiveUserId()
  if (isValid(pinned)) return pinned
  // Signed out here on purpose — stay signed out rather than adopting another account.
  if (pinned === TAB_DETACHED) return null

  const fallback = store.sessions[0]?.userId ?? null

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
export function getActiveUserId(): string | null {
  return resolveActiveUserId(getStore())
}

export function getSessions(): Session[] {
  return getStore().sessions
}

export function getActiveSession(): Session | null {
  const store = getStore()
  const activeUserId = resolveActiveUserId(store)
  return store.sessions.find((s) => s.userId === activeUserId) || null
}

export function hasAnySession(): boolean {
  return getStore().sessions.length > 0
}

/**
 * True when no further *new* account can be added. Signing back into an account that is
 * already in the list is always allowed — it replaces a slot rather than taking one.
 */
export function isAtSessionLimit(): boolean {
  return getStore().sessions.length >= MAX_SESSIONS
}

function sessionLimitError(): SessionLimitError {
  const err: SessionLimitError = new Error(SESSION_LIMIT_MESSAGE)
  err.code = SESSION_LIMIT_ERROR_CODE
  return err
}

export function isSessionLimitError(err: unknown): boolean {
  return (err as SessionLimitError | null)?.code === SESSION_LIMIT_ERROR_CODE
}

/**
 * Adds a new session or refreshes an existing one (matched by userId), then makes it
 * active. Used on login/signup/googleLogin and on re-authenticating an expired session.
 * @throws when adding a brand-new account would exceed MAX_SESSIONS. Callers are expected
 *   to check isAtSessionLimit() first and never get here; this is the backstop that keeps
 *   an over-limit account out of storage (check with isSessionLimitError).
 */
export function upsertSession({ user }: { user: SessionUser }): Session {
  const store = getStore()
  const userId = user._id
  const existingIndex = store.sessions.findIndex((s) => s.userId === userId)
  const pendingIndex = store.sessions.findIndex((s) => s.userId === "pending")

  const snapshot: Session = {
    userId,
    email: user.email || "",
    name: user.name || "",
    avatar: user.avatar || "",
    addedAt: Date.now(),
    lastActiveAt: Date.now(),
  }

  let sessions: Session[]
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

  writeRaw({ version: 2, sessions })
  if (claimTab) writeTabActiveUserId(userId)

  return snapshot
}

/**
 * Switches which account THIS TAB acts as. No-ops if userId isn't in the pool.
 * Other tabs are unaffected — they keep their own pinned account.
 */
export function setActiveUserId(userId: string): void {
  const store = getStore()
  if (!store.sessions.some((s) => s.userId === userId)) return
  const sessions = store.sessions.map((s) =>
    s.userId === userId ? { ...s, lastActiveAt: Date.now() } : s
  )
  writeRaw({ ...store, sessions })
  writeTabActiveUserId(userId)
}

/**
 * Removes a session from the shared pool. If it was the account THIS tab was acting as,
 * what the tab does next depends on `adoptNext`:
 *
 *   adoptNext: true  (deliberate sign-out) — fall through to the next remaining account
 *                    rather than bouncing the user to /login for no reason.
 *   adoptNext: false (session expired / auth failure) — detach the tab instead. The user
 *                    is shown SessionExpiredModal and picks; silently adopting whichever
 *                    other account happened to be in the list would leave them acting as
 *                    someone else without ever being told.
 *
 * @returns this tab's account id afterwards, or null if none/detached
 */
export function removeSession(
  userId: string,
  { adoptNext = true }: { adoptNext?: boolean } = {}
): string | null {
  const store = getStore()
  const wasActiveHere = resolveActiveUserId(store) === userId
  const sessions = store.sessions.filter((s) => s.userId !== userId)

  let nextForThisTab: string | null
  if (!wasActiveHere) {
    nextForThisTab = resolveActiveUserId(store)
  } else if (adoptNext) {
    nextForThisTab = sessions[0]?.userId ?? null
  } else {
    nextForThisTab = null
  }

  writeRaw({ version: 2, sessions })

  if (wasActiveHere) {
    if (nextForThisTab) writeTabActiveUserId(nextForThisTab)
    else detachTab()
  }

  return nextForThisTab
}

export function removeAllSessions(): void {
  writeRaw({ version: 2, sessions: [] })
  writeTabActiveUserId(null)
}
