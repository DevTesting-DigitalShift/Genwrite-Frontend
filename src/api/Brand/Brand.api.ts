// src/api/brand/brand.api.ts
import axiosInstance from "@/api"
import type { Brand } from "@/types/brand"

export const BrandAPI = {
  list: async (): Promise<Brand[]> => {
    const res = await axiosInstance.get("/brand")
    return res.data
  },

  get: async (id: string): Promise<Brand> => {
    const res = await axiosInstance.get(`/brand/${id}`)
    return res.data
  },

  create: async (payload: Partial<Brand>): Promise<Brand> => {
    const res = await axiosInstance.post("/brand/addBrand", payload)
    return res.data
  },

  update: async (id: string, payload: Partial<Brand>): Promise<Brand> => {
    const res = await axiosInstance.put(`/brand/${id}`, payload)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/brand/${id}`)
  },

  getSiteInfo: async (url: string): Promise<any> => {
    const res = await axiosInstance.get("/brand/site-info", { params: { url } })
    return res.data
  },
}
