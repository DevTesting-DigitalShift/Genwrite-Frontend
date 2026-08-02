import type {
  Admin2FAVerifyResponse,
  AdminLoginResponse,
  AdminMFAEnableResponse,
  AdminMFASetupResponse,
  AdminRefreshResponse,
} from "@admin/types/admin"
import adminAxiosInstance from "@admin/auth/adminAxiosInstance"

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  const response = await adminAxiosInstance.post<AdminLoginResponse>(
    "/admin/auth/login",
    { email, password },
    { withCredentials: true }
  )
  return response.data
}

export async function adminVerify2FA(
  tempToken: string,
  otp: string
): Promise<Admin2FAVerifyResponse> {
  const response = await adminAxiosInstance.post<Admin2FAVerifyResponse>(
    "/admin/auth/verify-2fa",
    { tempToken, otp },
    { withCredentials: true }
  )
  return response.data
}

export async function adminSetupMFA(tempToken: string): Promise<AdminMFASetupResponse> {
  const response = await adminAxiosInstance.get<AdminMFASetupResponse>("/admin/auth/mfa/setup", {
    headers: { Authorization: `Bearer ${tempToken}` },
  })
  return response.data
}

export async function adminEnableMFA(
  tempToken: string,
  secret: string,
  otp: string
): Promise<AdminMFAEnableResponse> {
  const response = await adminAxiosInstance.post<AdminMFAEnableResponse>(
    "/admin/auth/mfa/enable",
    { secret, otp },
    { headers: { Authorization: `Bearer ${tempToken}` } }
  )
  return response.data
}

export async function adminRefreshToken(): Promise<AdminRefreshResponse> {
  const response = await adminAxiosInstance.post<AdminRefreshResponse>(
    "/admin/auth/refresh",
    {},
    { withCredentials: true }
  )
  return response.data
}

export async function adminRequestMfaReset(email: string): Promise<{ message: string }> {
  const response = await adminAxiosInstance.post<{ message: string }>(
    "/admin/auth/mfa/reset-request",
    { email }
  )
  return response.data
}

export async function adminVerifyMfaResetCode(
  email: string,
  code: string
): Promise<{ message: string; resetToken: string }> {
  const response = await adminAxiosInstance.post<{ message: string; resetToken: string }>(
    "/admin/auth/mfa/reset-verify",
    { email, code }
  )
  return response.data
}

export async function adminCompleteMfaReset(
  resetToken: string,
  secret: string,
  otp: string
): Promise<{ message: string }> {
  const response = await adminAxiosInstance.post<{ message: string }>(
    "/admin/auth/mfa/reset-complete",
    { resetToken, secret, otp }
  )
  return response.data
}
