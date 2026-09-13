import { apiGet, apiPatch, apiPost, apiPut, rethrow } from "./typedClient"

export const getProfile = async () => {
  try {
    const result = await apiGet("/user/profile")
    return result.data
  } catch (err) {
    return rethrow(err, "Failed to fetch profile")
  }
}

export const markNotificationsAsRead = async () => {
  try {
    return await apiPatch("/user/notifications/read")
  } catch (err) {
    return rethrow(err, "Failed to mark notifications as read")
  }
}

export const getTransactions = async () => {
  try {
    return await apiGet("/user/transactions")
  } catch (err) {
    return rethrow(err, "Failed to fetch transactions")
  }
}

export const updateUserProfile = async (payload: unknown) => {
  try {
    return await apiPut("/user/profile", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to update profile")
  }
}

export const updatePasswordAPI = async (payload: unknown) => {
  try {
    return await apiPost("/user/update-password", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to update password")
  }
}

export const generateReferralCodeAPI = async () => {
  try {
    return await apiPost("/user/referral/generate")
  } catch (err) {
    return rethrow(err, "Failed to generate referral code")
  }
}

export const getReferralStatsAPI = async () => {
  try {
    return await apiGet("/user/referral/stats")
  } catch (err) {
    return rethrow(err, "Failed to fetch referral stats")
  }
}

export const getEmailPreferencesAPI = async () => {
  try {
    return await apiGet("/user/email-preferences")
  } catch (err) {
    return rethrow(err, "Failed to fetch email preferences")
  }
}

export const updateEmailPreferencesAPI = async (payload: unknown) => {
  try {
    return await apiPut("/user/email-preferences", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to update email preferences")
  }
}

export const getSubscriptionStatusAPI = async () => {
  try {
    return await apiGet("/user/sub-status")
  } catch (err) {
    return rethrow(err, "Failed to fetch subscription status")
  }
}
