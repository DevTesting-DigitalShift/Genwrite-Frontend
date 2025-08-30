import React, { useState, useEffect, useCallback } from "react"
import { Button, Tooltip, Popconfirm, Badge, Pagination, Input, Select, message } from "antd"
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
import dayjs from "dayjs"
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

  const debouncedSearch = useCallback(
    debounce(
      (value) => {
        setSearchTerm(value)
        setCurrentPage(1)
      },
      500,
      { leading: false, trailing: true, maxWait: 1000 }
    ),
    []
  )

  const { data, isLoading } = useQuery({
    queryKey: ["trashedBlogs", statusFilter, searchTerm, dateRange, currentPage, pageSize],
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
    keepPreviousData: true,
  })

  const trashedBlogs = data?.trashedBlogs || []
  const totalBlogs = data?.totalBlogs || 0

  const restoreMutation = useMutation({
    mutationFn: (id) => dispatch(restoreTrashedBlog(id)).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"], exact: false })
      queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false })
      // message.success("Blog restored successfully")
    },
    onError: (error) => {
      console.error("Failed to restore blog:", error)
      message.error("Failed to restore blog. Please try again.")
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: () => dispatch(deleteAllUserBlogs()).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"], exact: false })
      setCurrentPage(1)
      // message.success("All trashed blogs deleted successfully")
    },
    onError: (error) => {
      console.error("Failed to delete all blogs:", error)
      message.error("Failed to delete all blogs. Please try again.")
    },
  })

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  const truncateContent = (content, length = TRUNCATE_LENGTH) => {
    if (!content) return ""
    return content.length > length ? content.substring(0, length) + "..." : content
  }

  const stripMarkdown = (text) => {
    return text
      ?.replace(/<[^>]*>/g, "")
      ?.replace(/[\\*#=_~`>\-]+/g, "")
      ?.replace(/\s{2,}/g, " ")
      ?.trim()
  }

  const handleRestore = (id) => {
    restoreMutation.mutate(id)
  }

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate()
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries(["trashedBlogs"])
  }

  const handleBlogClick = useCallback(
    (blog) => {
      navigate(`/toolbox/${blog._id}`)
    },
    [navigate]
  )

  const handleManualBlogClick = (blog) => {
    navigate(`/blog-editor/${blog._id}`)
  }

  return (
    <div className="p-8 max-w-full">
      <Helmet>
        <title>Trashcan | GenWrite</title>
      </Helmet>
      <div>
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between items-center">
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
          <div className="flex  gap-2">
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
            <Input
              placeholder="Search by title or keywords..."
              onChange={(e) => debouncedSearch(e.target.value)}
              prefix={<Search className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 mr-2 sm:mr-3" />}
              allowClear
              className="w-full rounded-lg focus:ring-0 focus:ring-blue-300 text-xs sm:text-sm shadow-none"
              disabled={isLoading}
            />

            <Select
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
              className="w-full sm:w-48 rounded-lg text-xs sm:text-sm"
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
            <img src="Images/trash-can.png" alt="Trash" className="w-20 sm:w-24" />
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
                      <span className="flex items-center justify-center gap-1 py-1 font-medium tracking-wide text-xs sm:text-sm">
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
                          onKeyDown={(e) => e.key === "Enter" && navigate(`/blog-editor`)}
                          aria-label={`View blog ${title}`}
                        >
                          <div className="flex flex-col gap-4 items-center justify-between mb-2">
                            <h3 className="text-base sm:text-lg capitalize font-semibold text-gray-900 !text-left max-w-full">
                              {title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-3 break-all">
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
                              <h3 className="text-base sm:text-lg capitalize font-semibold text-gray-900 !text-left max-w-full">
                                {title}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-3 break-all">
                                {truncateContent(stripMarkdown(content)) || ""}
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
                              width={16}
                              height={16}
                              className="cursor-pointer restore-icon"
                            />
                          </motion.div>
                        </Popconfirm>
                      </div>
                      <div className="mt-3 mb-2 flex justify-end text-xs sm:text-sm text-right text-gray-500 font-medium">
                        {wordpress?.postedOn && (
                          <span>
                            Posted on:  
                            {new Date(wordpress.postedOn).toLocaleDateString("en-US", {
                              dateStyle: "medium",
                            })}
                          </span>
                        )}
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
      <style>
        {`
          .ant-input-search .ant-input {
            border-radius: 8px !important;
            border: 1px solid #d1d5db !important;
            padding: 6px 12px !important;
          }
          .ant-input-search .ant-input:focus,
          .ant-input-search .ant-input:hover {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
          }
          .ant-input-search .ant-input-prefix {
            display: flex;
            align-items: center;
            margin-right: 8px;
          }
          .ant-select-selector {
            border-radius: 8px !important;
            border: 1px solid #d1d5db !important;
          }
          @media (max-width: 640px) {
            .ant-input {
              font-size: 12px !important;
              padding: 4px 8px !important;
            }
            .ant-select-selector {
              font-size: 12px !important;
              padding: 4px 8px !important;
            }
            .ant-btn {
              font-size: 12px !important;
              padding: 4px 8px !important;
            }
            .ant-badge .ant-ribbon {
              font-size: 10px !important;
              padding: 2px 4px !important;
            }
          }
          @media (min-width: 768px) and (max-width: 1024px) {
            .grid {
              grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
            }
            .grid > div {
              min-width: 0 !important;
            }
          }
        `}
      </style>
    </div>
  )
}

export default Trashcan
