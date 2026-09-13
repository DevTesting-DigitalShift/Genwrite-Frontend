// src/api/User/User.api.ts
import { apiGet, apiPatch, apiPost, apiPut, rethrow } from "@api/typedClient"

export const UserAPI = {
  getProfile: async () => {
    try {
      const result = await apiGet("/user/profile")
      return result.data
    } catch (err) {
      return rethrow(err, "Failed to fetch profile")
    }
  },

  markNotificationsAsRead: async () => {
    try {
      return await apiPatch("/user/notifications/read")
    } catch (err) {
      return rethrow(err, "Failed to mark notifications as read")
    }
  },

  getTransactions: async () => {
    try {
      return await apiGet("/user/transactions")
    } catch (err) {
      return rethrow(err, "Failed to fetch transactions")
    }
  },

  updateProfile: async (payload: unknown) => {
    try {
      return await apiPut("/user/profile", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to update profile")
    }
  },

  updatePassword: async (payload: unknown) => {
    try {
      return await apiPost("/user/update-password", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to update password")
    }
  },

  generateReferralCode: async () => {
    try {
      return await apiPost("/user/referral/generate")
    } catch (err) {
      return rethrow(err, "Failed to generate referral code")
    }
  },

  getReferralStats: async () => {
    try {
      return await apiGet("/user/referral/stats")
    } catch (err) {
      return rethrow(err, "Failed to fetch referral stats")
    }
  },

  getEmailPreferences: async () => {
    try {
      return await apiGet("/user/email-preferences")
    } catch (err) {
      return rethrow(err, "Failed to fetch email preferences")
    }
  },

  updateEmailPreferences: async (payload: unknown) => {
    try {
      return await apiPut("/user/email-preferences", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to update email preferences")
    }
  },

  getSubscriptionStatus: async () => {
    try {
      return await apiGet("/user/sub-status")
    } catch (err) {
      return rethrow(err, "Failed to fetch subscription status")
    }
  },
}
