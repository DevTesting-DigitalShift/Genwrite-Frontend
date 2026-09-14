// src/api/Collaboration/Collaboration.api.ts
import { apiDelete, apiGet, apiPost, rethrow } from "@api/typedClient"

export const CollaborationAPI = {
  createInvite: async (payload: unknown) => {
    try {
      return await apiPost("/collaboration/invites", payload as never)
    } catch (err) {
      return rethrow(err, "Failed to create invite")
    }
  },

  listInvites: async () => {
    try {
      return await apiGet("/collaboration/invites")
    } catch (err) {
      return rethrow(err, "Failed to fetch invites")
    }
  },

  revokeInvite: async (inviteId: string) => {
    try {
      return await apiDelete("/collaboration/invites/{id}", { params: { id: inviteId } })
    } catch (err) {
      return rethrow(err, "Failed to revoke invite")
    }
  },

  acceptInvite: async (token: string) => {
    try {
      return await apiPost("/collaboration/invites/accept", { token })
    } catch (err) {
      return rethrow(err, "Failed to accept invite")
    }
  },

  listWorkspacesSharedWithMe: async () => {
    try {
      return await apiGet("/collaboration/watching")
    } catch (err) {
      return rethrow(err, "Failed to fetch shared workspaces")
    }
  },
}
