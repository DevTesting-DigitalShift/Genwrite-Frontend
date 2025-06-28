import axiosInstance from "."

export const getVerifiedSites = async () => {
  const response = await axiosInstance.get("/gsc/sites")
  return response.data.sites
}

export const getGscAnalytics = async (params) => {
  const response = await axiosInstance.get("/gsc/sites-data", { params })
  return response.data.data.rows
}

export const connectGsc = async (code) => {
  const response = await axiosInstance.get("/gsc/callback", {
    params: { code },
  })
  return response.data
}
