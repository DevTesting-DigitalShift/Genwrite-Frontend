import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createInvite,
  listInvites,
  revokeInvite,
  acceptInvite,
  listWorkspacesSharedWithMe,
} from "@api/collaborationApi"
import { toast } from "sonner"

export const useInvitesQuery = (enabled = true) => {
  return useQuery({ queryKey: ["collaboration", "invites"], queryFn: listInvites, enabled })
}

export const useCreateInviteMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createInvite,
    onSuccess: () => {
      toast.success("Invite sent!")
      queryClient.invalidateQueries({ queryKey: ["collaboration", "invites"] })
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to send invite")
    },
  })
}

export const useRevokeInviteMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: revokeInvite,
    onSuccess: () => {
      toast.success("Invite revoked")
      queryClient.invalidateQueries({ queryKey: ["collaboration", "invites"] })
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to revoke invite")
    },
  })
}

export const useWorkspacesSharedWithMeQuery = (enabled = true) => {
  return useQuery({ queryKey: ["collaboration", "watching"], queryFn: listWorkspacesSharedWithMe, enabled })
}

export const useAcceptInviteMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaboration", "watching"] })
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to accept invite")
    },
  })
}
