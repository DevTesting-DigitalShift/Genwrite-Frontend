import React, { useState, useEffect, useCallback } from "react"
import {
  Button,
  Tooltip,
  Popconfirm,
  Badge,
  Pagination,
  Input,
  Select,
  message,
} from "antd"
import { RefreshCcw, Trash2, Search } from "lucide-react"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { motion } from "framer-motion"
import { Helmet } from "react-helmet"
import { useDispatch } from "react-redux"
import SkeletonLoader from "@components/Projects/SkeletonLoader"
import { getAllBlogs } from "@api/blogApi"
import { deleteAllUserBlogs, restoreTrashedBlog } from "@store/slices/blogSlice"
import { debounce } from "lodash"
import moment from "moment"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const { Search: AntSearch } = Input
const { Option } = Select

const Trashcan = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState([null, null])

  const { handlePopup } = useConfirmPopup()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const TRUNCATE_LENGTH = 85
  const PAGE_SIZE_OPTIONS = [10, 15, 20, 50]

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value)
      setCurrentPage(1) // Reset to first page on search
    }, 500),
    []
  )

  // Fetch trashed blogs using TanStack Query
  const { data, isLoading } = useQuery({
    queryKey: ["trashedBlogs", statusFilter, searchTerm, dateRange, currentPage, pageSize],
    queryFn: async () => {
      const queryParams = {
        isArchived: true,
        status: statusFilter !== "all" ? statusFilter : undefined,
        q: searchTerm || undefined,
        start: dateRange[0] ? moment(dateRange[0]).toISOString() : undefined,
        end: dateRange[1] ? moment(dateRange[1]).toISOString() : undefined,
        page: currentPage,
        limit: pageSize,
      }
      const response = await getAllBlogs(queryParams)
      return {
        trashedBlogs: response.data || [],
        totalBlogs: response.totalItems || 0,
      }
    },
    keepPreviousData: true, // Keep previous data while fetching new data
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep cache for 10 minutes
  })

  const trashedBlogs = data?.trashedBlogs || []
  const totalBlogs = data?.totalBlogs || 0

  // Mutation for restoring a blog
  const restoreMutation = useMutation({
    mutationFn: (id) => dispatch(restoreTrashedBlog(id)).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries(["trashedBlogs"])
      message.success("Blog restored successfully")
    },
    onError: (error) => {
      console.error("Failed to restore blog:", error)
      message.error("Failed to restore blog. Please try again.")
    },
  })

  // Mutation for bulk delete
  const bulkDeleteMutation = useMutation({
    mutationFn: () => dispatch(deleteAllUserBlogs()).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries(["trashedBlogs"])
      setCurrentPage(1)
      message.success("All trashed blogs deleted successfully")
    },
    onError: (error) => {
      console.error("Failed to delete all blogs:", error)
      message.error("Failed to delete all blogs. Please try again.")
    },
  })

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  // Truncate content
  const truncateContent = (content, length = TRUNCATE_LENGTH) => {
    if (!content) return ""
    return content.length > length ? content.substring(0, length) + "..." : content
  }

  // Strip markdown
  const stripMarkdown = (text) => {
    return text
      ?.replace(/<[^>]*>/g, "")
      ?.replace(/[\\*#=_~`>\-]+/g, "")
      ?.replace(/\s{2,}/g, " ")
      ?.trim()
  }

  // Handle restore
  const handleRestore = (id) => {
    restoreMutation.mutate(id)
  }

  // Handle bulk delete
  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate()
  }

  // Handle refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries(["trashedBlogs"])
    message.info("Blog list refreshed")
  }

  // Handle blog click
  const handleBlogClick = (blog) => {
    message.info(`Clicked on blog: ${blog.title}`)
  }

  // Handle manual blog click
  const handleManualBlogClick = (blog) => {
    navigate(`/blog-editor/${blog._id}`)
  }

  return (
    <div className="p-5">
      <Helmet>
        <title>Trashcan | GenWrite</title>
      </Helmet>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Trashcan
          </motion.h1>
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="default"
                icon={<RefreshCcw className="w-4 h-4" />}
                onClick={handleRefresh}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </motion.div>
            {trashedBlogs.length > 0 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="default"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() =>
                    handlePopup({
                      title: "Delete All Trashed Blogs",
                      description: (
                        <span className="my-2">
                          All trashed blogs will be <b>permanently deleted</b>. This action cannot
                          be undone.
                        </span>
                      ),
                      confirmText: "Delete All",
                      onConfirm: handleBulkDelete,
                      confirmProps: {
                        className: "border-red-500 hover:bg-red-500 hover:text-white",
                      },
                      cancelProps: {
                        danger: false,
                      },
                    })
                  }
                  disabled={isLoading}
                >
                  Delete All
                </Button>
              </motion.div>
            )}
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-gray-600 text-sm sm:text-base max-w-xl mb-6"
        >
          Restore valuable work or permanently delete clutter. Trashed items are deleted after 7
          days.
        </motion.p>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-gray-100 p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <AntSearch
              placeholder="Search by title or keywords..."
              onChange={(e) => debouncedSearch(e.target.value)}
              prefix={<Search className="w-5 h-5 text-gray-400 mr-2" />}
              allowClear
              className="w-full rounded-lg"
              disabled={isLoading}
            />
            <Select
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
              className="w-full sm:w-1/4 rounded-lg"
              placeholder="Filter by status"
              disabled={isLoading}
            >
              <Option value="all">All Statuses</Option>
              <Option value="complete">Complete</Option>
              <Option value="failed">Failed</Option>
              <Option value="pending">Pending</Option>
            </Select>
          </div>
        </motion.div>

        {/* Blog Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(pageSize)].map((_, index) => (
              <div key={index} className="bg-white shadow-md rounded-xl p-4">
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
            <img src="Images/trash-can.png" alt="Trash" style={{ width: "8rem" }} />
            <p className="text-xl mt-5 text-gray-600">No trashed blogs available.</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-2"
            >
              {trashedBlogs.map((blog) => {
                const isManualEditor = blog.isManuallyEdited === true
                const {
                  _id,
                  title,
                  status,
                  createdAt,
                  content,
                  aiModel,
                  focusKeywords,
                  wordpress,
                  archiveDate,
                  agendaJob,
                } = blog
                const isGemini = /gemini/gi.test(aiModel)
                return (
                  <Badge.Ribbon
                    key={_id}
                    text={
                      <span className="flex items-center justify-center gap-1 py-1 font-medium tracking-wide">
                        {isManualEditor ? (
                          <>Manually Generated</>
                        ) : (
                          <>
                            <img
                              src={`./Images/${
                                isGemini ? "gemini" : aiModel === "claude" ? "claude" : "chatgpt"
                              }.png`}
                              alt={
                                isGemini ? "Gemini" : aiModel === "claude" ? "Claude" : "ChatGPT"
                              }
                              width={20}
                              height={20}
                              loading="lazy"
                              className="bg-white"
                            />
                            {isGemini
                              ? "Gemini 2.0 flash"
                              : aiModel === "claude"
                              ? "Claude 4 sonnet"
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
                      className={`bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl p-4 min-h-[180px] min-w-[390px] relative ${
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
                          onKeyDown={(e) => e.key === "Enter" && navigate(`/blog-editor`)}
                          aria-label={`View blog ${title}`}
                        >
                          <div className="flex flex-col gap-4 items-center justify-between mb-2">
                            <h3 className="text-lg capitalize font-semibold text-gray-900 !text-left max-w-76">
                              {title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-all">
                              {truncateContent(stripMarkdown(content)) || ""}
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
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              (status === "complete" || status === "failed") &&
                              handleBlogClick(blog)
                            }
                            aria-label={`View blog ${title}`}
                          >
                            <div className="flex flex-col gap-4 items-center justify-between mb-2">
                              <h3 className="text-lg capitalize font-semibold text-gray-900 !text-left max-w-76">
                                {title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-all">
                                {truncateContent(stripMarkdown(content)) || ""}
                              </p>
                            </div>
                          </div>
                        </Tooltip>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          {focusKeywords?.map((keyword, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                        <Popconfirm
                          title="Restore Blog"
                          description="Are you sure to restore this blog?"
                          icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                          okText="Yes"
                          cancelText="No"
                          onConfirm={() => handleRestore(_id)}
                        >
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <img
                              src="Images/restore.svg"
                              alt="Restore"
                              width="20"
                              height="20"
                              className="cursor-pointer restore-icon"
                            />
                          </motion.div>
                        </Popconfirm>
                      </div>
                      <div className="mt-3 mb-2 flex justify-end text-xs text-right text-gray-500 font-medium">
                        {wordpress?.postedOn && (
                          <span>
                            Posted on:  
                            {new Date(wordpress.postedOn).toLocaleDateString("en-US", {
                              dateStyle: "medium",
                            })}
                          </span>
                        )}
                        <span className="block -mb-2 text-sm text-right">
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
            {totalBlogs > 15 && (
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
                  pageSizeOptions={PAGE_SIZE_OPTIONS.filter((size) => size <= 100)}
                  onChange={(page, newPageSize) => {
                    setCurrentPage(page)
                    if (newPageSize !== pageSize) {
                      setPageSize(newPageSize)
                      setCurrentPage(1)
                    }
                  }}
                  showSizeChanger={false}
                  showTotal={(total) => `Total ${total} blogs`}
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