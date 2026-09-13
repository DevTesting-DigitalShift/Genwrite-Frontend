// src/api/Brand/Brand.api.ts
import { apiDelete, apiGet, apiPost, apiPut, rethrow } from "@api/typedClient"
import type { Brand, BrandSiteInfo } from "@/types/brand"

export const BrandAPI = {
  list: async (): Promise<Brand[]> => {
    try {
      const data = await apiGet("/brand")
      return (Array.isArray(data) ? data : data ? [data] : []) as Brand[]
    } catch (err) {
      return rethrow(err, "Failed to fetch brands")
    }
  },

  get: async (id: string): Promise<Brand> => {
    try {
      return (await apiGet("/brand/{id}", { params: { id } })) as Brand
    } catch (err) {
      return rethrow(err, "Failed to fetch brand")
    }
  },

  create: async (payload: Partial<Brand>): Promise<Brand> => {
    try {
      return (await apiPost("/brand/addBrand", payload as never)) as Brand
    } catch (err) {
      return rethrow(err, "Failed to create brand voice")
    }
  },

  update: async (id: string, payload: Partial<Brand>): Promise<Brand> => {
    try {
      return (await apiPut("/brand/{id}", payload as never, { params: { id } })) as Brand
    } catch (err) {
      return rethrow(err, "Failed to update brand voice")
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiDelete("/brand/{id}", { params: { id } })
    } catch (err) {
      return rethrow(err, "Failed to delete brand voice")
    }
  },

  getSiteInfo: async (url: string): Promise<BrandSiteInfo> => {
    try {
      return (await apiGet("/brand/site-info", {
        query: { url } as never,
      })) as unknown as BrandSiteInfo
    } catch (err) {
      return rethrow(err, "Failed to fetch site info")
    }
  },
}
