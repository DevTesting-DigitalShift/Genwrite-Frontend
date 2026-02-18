import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getProfile,
  markNotificationsAsRead,
  getTransactions,
  updateUserProfile,
} from "@api/userApi"
import { message } from "antd"

export const useProfileQuery = () => {
  return useQuery({ queryKey: ["userProfile"], queryFn: getProfile })
}

export const useTransactionsQuery = () => {
  return useQuery({ queryKey: ["userTransactions"], queryFn: getTransactions })
}

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      message.success("Profile updated successfully")
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
    },
    onError: error => {
      message.error(error.response?.data?.message || "Failed to update profile")
    },
  })
}

export const useMarkNotificationsReadMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
    },
    onError: error => {
      console.error("Failed to mark notifications as read", error)
    },
  })
}
