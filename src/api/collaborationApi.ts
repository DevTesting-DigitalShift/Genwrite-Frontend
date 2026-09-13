import { apiDelete, apiGet, apiPost, rethrow } from "./typedClient"

export const createInvite = async (payload: unknown) => {
  try {
    return await apiPost("/collaboration/invites", payload as never)
  } catch (err) {
    return rethrow(err, "Failed to create invite")
  }
}

export const listInvites = async () => {
  try {
    return await apiGet("/collaboration/invites")
  } catch (err) {
    return rethrow(err, "Failed to fetch invites")
  }
}

export const revokeInvite = async (inviteId: string) => {
  try {
    return await apiDelete("/collaboration/invites/{id}", { params: { id: inviteId } })
  } catch (err) {
    return rethrow(err, "Failed to revoke invite")
  }
}

export const acceptInvite = async (token: string) => {
  try {
    return await apiPost("/collaboration/invites/accept", { token })
  } catch (err) {
    return rethrow(err, "Failed to accept invite")
  }
}

export const listWorkspacesSharedWithMe = async () => {
  try {
    return await apiGet("/collaboration/watching")
  } catch (err) {
    return rethrow(err, "Failed to fetch shared workspaces")
  }
}
