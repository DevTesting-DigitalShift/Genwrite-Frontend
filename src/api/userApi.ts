import { apiGet, apiPatch, apiPost, apiPut, ApiRequestError } from "./typedClient"

const rethrow = (err: unknown, fallback: string): never => {
  if (err instanceof ApiRequestError) throw new Error(err.message || fallback)
  throw err instanceof Error ? err : new Error(fallback)
}

export const getProfile = async () => {
  try {
    const result = await apiGet("/api/v1/user/profile")
    return result.data
  } catch (err) {
    return rethrow(err, "Failed to fetch profile")
  }
}

export const markNotificationsAsRead = async () => {
  try {
    return await apiPatch("/api/v1/user/notifications/read")
  } catch (err) {
    return rethrow(err, "Failed to mark notifications as read")
  }
}

export const getTransactions = async () => {
  try {
    return await apiGet("/api/v1/user/transactions")
  } catch (err) {
    return rethrow(err, "Failed to fetch transactions")
  }
}

export const updateUserProfile = async (payload: unknown) => {
  try {
    return await apiPut("/api/v1/user/profile", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to update profile")
  }
}

export const updatePasswordAPI = async (payload: unknown) => {
  try {
    return await apiPost("/api/v1/user/update-password", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to update password")
  }
}

export const generateReferralCodeAPI = async () => {
  try {
    return await apiPost("/api/v1/user/referral/generate")
  } catch (err) {
    return rethrow(err, "Failed to generate referral code")
  }
}

export const getReferralStatsAPI = async () => {
  try {
    return await apiGet("/api/v1/user/referral/stats")
  } catch (err) {
    return rethrow(err, "Failed to fetch referral stats")
  }
}

export const getEmailPreferencesAPI = async () => {
  try {
    return await apiGet("/api/v1/user/email-preferences")
  } catch (err) {
    return rethrow(err, "Failed to fetch email preferences")
  }
}

export const updateEmailPreferencesAPI = async (payload: unknown) => {
  try {
    return await apiPut("/api/v1/user/email-preferences", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to update email preferences")
  }
}

export const getSubscriptionStatusAPI = async () => {
  try {
    return await apiGet("/api/v1/user/sub-status")
  } catch (err) {
    return rethrow(err, "Failed to fetch subscription status")
  }
}
