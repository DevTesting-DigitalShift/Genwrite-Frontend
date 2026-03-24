/**
 * Maps axios errors or store errors to safe, user-friendly messages.
 * Never exposes raw backend strings, stack traces, or undefined values.
 *
 * @param {any} err - Error object from catch block
 * @param {'login'|'signup'|'google'|'general'} context - Where the error occurred
 * @returns {string} - Safe, human-readable message
 */
export function getFriendlyError(err, context = "general") {
  const status = err?.response?.status ?? err?.status ?? null
  const backendMsg = err?.response?.data?.message ?? err?.response?.data?.error ?? ""

  // --- SAFE backend messages: authentication-related, always user-understandable ---
  const SAFE_PATTERNS = [
    /invalid (email|password|credentials)/i,
    /email already (exists|registered|taken)/i,
    /user (not found|does not exist)/i,
    /account (not found|disabled|suspended)/i,
    /incorrect password/i,
    /wrong password/i,
    /email not verified/i,
    /captcha (failed|invalid|required)/i,
    /too many (attempts|requests)/i,
    /rate limit/i,
    /password (too short|too weak|must contain)/i,
    /name (is required|too short)/i,
  ]

  const isSafeMessage = backendMsg && SAFE_PATTERNS.some(p => p.test(backendMsg))

  if (isSafeMessage) {
    return backendMsg
  }

  // --- Status-code fallbacks ---
  if (status === 400) {
    if (context === "login") return "Incorrect email or password. Please try again."
    if (context === "signup") return "Please check your details and try again."
    return "Something went wrong. Please check your input."
  }

  if (status === 401) {
    return "Your session has expired. Please log in again."
  }

  if (status === 403) {
    return "You don't have permission to do that."
  }

  if (status === 404) {
    if (context === "login") return "No account found with that email address."
    return "The requested resource was not found."
  }

  if (status === 409) {
    return "An account with this email already exists. Please log in instead."
  }

  if (status === 422) {
    return "Please fill in all required fields correctly."
  }

  if (status === 429) {
    return "Too many attempts. Please wait a moment and try again."
  }

  if (status >= 500) {
    return "We're experiencing technical difficulties. Please try again in a moment."
  }

  // --- Network / connection errors ---
  if (!status) {
    if (err?.code === "ERR_NETWORK" || err?.message?.toLowerCase().includes("network")) {
      return "Unable to connect. Please check your internet connection."
    }
    if (err?.code === "ECONNABORTED" || err?.message?.toLowerCase().includes("timeout")) {
      return "Request timed out. Please try again."
    }
  }

  // --- Last resort: generic message (never expose raw err.message) ---
  const contextMessages = {
    login: "Unable to sign in. Please try again.",
    signup: "Unable to create account. Please try again.",
    google: "Google sign-in failed. Please try again.",
    general: "Something went wrong. Please try again.",
  }

  return contextMessages[context] || contextMessages.general
}
