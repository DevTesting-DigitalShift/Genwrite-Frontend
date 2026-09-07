/** Where the error occurred, used to pick a more specific fallback message. */
export type ErrorContext = "login" | "signup" | "google" | "pdfChat" | "campaign" | "general"

/** Loosely-typed error from a catch block — axios error, Error, or anything thrown. */
interface CaughtError {
  response?: { status?: number; data?: { message?: string; error?: string } }
  status?: number
  code?: string
  message?: string
}
/**
 * Maps axios errors or store errors to safe, user-friendly messages.
 * Never exposes raw backend strings, stack traces, or undefined values.
 *
 * @param err - Error object from catch block

 * @returns Safe, human-readable message
 */
export function getFriendlyError(err: unknown, context: ErrorContext = "general"): string {
  // Callers pass whatever landed in their catch block, so narrow here rather than
  // making every call site cast.
  const e = err as CaughtError | null | undefined
  const status = e?.response?.status ?? e?.status ?? null
  const backendMsg = e?.response?.data?.message ?? e?.response?.data?.error ?? ""

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
    /search console/i,
    /not connected/i,
    /no blogs?/i,
    /insufficient credits/i,
    /already (running|in progress)/i,
    /(start|end) date/i,
    /campaign (not found|already exists)/i,
    /no (data|metrics) (available|found)/i,
  ]

  const isSafeMessage = backendMsg && SAFE_PATTERNS.some((p) => p.test(backendMsg))

  if (isSafeMessage) {
    return backendMsg
  }

  // --- Status-code fallbacks ---
  if (status === 400) {
    if (context === "login") return "Incorrect email or password. Please try again."
    if (context === "signup") return "Please check your details and try again."
    if (context === "pdfChat")
      return "We couldn't read that PDF. It may be scanned, password-protected, or damaged - please try a different file."
    if (context === "campaign")
      return "This campaign isn't set up for that yet — check it has blogs assigned and Search Console connected."
    return "Something went wrong. Please check your input."
  }

  if (status === 402) {
    return "You don't have enough credits for this. Please top up and try again."
  }

  if (status === 401) {
    return "Your session has expired. Please log in again."
  }

  if (status === 403) {
    return "You don't have permission to do that."
  }

  if (status === 404) {
    if (context === "login") return "No account found with that email address."
    if (context === "pdfChat")
      return "Your document session has expired. Please upload the PDF again to keep chatting."
    if (context === "campaign")
      return "This campaign no longer exists. It may have been deleted in another tab."
    return "The requested resource was not found."
  }

  if (status === 409) {
    if (context === "campaign")
      return "That conflicts with the campaign's current state. Refresh the page and try again."
    if (context === "signup" || context === "login" || context === "google")
      return "An account with this email already exists. Please log in instead."
    return "That conflicts with the current state. Refresh the page and try again."
  }

  if (status === 413) {
    if (context === "pdfChat") return "That PDF is too large. Please upload a file under 2MB."
    return "That file is too large. Please try a smaller one."
  }

  if (status === 415) {
    if (context === "pdfChat") return "That file type isn't supported. Please upload a PDF."
    return "That file type isn't supported."
  }

  if (status === 422) {
    return "Please fill in all required fields correctly."
  }

  if (status === 429) {
    return "Too many attempts. Please wait a moment and try again."
  }

  if (status === 504) {
    if (context === "pdfChat")
      return "This document took too long to process. Try asking a shorter question, or use a smaller PDF."
    if (context === "campaign")
      return "This is taking longer than expected. It may still be running — refresh in a minute to check."
    return "The request took too long. Please try again."
  }

  if (status !== null && status >= 500) {
    return "We're experiencing technical difficulties. Please try again in a moment."
  }

  // --- Network / connection errors ---
  if (!status) {
    if (e?.code === "ERR_NETWORK" || e?.message?.toLowerCase().includes("network")) {
      return "Unable to connect. Please check your internet connection."
    }
    if (e?.code === "ECONNABORTED" || e?.message?.toLowerCase().includes("timeout")) {
      if (context === "pdfChat")
        return "This is taking longer than expected. Please try again, or ask a shorter question."
      if (context === "campaign")
        return "This is taking longer than expected. It may still be running — refresh in a minute to check."
      return "Request timed out. Please try again."
    }
  }

  // --- Last resort: generic message (never expose raw err.message) ---
  const contextMessages: Record<ErrorContext, string> = {
    login: "Unable to sign in. Please try again.",
    signup: "Unable to create account. Please try again.",
    google: "Google sign-in failed. Please try again.",
    pdfChat: "We couldn't get an answer for that. Please try asking again in a moment.",
    campaign: "That didn't go through. Please try again in a moment.",
    general: "Something went wrong. Please try again.",
  }

  return contextMessages[context] || contextMessages.general
}
