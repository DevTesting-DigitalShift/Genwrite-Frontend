import { apiGet, apiPost, apiPut, rethrow } from "./typedClient"

export const fetchCategories = async (type: string) => {
  try {
    return await apiGet("/integrations/category", { query: { type } as never })
  } catch (err) {
    return rethrow(err, "Failed to fetch categories")
  }
}

export const fetchIntegrations = async () => {
  try {
    return await apiGet("/integrations")
  } catch (err) {
    return rethrow(err, "Failed to fetch integrations")
  }
}

export const pingIntegration = async (type: string) => {
  try {
    return await apiGet("/integrations/ping", { query: { type } as never })
  } catch (err) {
    return rethrow(err, "Failed to ping integration")
  }
}

export const createIntegration = async (payload: unknown) => {
  try {
    return await apiPost("/integrations", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to create integration")
  }
}

export const createPost = async (payload: unknown) => {
  try {
    return await apiPost("/integrations/post", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to create post")
  }
}

export const updateIntegration = async (payload: unknown) => {
  try {
    return await apiPut("/integrations/post", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to update integration")
  }
}

export const connectIntegration = async (payload: unknown) => {
  try {
    return await apiPost("/integrations/connect", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to connect integration")
  }
}
