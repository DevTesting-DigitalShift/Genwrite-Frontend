import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getAllBlogs,
  getBlogById,
  createBlog,
  createQuickBlog,
  createBlogMultiple,
  updateBlog,
  restoreBlogById,
  deleteAllBlogs,
  archiveBlogById,
  retryBlogById,
  getGeneratedTitles,
  getBlogStatus,
  getBlogs,
  getBlogPrompt,
  getBlogStatsById,
} from "@api/blogApi"
import { message } from "antd"

// ----------------------- Queries -----------------------

export const useBlogsQuery = params => {
  return useQuery({ queryKey: ["blogs", params], queryFn: () => getAllBlogs(params) })
}

export const useAllBlogsQuery = () => {
  return useQuery({ queryKey: ["allBlogs"], queryFn: () => getBlogs() })
}

export const useBlogDetailsQuery = id => {
  return useQuery({ queryKey: ["blog", id], queryFn: () => getBlogById(id), enabled: !!id })
}

export const useBlogStatsQuery = id => {
  return useQuery({
    queryKey: ["blogStats", id],
    queryFn: () => getBlogStatsById(id),
    enabled: !!id,
  })
}

export const useBlogStatusQuery = params => {
  return useQuery({ queryKey: ["blogStatus", params], queryFn: () => getBlogStatus(params) })
}

export const useGeneratedTitlesQuery = payload => {
  return useQuery({
    queryKey: ["generatedTitles", payload],
    queryFn: () => getGeneratedTitles(payload),
    enabled: !!payload,
  })
}

// ----------------------- Mutations -----------------------

export const useCreateBlogMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
    },
  })
}

export const useRestoreBlogMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: restoreBlogById,
    onSuccess: () => {
      message.success("Blog restored successfully")
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"] })
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
    },
    onError: error => {
      message.error(error.message || "Failed to restore blog")
    },
  })
}

export const useDeleteAllBlogsMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAllBlogs,
    onSuccess: result => {
      message.success(`${result.deletedCount} blogs deleted`)
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"] })
    },
    onError: error => {
      message.error(error.message || "Failed to delete all blogs")
    },
  })
}

export const useArchiveBlogMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: archiveBlogById,
    onSuccess: () => {
      message.success("Blog deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"] })
    },
    onError: error => {
      message.error(error.message || "Failed to delete blog")
    },
  })
}

export const useRetryBlogMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => retryBlogById(id, payload),
    onSuccess: result => {
      message.success(result?.message || "Blog regenerated successfully")
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
    },
    onError: error => {
      message.error(error.message || "Failed to retry blog")
    },
  })
}

export const useUpdateBlogMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateBlog(id, data),
    onSuccess: (data, variables) => {
      message.success("Blog updated successfully")
      queryClient.invalidateQueries({ queryKey: ["blog", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
    },
    onError: error => {
      message.error(error.message || "Failed to update blog")
    },
  })
}
