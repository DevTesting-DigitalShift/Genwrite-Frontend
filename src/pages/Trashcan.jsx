import React, { useState, useEffect, useCallback } from "react"
import { Button, Tooltip, Badge, Pagination, Input, Select, message } from "antd"
import { RefreshCcw, Trash2, Search, ArchiveRestore, X } from "lucide-react"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { motion } from "framer-motion"
import { Helmet } from "react-helmet"
import { useDispatch, useSelector } from "react-redux"
import SkeletonLoader from "@components/UI/SkeletonLoader"
import { getAllBlogs } from "@api/blogApi"
import { deleteAllUserBlogs, restoreTrashedBlog } from "@store/slices/blogSlice"
import { selectUser } from "@store/slices/authSlice"
import { debounce } from "lodash"
import dayjs from "dayjs"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getSocket } from "@utils/socket"

const { Search: AntSearch } = Input
const { Option } = Select

const Trashcan = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState([null, null])

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useSelector(selectUser)
  const userId = user?.id || "guest"

  const TRUNCATE_LENGTH = 200
  const PAGE_SIZE_OPTIONS = [10, 15, 20, 50]

  const clearSearch = useCallback(() => {
    setSearchTerm("")
    setCurrentPage(1)
  }, [])

  const { handlePopup } = useConfirmPopup()

  const debouncedSearch = useCallback(
    debounce(
      value => {
        setSearchTerm(value)
        setCurrentPage(1)
      },
      500,
      { leading: false, trailing: true, maxWait: 1000 }
    ),
    []
  )

  // TanStack Query for fetching trashed blogs
  const { data, isLoading } = useQuery({
    queryKey: [
      "trashedBlogs",
      userId,
      statusFilter,
      searchTerm,
      dateRange[0]?.toISOString() ?? null,
      dateRange[1]?.toISOString() ?? null,
      currentPage,
      pageSize,
    ],
    queryFn: async () => {
      const queryParams = {
        isArchived: true,
        status: statusFilter !== "all" ? statusFilter : undefined,
        q: searchTerm || undefined,
        start: dateRange[0] ? dayjs(dateRange[0]).toISOString() : undefined,
        end: dateRange[1] ? dayjs(dateRange[1]).toISOString() : undefined,
        page: currentPage,
        limit: pageSize,
      }
      const response = await getAllBlogs(queryParams)
      return {
        trashedBlogs: response.data || [],
        totalBlogs: response.totalItems || 0,
      }
    },
  })

  const trashedBlogs = data?.trashedBlogs || []
  const totalBlogs = data?.totalBlogs || 0

  // Socket for real-time updates
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !user) return

    const handleBlogChange = (data, eventType) => {
      console.debug(`Blog event: ${eventType}`, data)
      const queryKey = [
        "trashedBlogs",
        userId,
        statusFilter,
        searchTerm,
        dateRange[0]?.toISOString() ?? null,
        dateRange[1]?.toISOString() ?? null,
        currentPage,
        pageSize,
      ]

      if (eventType === "blog:deleted" || eventType === "blog:restored") {
        // Remove from cache if deleted or restored
        queryClient.setQueryData(queryKey, (old = { trashedBlogs: [], totalBlogs: 0 }) => ({
          trashedBlogs: old.trashedBlogs.filter(blog => blog._id !== data.blogId),
          totalBlogs: old.totalBlogs - 1,
        }))
        queryClient.removeQueries({ queryKey: ["blog", data.blogId] })
      } else if (eventType === "blog:archived") {
        // Invalidate for newly archived blogs to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ["trashedBlogs", userId], exact: false })
        queryClient.invalidateQueries({ queryKey: ["blogs", userId], exact: false })
      } else {
        // Update existing blog in the cache
        queryClient.setQueryData(queryKey, (old = { trashedBlogs: [], totalBlogs: 0 }) => {
          const index = old.trashedBlogs.findIndex(blog => blog._id === data.blogId)
          if (index > -1) {
            // Check if blog still matches filters
            const blogDate = dayjs(data.archiveDate || data.updatedAt)
            const matchesStatus = statusFilter === "all" || data.status === statusFilter
            const matchesDate =
              !dateRange[0] ||
              !dateRange[1] ||
              blogDate.isBetween(dayjs(dateRange[0]), dayjs(dateRange[1]), "day", "[]")
            const matchesSearch =
              !searchTerm || data.title?.toLowerCase().includes(searchTerm.toLowerCase())

            if (matchesStatus && matchesDate && matchesSearch) {
              old.trashedBlogs[index] = { ...old.trashedBlogs[index], ...data }
              return { ...old, trashedBlogs: [...old.trashedBlogs] }
            } else {
              // Remove if no longer matches filters
              return {
                trashedBlogs: old.trashedBlogs.filter(blog => blog._id !== data.blogId),
                totalBlogs: old.totalBlogs - 1,
              }
            }
          }
          return old
        })
        // Update single blog query if exists
        queryClient.setQueryData(["blog", data.blogId], old => ({ ...old, ...data }))
      }
    }

    socket.on("blog:statusChanged", data => handleBlogChange(data, "blog:statusChanged"))
    socket.on("blog:updated", data => handleBlogChange(data, "blog:updated"))
    socket.on("blog:archived", data => handleBlogChange(data, "blog:archived"))
    socket.on("blog:deleted", data => handleBlogChange(data, "blog:deleted"))
    socket.on("blog:restored", data => handleBlogChange(data, "blog:restored"))

    return () => {
      socket.off("blog:statusChanged")
      socket.off("blog:updated")
      socket.off("blog:archived")
      socket.off("blog:deleted")
      socket.off("blog:restored")
    }
  }, [queryClient, user, userId, statusFilter, searchTerm, dateRange, currentPage, pageSize])

  // Clear cache on user logout
  useEffect(() => {
    if (!user) {
      queryClient.removeQueries({ queryKey: ["trashedBlogs"] })
      setCurrentPage(1)
      setPageSize(15)
      setSearchTerm("")
      setStatusFilter("all")
      setDateRange([null, null])
    }
  }, [user, queryClient])

  // Restore mutation with optimistic update
  const restoreMutation = useMutation({
    mutationFn: id => dispatch(restoreTrashedBlog(id)).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"], exact: false })
      queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false })
    },
    onError: error => {
      console.error("Failed to restore blog:", error)
    },
  })

  // Bulk delete mutation with optimistic update
  const bulkDeleteMutation = useMutation({
    mutationFn: () => dispatch(deleteAllUserBlogs()).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"], exact: false })
      setCurrentPage(1)
    },
    onError: error => {
      console.error("Failed to delete all blogs:", error)
    },
  })

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  const truncateContent = useCallback((content, length = TRUNCATE_LENGTH) => {
    if (!content) return ""
    return content.length > length ? content.substring(0, length) + "..." : content
  }, [])

  const stripMarkdown = useCallback(text => {
    return text
      ?.replace(/<[^>]*>/g, "")
      ?.replace(/[\\*#=_~`>\-]+/g, "")
      ?.replace(/\s{2,}/g, " ")
      ?.trim()
  }, [])

  const handleRestore = id => {
    restoreMutation.mutate(id)
  }

  const handleBulkDelete = useCallback(() => {
    bulkDeleteMutation.mutate()
  }, [bulkDeleteMutation])

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["trashedBlogs", userId] })
  }, [queryClient, userId])

  const handleBlogClick = useCallback(
    blog => {
      navigate(`/blog/${blog._id}`)
    },
    [navigate]
  )

  const handleManualBlogClick = useCallback(
    blog => {
      navigate(`/blog-editor/${blog._id}`)
    },
    [navigate]
  )

  return (
    <div className="p-2 md:p-4 lg:p-8 max-w-full">
      <Helmet>
        <title>Trashcan | GenWrite</title>
      </Helmet>
      <div>
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between items-center mt-5 p-2 md:mt-0 md:p-0">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
            >
              Trashcan
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-gray-600 text-sm max-w-xl mb-4"
            >
              Restore valuable work or permanently delete clutter. Trashed items are deleted after 7
              days.
            </motion.p>
          </div>
          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="default"
                icon={<RefreshCcw className="w-4 sm:w-5 h-4 sm:h-5" />}
                onClick={handleRefresh}
                disabled={isLoading}
                className="text-xs sm:text-sm px-4 py-2"
              >
                Refresh
              </Button>
            </motion.div>
            {trashedBlogs.length > 0 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="default"
                  icon={<Trash2 className="w-4 sm:w-5 h-4 sm:h-5" />}
                  onClick={() =>
                    handlePopup({
                      title: "Delete All Trashed Blogs",
                      description: (
                        <span className="my-2">
                          All trashed blogs will be <b>permanently deleted</b>. This action cannot
                          be undone.
                        </span>
                      ),

                      onConfirm: handleBulkDelete,
                      confirmProps: {
                        type: "text",
                        className: "border-red-500 hover:bg-red-500 bg-red-100 text-red-600",
                      },
                      cancelProps: {
                        danger: false,
                      },
                    })
                  }
                  disabled={isLoading}
                  className="text-xs sm:text-sm px-4 py-2"
                >
                  Delete All
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white/90 p-4 sm:p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full">
              <input
                placeholder="Search by title or keywords..."
                onChange={e => debouncedSearch(e.target.value)}
                prefix={<Search className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 mr-2 sm:mr-3" />}
                className="w-full rounded-lg border border-gray-300 px-10 py-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                disabled={isLoading}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            <Select
              value={statusFilter}
              onChange={value => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
              className="w-full sm:w-48 rounded-lg text-xs sm:text-sm"
              placeholder="Filter by status"
              disabled={isLoading}
            >
              <Option value="all">All Status</Option>
              <Option value="complete">Complete</Option>
              <Option value="failed">Failed</Option>
              <Option value="pending">Pending</Option>
            </Select>
          </div>
        </motion.div>

        {/* Blog Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[...Array(pageSize)].map((_, index) => (
              <div key={index} className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                <SkeletonLoader />
              </div>
            ))}
          </div>
        ) : trashedBlogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col justify-center items-center"
            style={{ minHeight: "calc(100vh - 250px)" }}
          >
            <img src="Images/trash-can.webp" alt="Trash" className="w-20 sm:w-24" />
            <p className="text-lg sm:text-xl mt-5 text-gray-600">No trashed blogs available.</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 p-2"
            >
              {trashedBlogs.map(blog => {
                const isManualEditor = blog.isManuallyEdited === true
                const {
                  _id,
                  title,
                  status,
                  createdAt,
                  shortContent,
                  aiModel,
                  focusKeywords,
                  archiveDate,
                  agendaNextRun,
                } = blog
                const isGemini = /gemini/gi.test(aiModel)
                return (
                  <Badge.Ribbon
                    key={_id}
                    text={
                      <span className="flex items-center justify-center gap-1 py-1 font-medium tracking-wide text-xs sm:text-sm">
                        {isManualEditor ? (
                          <>Manually Generated</>
                        ) : (
                          <>
                            <img
                              src={`./Images/${
                                isGemini ? "gemini" : aiModel === "claude" ? "claude" : "chatgpt"
                              }.webp`}
                              alt={
                                isGemini ? "Gemini" : aiModel === "claude" ? "Claude" : "ChatGPT"
                              }
                              width={16}
                              height={16}
                              loading="lazy"
                              className="bg-white"
                            />
                            {isGemini
                              ? "Gemini 2.0 flash"
                              : aiModel === "claude"
                              ? "Claude 4 sonnet"
                              : "Gpt 4.1 nano"}
                          </>
                        )}
                      </span>
                    }
                    className="absolute top-0"
                    color={
                      isManualEditor
                        ? "#9CA3AF"
                        : isGemini
                        ? "#4796E3"
                        : aiModel === "claude"
                        ? "#9368F8"
                        : "#74AA9C"
                    }
                  >
                    <div
                      className={`bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-lg p-4 sm:p-6 min-h-[180px] min-w-0 relative ${
                        isManualEditor
                          ? "border-gray-500"
                          : status === "failed"
                          ? "border-red-500"
                          : status === "pending" || status === "in-progress"
                          ? "border-yellow-500"
                          : "border-green-500"
                      } border-2`}
                      title={title}
                    >
                      <div className="text-xs font-semibold text-gray-400 mb-2 -mt-2">
                        {new Date(createdAt).toLocaleDateString("en-US", {
                          dateStyle: "medium",
                        })}
                      </div>
                      {isManualEditor ? (
                        <div
                          className="cursor-pointer"
                          onClick={() => handleManualBlogClick(blog)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => e.key === "Enter" && handleManualBlogClick(blog)}
                          aria-label={`View blog ${title}`}
                        >
                          <div className="flex flex-col gap-4 items-center justify-between mb-2">
                            <h3 className="text-base sm:text-lg capitalize font-semibold text-gray-900 !text-left max-w-full">
                              {title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-3 break-all">
                              {truncateContent(stripMarkdown(blog.content)) || ""}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Tooltip
                          title={
                            status === "complete"
                              ? title
                              : status === "failed"
                              ? "Blog generation failed"
                              : status === "pending"
                              ? `Pending Blog will be generated ${
                                  agendaJob?.nextRunAt
                                    ? "at " +
                                      new Date(agendaJob.nextRunAt).toLocaleString("en-IN", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })
                                    : "shortly"
                                }`
                              : `Blog generation is ${status}`
                          }
                          color={
                            status === "complete"
                              ? "green"
                              : status === "failed"
                              ? "red"
                              : "#eab308"
                          }
                        >
                          <div
                            className="cursor-pointer"
                            onClick={() => {
                              if (status === "complete" || status === "failed") {
                                handleBlogClick(blog)
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e =>
                              e.key === "Enter" &&
                              (status === "complete" || status === "failed") &&
                              handleBlogClick(blog)
                            }
                            aria-label={`View blog ${title}`}
                          >
                            <div className="flex flex-col gap-4 items-center justify-between mb-2">
                              <h3 className="text-base sm:text-lg capitalize font-semibold text-gray-900 !text-left max-w-full">
                                {title}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-3 break-all">
                                {truncateContent(stripMarkdown(shortContent)) || ""}
                              </p>
                            </div>
                          </div>
                        </Tooltip>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {focusKeywords?.map((keyword, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            handlePopup({
                              title: "Restore Blog",
                              description: (
                                <span className="my-2">
                                  Are you sure to restore <b>{title}</b> blog?
                                </span>
                              ),
                              confirmText: "Yes",
                              onConfirm: () => {
                                handleRestore(_id)
                              },
                              confirmProps: {
                                type: "text",
                                className: "border-green-500 bg-green-50 text-green-600",
                              },
                              cancelProps: {
                                danger: false,
                              },
                            })
                          }
                        >
                          <ArchiveRestore className="w-5 h-5 cursor-pointer" />
                        </motion.div>
                      </div>
                      <div className="mt-3 mb-2 flex justify-end text-xs sm:text-sm text-right text-gray-500 font-medium">
                        <span className="block -mb-2">
                          Archive Date:{" "}
                          {new Date(archiveDate).toLocaleDateString("en-US", {
                            dateStyle: "medium",
                          })}
                        </span>
                      </div>
                    </div>
                  </Badge.Ribbon>
                )
              })}
            </motion.div>
            {totalBlogs > pageSize && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex justify-center mt-6"
              >
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalBlogs}
                  pageSizeOptions={PAGE_SIZE_OPTIONS.filter(size => size <= 100)}
                  onChange={(page, newPageSize) => {
                    setCurrentPage(page)
                    if (newPageSize !== pageSize) {
                      setPageSize(newPageSize)
                      setCurrentPage(1)
                    }
                  }}
                  showSizeChanger
                  showTotal={total => `Total ${total} blogs`}
                  responsive={true}
                  disabled={isLoading}
                />
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Trashcan
