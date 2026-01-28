import axiosInstance from "."

export const getBrands = async () => {
  const res = await axiosInstance.get("/brand")
  const data = res.data
  return Array.isArray(data) ? data : data ? [data] : []
}

export const createBrandVoice = async (payload) => {
  const res = await axiosInstance.post("/brand/addBrand", payload)
  return res.data
}

export const updateBrandVoice = async (id, payload) => {
  const res = await axiosInstance.put(`/brand/${id}`, payload)
  return res.data
}

export const deleteBrandVoice = async (id) => {
  const res = await axiosInstance.delete(`/brand/${id}`)
  return res.data
}

export const getSiteInfo = async (url) => {
  const res = await axiosInstance.get("/brand/site-info", {
    params: { url },
  })
  return res.data
}
