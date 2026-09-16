// src/api/Integration/Integration.api.ts
import { apiGet, apiPost, apiPut, rethrow } from "@api/typedClient"
import type { ApiRequestBody } from "@/types/apiHelpers"

export const IntegrationAPI = {
  list: async () => {
    try {
      return await apiGet("/integrations")
    } catch (err) {
      return rethrow(err, "Failed to fetch integrations")
    }
  },

  getCategories: async (type: string) => {
    try {
      return await apiGet("/integrations/category", { query: { type } as never })
    } catch (err) {
      return rethrow(err, "Failed to fetch categories")
    }
  },

  ping: async (type: string) => {
    try {
      return await apiGet("/integrations/ping", { query: { type } as never })
    } catch (err) {
      return rethrow(err, "Failed to ping integration")
    }
  },

  create: async (payload: ApiRequestBody<"/integrations", "post">) => {
    try {
      return await apiPost("/integrations", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to create integration")
    }
  },

  createPost: async (payload: ApiRequestBody<"/integrations/post", "post">) => {
    try {
      return await apiPost("/integrations/post", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to create post")
    }
  },

  update: async (payload: ApiRequestBody<"/integrations/post", "put">) => {
    try {
      return await apiPut("/integrations/post", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to update integration")
    }
  },

  connect: async (payload: ApiRequestBody<"/integrations/connect", "post">) => {
    try {
      return await apiPost("/integrations/connect", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to connect integration")
    }
  },
}
