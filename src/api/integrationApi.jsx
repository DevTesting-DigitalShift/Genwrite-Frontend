import axiosInstance from "."

export const getIntegrationById = async id => {
  const response = await axiosInstance.get(`/integrations/`)
  return response.data
}

export const getCategories = async () => {
  const response = await axiosInstance.get("/integrations/categories")
  return response.data
}

export const createIntegration = async payload => {
  const response = await axiosInstance.post("/integrations/post", payload)
  return response.data
}

export const updateIntegration = async payload => {
  const response = await axiosInstance.put("/integrations/post", payload)
  return response.data
}
