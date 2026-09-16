// src/api/Auth/Auth.query.ts
import { QueryBase } from "@api/QueryBase"
import { AuthAPI } from "./Auth.api"
import type { components } from "@/types/apiSchema"

type VerifyEmailResponse = components["schemas"]["VerifyEmailResponse"]

class AuthQuery extends QueryBase<unknown> {
  baseKey = ["auth"]
  api = AuthAPI

  // Both endpoints are auth-gated — the backend reads the target account off the bearer
  // token, never off a client-supplied email, so no email needs to be sent here.

  useVerifyEmail = () =>
    this.useMutate<VerifyEmailResponse, { code: string }>(({ code }) => this.api.verifyEmail(code))

  useResendVerification = () => this.useMutate<string, void>(() => this.api.resendVerification())

  // Plain passthroughs for useAuthStore's imperative session-management actions
  // (login/logout/token-refresh dedup, sessionStore bookkeeping) — not shaped as
  // declarative component-level hooks.
  login = (payload: Parameters<typeof AuthAPI.login>[0]) => this.api.login(payload)

  signup = (payload: Parameters<typeof AuthAPI.signup>[0]) => this.api.signup(payload)

  logout = () => this.api.logout()

  loadUser = (navigate?: (path: string) => void) => this.api.loadUser(navigate)

  forgotPassword = (email: string) => this.api.forgotPassword(email)

  resetPassword = (payload: Parameters<typeof AuthAPI.resetPassword>[0]) =>
    this.api.resetPassword(payload)

  loginWithGoogle = (payload: Parameters<typeof AuthAPI.loginWithGoogle>[0]) =>
    this.api.loginWithGoogle(payload)

  refreshSession = (userId: string) => this.api.refreshSession(userId)
}

export const authQuery = new AuthQuery() as AuthQuery
