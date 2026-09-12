import { apiDelete, apiGet, apiPost, ApiRequestError } from "./typedClient"

const rethrow = (err: unknown, fallback: string): never => {
  if (err instanceof ApiRequestError) throw new Error(err.message || fallback)
  throw err instanceof Error ? err : new Error(fallback)
}

export const createInvite = async (payload: unknown) => {
  try {
    return await apiPost("/api/v1/collaboration/invites", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to create invite")
  }
}

export const listInvites = async () => {
  try {
    return await apiGet("/api/v1/collaboration/invites")
  } catch (err) {
    return rethrow(err, "Failed to fetch invites")
  }
}

export const revokeInvite = async (inviteId: string) => {
  try {
    return await apiDelete("/api/v1/collaboration/invites/{id}", { params: { id: inviteId } })
  } catch (err) {
    return rethrow(err, "Failed to revoke invite")
  }
}

export const acceptInvite = async (token: string) => {
  try {
    return await apiPost("/api/v1/collaboration/invites/accept", { token })
  } catch (err) {
    return rethrow(err, "Failed to accept invite")
  }
}

export const listWorkspacesSharedWithMe = async () => {
  try {
    return await apiGet("/api/v1/collaboration/watching")
  } catch (err) {
    return rethrow(err, "Failed to fetch shared workspaces")
  }
}
