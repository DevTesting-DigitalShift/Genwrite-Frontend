import axiosInstance from "."

export const createInvite = async (payload: unknown) => {
  const response = await axiosInstance.post("/collaboration/invites", payload)
  return response.data
}

export const listInvites = async () => {
  const response = await axiosInstance.get("/collaboration/invites")
  return response.data
}

export const revokeInvite = async (inviteId: string) => {
  const response = await axiosInstance.delete(`/collaboration/invites/${inviteId}`)
  return response.data
}

export const acceptInvite = async (token: string) => {
  const response = await axiosInstance.post("/collaboration/invites/accept", { token })
  return response.data
}

export const listWorkspacesSharedWithMe = async () => {
  const response = await axiosInstance.get("/collaboration/watching")
  return response.data
}
