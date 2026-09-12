import { apiGet, apiPost, apiPut, ApiRequestError } from "./typedClient"

const rethrow = (err: unknown, fallback: string): never => {
  if (err instanceof ApiRequestError) throw new Error(err.message || fallback)
  throw err instanceof Error ? err : new Error(fallback)
}

export const fetchCategories = async (type: string) => {
  try {
    return await apiGet("/api/v1/integrations/category", { query: { type } as never })
  } catch (err) {
    return rethrow(err, "Failed to fetch categories")
  }
}

export const fetchIntegrations = async () => {
  try {
    return await apiGet("/api/v1/integrations")
  } catch (err) {
    return rethrow(err, "Failed to fetch integrations")
  }
}

export const pingIntegration = async (type: string) => {
  try {
    return await apiGet("/api/v1/integrations/ping", { query: { type } as never })
  } catch (err) {
    return rethrow(err, "Failed to ping integration")
  }
}

export const createIntegration = async (payload: unknown) => {
  try {
    return await apiPost("/api/v1/integrations", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to create integration")
  }
}

export const createPost = async (payload: unknown) => {
  try {
    return await apiPost("/api/v1/integrations/post", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to create post")
  }
}

export const updateIntegration = async (payload: unknown) => {
  try {
    return await apiPut("/api/v1/integrations/post", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to update integration")
  }
}

export const connectIntegration = async (payload: unknown) => {
  try {
    return await apiPost("/api/v1/integrations/connect", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to connect integration")
  }
}
