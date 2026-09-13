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
}

export const authQuery = new AuthQuery() as AuthQuery
