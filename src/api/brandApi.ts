import { apiDelete, apiGet, apiPost, apiPut, ApiRequestError } from "./typedClient"

const rethrow = (err: unknown, fallback: string): never => {
  if (err instanceof ApiRequestError) throw new Error(err.message || fallback)
  throw err instanceof Error ? err : new Error(fallback)
}

export const getBrands = async () => {
  try {
    const data = await apiGet("/api/v1/brand")
    return Array.isArray(data) ? data : data ? [data] : []
  } catch (err) {
    return rethrow(err, "Failed to fetch brands")
  }
}

export const createBrandVoice = async (payload: unknown) => {
  try {
    return await apiPost("/api/v1/brand/addBrand", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to create brand voice")
  }
}

export const updateBrandVoice = async (id: string, payload: unknown) => {
  try {
    return await apiPut("/api/v1/brand/{id}", payload as never, { params: { id } })
  } catch (err) {
    return rethrow(err, "Failed to update brand voice")
  }
}

export const deleteBrandVoice = async (id: string) => {
  try {
    return await apiDelete("/api/v1/brand/{id}", { params: { id } })
  } catch (err) {
    return rethrow(err, "Failed to delete brand voice")
  }
}

export const getSiteInfo = async (url: string) => {
  try {
    return await apiGet("/api/v1/brand/site-info", { query: { url } as never })
  } catch (err) {
    return rethrow(err, "Failed to fetch site info")
  }
}
