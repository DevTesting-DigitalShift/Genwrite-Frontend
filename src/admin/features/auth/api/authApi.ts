import type { AdminLoginResponse, AdminRefreshResponse } from "@admin/types/admin"
import adminAxiosInstance from "@admin/auth/adminAxiosInstance"

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  const response = await adminAxiosInstance.post<AdminLoginResponse>(
    "/admin/auth/login",
    { email, password },
    { withCredentials: true }
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

/** Emails a short-lived link that upgrades the *current* session to read+write. */
export async function requestWriteAccess(): Promise<{ message: string }> {
  const response = await adminAxiosInstance.post<{ message: string }>(
    "/admin/auth/write-access/request"
  )
  return response.data
}

/** Consumes the emailed elevation link (must be called from the same session that requested it). */
export async function consumeWriteAccess(token: string): Promise<{ message: string }> {
  const response = await adminAxiosInstance.post<{ message: string }>(
    "/admin/auth/write-access/consume",
    { token }
  )
  return response.data
}
