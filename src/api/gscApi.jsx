import axiosInstance from "."

export const getVerifiedSites = async () => {
  try {
    const response = await axiosInstance.get("/gsc/data")
    return response.data || []
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch verified sites")
  }
}

export const getGscAnalytics = async (params) => {
  try {
    const response = await axiosInstance.get("/gsc/data", { params })
    return response.data // Backend returns array of objects directly
  } catch (error) {
    throw new Error(error.response?.data?.error)
  }
}

export const connectGsc = async ({ code, state }) => {
  try {
    const response = await axiosInstance.get("/gsc/callback", {
      params: { code, state },
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to connect GSC")
  }
}

export const getGscAuthUrl = async () => {
  try {
    const response = await axiosInstance.get("/gsc/auth")
    return response.data.url
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to get auth URL")
  }
}