import axiosInstance from "."

export const getProfile = async () => {
  const response = await axiosInstance.get("/user/profile")
  return response.data
}

export const markNotificationsAsRead = async () => {
  const response = await axiosInstance.patch("/user/notifications/read")
  return response.data
}

export const getTransactions = async () => {
  const response = await axiosInstance.get("/user/transactions")
  return response.data
}

export const updateUserProfile = async payload => {
  const response = await axiosInstance.put("/user/profile", payload)
  return response.data
}

export const updatePasswordAPI = async payload => {
  const response = await axiosInstance.post("/user/update-password", payload)
  return response.data
}

export const generateReferralCodeAPI = async () => {
  const response = await axiosInstance.post("/user/referral/generate")
  return response.data
}

export const getReferralStatsAPI = async () => {
  const response = await axiosInstance.get("/user/referral/stats")
  return response.data
}

export const getEmailPreferencesAPI = async () => {
  const response = await axiosInstance.get("/user/email-preferences")
  return response.data
}

export const updateEmailPreferencesAPI = async payload => {
  const response = await axiosInstance.put("/user/email-preferences", payload)
  return response.data
}
