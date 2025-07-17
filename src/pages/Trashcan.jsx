import React, { useState, useEffect, useCallback } from "react"
import {
  Button,
  Tooltip,
  Popconfirm,
  Badge,
  Pagination,
  Input,
  Select,
  DatePicker,
  message,
} from "antd"
import { RefreshCcw, Trash2, Search } from "lucide-react"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { motion } from "framer-motion"
import { Helmet } from "react-helmet"
import { useDispatch, useSelector } from "react-redux"
import SkeletonLoader from "@components/Projects/SkeletonLoader"
import { getAllBlogs } from "@api/blogApi"
import { deleteAllUserBlogs, restoreTrashedBlog, fetchAllBlogs } from "@store/slices/blogSlice"
import { debounce } from "lodash"
import moment from "moment"

const { Search: AntSearch } = Input
const { Option } = Select
const { RangePicker } = DatePicker

const Trashcan = () => {
  const [trashedBlogs, setTrashedBlogs] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [totalBlogs, setTotalBlogs] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState([null, null])
  const [isLoading, setIsLoading] = useState(false)

  const { handlePopup } = useConfirmPopup()
  const dispatch = useDispatch()
  const { blogs, loading } = useSelector((state) => state.blog)

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

  // Fetch trashed blogs from backend
  const fetchTrashedBlogs = useCallback(async () => {
    setIsLoading(true)
    try {
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
      setTrashedBlogs(response.data || [])
      setTotalBlogs(response.total || 0)
    } catch (error) {
      console.error("Failed to fetch trashed blogs:", error)
      message.error("Failed to load trashed blogs. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, searchTerm, dateRange, currentPage, pageSize])

  // Fetch blogs on mount and when dependencies change
  useEffect(() => {
    fetchTrashedBlogs()
  }, [fetchTrashedBlogs])

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  const truncateContent = (content, length = TRUNCATE_LENGTH) => {
    if (!content) return ""
    return content.length > length ? content.substring(0, length) + "..." : content
  }

  const cleanText = (text) => {
    return text.replace(/[#=~`*_\-]+/g, "").trim()
  }

  const handleRestore = async (id) => {
    try {
      await dispatch(restoreTrashedBlog(id)).unwrap()
      message.success("Blog restored successfully")
      fetchTrashedBlogs() // Refresh the list
    } catch (error) {
      console.error("Failed to restore blog:", error)
      message.error("Failed to restore blog. Please try again.")
    }
  }

  const handleBulkDelete = async () => {
    try {
      await dispatch(deleteAllUserBlogs()).unwrap()
      message.success("All trashed blogs deleted successfully")
      setTrashedBlogs([])
      setCurrentPage(1)
      setTotalBlogs(0)
    } catch (error) {
      console.error("Failed to delete all blogs:", error)
      message.error("Failed to delete all blogs. Please try again.")
    }
  }

  const handleRefresh = async () => {
    setCurrentPage(1)
    await fetchTrashedBlogs()
    message.info("Blog list refreshed")
  }

  const handleBlogClick = (blog) => {
    // Implement navigation or action for clicking a blog (e.g., view details)
    // Example: navigate(`/blog/${blog._id}`)
    message.info(`Clicked on blog: ${blog.title}`)
  }

  return (
    <div className="p-5">
      <Helmet>
        <title>Trashcan | GenWrite</title>
      </Helmet>
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          Trashcan
        </motion.h1>
        <div className="flex items-center gap-3">
          <Button
            type="default"
            icon={<RefreshCcw className="w-4 h-4" />}
            onClick={handleRefresh}
            className="hover:!border-yellow-500 hover:text-yellow-500"
            disabled={isLoading}
          >
            Refresh
          </Button>
          {trashedBlogs.length > 0 && (
            <Button
              type="default"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() =>
                handlePopup({
                  title: "Delete All Trashed Blogs",
                  description: (
                    <span className="my-2">
                      All trashed blogs will be <b>permanently deleted</b>. This action cannot be
                      undone.
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
              className="hover:!border-red-500 hover:text-red-500"
              disabled={isLoading}
            >
              Delete All
            </Button>
          )}
        </div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-600 max-w-xl mb-4"
      >
        Restore valuable work or permanently delete clutter. Trashed items are deleted after 7 days.
      </motion.p>

      {/* Filters */}
      {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <AntSearch
            placeholder="Search by title or keywords..."
            onChange={(e) => debouncedSearch(e.target.value)}
            prefix={<Search className="w-5 h-5 text-gray-400 mr-2" />}
            allowClear
            className="w-full lg:w-1/3"
            disabled={isLoading}
          />
          <Select
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value)
              setCurrentPage(1)
            }}
            className="w-full lg:w-1/4"
            placeholder="Filter by status"
            disabled={isLoading}
          >
            <Option value="all">All </Option>
            <Option value="complete">Complete</Option>
            <Option value="failed">Failed</Option>
            <Option value="pending">Pending</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates)
              setCurrentPage(1)
            }}
            className="w-full lg:w-1/3"
            disabled={isLoading}
            format="YYYY-MM-DD"
          />
        </div>
      </div> */}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(pageSize)].map((_, index) => (
            <div key={index} className="bg-white shadow-md rounded-xl p-4">
              <SkeletonLoader />
            </div>
          ))}
        </div>
      ) : trashedBlogs.length === 0 ? (
        <div
          className="flex flex-col justify-center items-center"
          style={{ minHeight: "calc(100vh - 250px)" }}
        >
          <img src="Images/trash-can.png" alt="Trash" style={{ width: "8rem" }} />
          <p className="text-xl mt-5">No trashed blogs available.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-2">
            {trashedBlogs.map((blog) => {
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
              } = blog
              const isGemini = /gemini/gi.test(aiModel)
              return (
                <Badge.Ribbon
                  key={_id}
                  text={
                    <span className="flex items-center justify-center gap-1 py-1 font-medium tracking-wide">
                      <img
                        src={`./Images/${
                          isGemini ? "gemini" : aiModel === "claude" ? "claude" : "chatgpt"
                        }.png`}
                        alt=""
                        width={20}
                        height={20}
                        loading="lazy"
                        className="bg-white"
                      />
                      {isGemini
                        ? "Gemini-1.5-flash"
                        : aiModel === "claude"
                        ? "Claude-3-Haiku"
                        : "ChatGPT-4o-mini"}
                    </span>
                  }
                  className="absolute top-0"
                  color={
                    isGemini
                      ? "#4796E3" // Gemini blue
                      : aiModel === "claude"
                      ? "#9368F8" // Claude purple-ish
                      : "#74AA9C" // ChatGPT green
                  }
                >
                  <div
                    className={`bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl p-4 min-h-[180px] min-w-[390px] relative
                      ${
                        (status === "failed"
                          ? "border-red-500"
                          : status === "complete"
                          ? "border-green-500"
                          : "border-yellow-500") + " border-2"
                      }
                    `}
                    title={title}
                  >
                    <div className="text-xs font-semibold text-gray-400 mb-2 -mt-2">
                      {new Date(createdAt).toLocaleDateString("en-US", {
                        dateStyle: "medium",
                      })}
                    </div>
                    <Tooltip
                      color={
                        status === "complete" ? "black" : status === "failed" ? "red" : "orange"
                      }
                      title={
                        status === "complete" ? "Click to view blog" : "Cannot view incomplete blog"
                      }
                    >
                      <div
                        className={`cursor-${status === "complete" ? "pointer" : "default"}`}
                        onClick={() => {
                          if (status === "complete") {
                            handleBlogClick(blog)
                          }
                        }}
                      >
                        <div className="flex flex-col gap-4 items-center justify-between mb-2">
                          <h3 className="text-lg capitalize font-semibold text-gray-900 !text-left max-w-76">
                            {title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-all">
                            {truncateContent(cleanText(content))}
                          </p>
                        </div>
                      </div>
                    </Tooltip>
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
                        <img
                          src="Images/restore.svg"
                          alt="Restore"
                          width="20"
                          height="20"
                          className="cursor-pointer restore-icon"
                        />
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
          </div>
          {totalBlogs > 0 && (
            <div className="flex justify-center mt-6">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalBlogs}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onChange={(page, newPageSize) => {
                  setCurrentPage(page)
                  setPageSize(newPageSize)
                }}
                showSizeChanger
                showTotal={(total) => `Total ${total} blogs`}
                responsive={true}
                disabled={isLoading}
              />
            </div>
          )}
        </>
      )}
      <style>
        {`
          .restore-icon {
            transition: filter 0.2s;
          }
          .restore-icon:hover {
            filter: invert(18%) sepia(99%) saturate(7482%) hue-rotate(357deg) brightness(97%) contrast(119%);
          }
          .ant-select-disabled .ant-select-selector,
          .ant-input-disabled,
          .ant-picker-disabled {
            background-color: #f5f5f5 !important;
            cursor: not-allowed !important;
          }
        `}
      </style>
    </div>
  )
}

export default Trashcan
