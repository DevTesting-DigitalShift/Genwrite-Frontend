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

export const updateUserProfile = async (payload) => {
  const response = await axiosInstance.put("/user/profile", payload)
  return response.data
}
