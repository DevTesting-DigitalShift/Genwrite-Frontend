import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import SkeletonLoader from "./SkeletonLoader"
import {
  Badge,
  Button,
  Input,
  Popconfirm,
  Tooltip,
  Popover,
  Pagination,
  DatePicker,
  message,
} from "antd"
import { ArrowDownUp, Filter, Plus, RefreshCcw, RotateCcw, Search, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import {
  CheckCircleOutlined,
  SortAscendingOutlined,
  HourglassOutlined,
  CloseCircleOutlined,
  SortDescendingOutlined,
  FieldTimeOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons"
import { Helmet } from "react-helmet"
import { useDispatch, useSelector } from "react-redux"
import { archiveBlog, fetchAllBlogs, retryBlog } from "@store/slices/blogSlice"
import moment from "moment"

const { Search: AntSearch } = Input
const { RangePicker } = DatePicker

const MyProjects = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [totalBlogs, setTotalBlogs] = useState(0)
  const [sortType, setSortType] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState([null, null])
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isFunnelMenuOpen, setFunnelMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const dispatch = useDispatch()
  const { blogs, loading } = useSelector((state) => state.blog)

  const TRUNCATE_LENGTH = 120
  const FIXED_LIMIT = 15

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1) // Reset to first page on search
    }, 400)

    return () => clearTimeout(handler)
  }, [searchTerm])

  // Reset filters when navigating to pages other than 1
  useEffect(() => {
    if (currentPage !== 1) {
      setSortOrder("desc")
      setSortType("createdAt")
      setStatusFilter("all")
      setDateRange([null, null])
      setSearchTerm("")
      setDebouncedSearch("")
    }
  }, [currentPage])

  // Fetch blogs with filters and pagination
  const fetchBlogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const queryParams = {
        sort: `${sortType}:${sortOrder}`,
        status: statusFilter !== "all" ? statusFilter : undefined,
        q: debouncedSearch || undefined,
        start: dateRange[0] ? moment(dateRange[0]).toISOString() : undefined,
        end: dateRange[1] ? moment(dateRange[1]).toISOString() : undefined,
        page: currentPage,
        limit: FIXED_LIMIT,
      }
      const response = await dispatch(fetchAllBlogs(queryParams)).unwrap()
      console.log({ response })
      setTotalBlogs(response.totalItems || 0)
    } catch (error) {
      console.error("Failed to fetch blogs:", error)
      message.error("Failed to load blogs. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [dispatch, sortType, sortOrder, statusFilter, debouncedSearch, dateRange, currentPage])

  // Fetch blogs when filters or pagination change
  useEffect(() => {
    fetchBlogs()
  }, [fetchBlogs])

  // Responsive items per page for skeleton loading
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerPage(15)
      } else if (window.innerWidth >= 768) {
        setItemsPerPage(12)
      } else {
        setItemsPerPage(6)
      }
    }

    updateItemsPerPage()
    window.addEventListener("resize", updateItemsPerPage)
    return () => window.removeEventListener("resize", updateItemsPerPage)
  }, [])

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  // Toggle sort menu
  const toggleMenu = () => {
    setMenuOpen((prev) => {
      if (!prev) setFunnelMenuOpen(false)
      return !prev
    })
  }

  // Toggle filter menu
  const toggleFunnelMenu = () => {
    setFunnelMenuOpen((prev) => {
      if (!prev) setMenuOpen(false)
      return !prev
    })
  }

  // Reset filters
  const resetFilters = () => {
    setSortOrder("desc")
    setSortType("createdAt")
    setStatusFilter("all")
    setDateRange([null, null])
    setSearchTerm("")
    setDebouncedSearch("")
    setCurrentPage(1)
    message.info("Filters reset")
  }

  // Handle blog click
  const handleBlogClick = (blog) => {
    navigate(`/toolbox/${blog._id}`)
  }

  // Handle retry
  const handleRetry = async (id) => {
    try {
      await dispatch(retryBlog({ id })).unwrap()
      message.success("Blog retry initiated")
      await fetchBlogs()
    } catch (error) {
      console.error("Failed to retry blog:", error)
      message.error("Failed to retry blog. Please try again.")
    }
  }

  // Handle archive
  const handleArchive = async (id) => {
    try {
      await dispatch(archiveBlog(id)).unwrap()
      message.success("Blog moved to trash")
      await fetchBlogs()
    } catch (error) {
      console.error("Failed to archive blog:", error)
      message.error("Failed to archive blog. Please try again.")
    }
  }

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

  // Menu options for sorting
  const menuOptions = [
    {
      label: "A-Z (Ascending)",
      icon: <SortAscendingOutlined />,
      onClick: () => {
        setSortType("title")
        setSortOrder("asc")
        setMenuOpen(false)
        setCurrentPage(1)
      },
    },
    {
      label: "Z-A (Descending)",
      icon: <SortDescendingOutlined />,
      onClick: () => {
        setSortType("title")
        setSortOrder("desc")
        setMenuOpen(false)
        setCurrentPage(1)
      },
    },
    {
      label: "Created Date (Newest)",
      icon: <FieldTimeOutlined />,
      onClick: () => {
        setSortType("createdAt")
        setSortOrder("desc")
        setMenuOpen(false)
        setCurrentPage(1)
      },
    },
    {
      label: "Created Date (Oldest)",
      icon: <ClockCircleOutlined />,
      onClick: () => {
        setSortType("createdAt")
        setSortOrder("asc")
        setMenuOpen(false)
        setCurrentPage(1)
      },
    },
  ]

  // Filter options
  const funnelMenuOptions = [
    {
      label: "Status: Completed",
      icon: <CheckCircleOutlined />,
      onClick: () => {
        setStatusFilter("complete")
        setFunnelMenuOpen(false)
        setCurrentPage(1)
      },
    },
    {
      label: "Status: Pending",
      icon: <HourglassOutlined />,
      onClick: () => {
        setStatusFilter("pending")
        setFunnelMenuOpen(false)
        setCurrentPage(1)
      },
    },
    {
      label: "Status: Failed",
      icon: <CloseCircleOutlined />,
      onClick: () => {
        setStatusFilter("failed")
        setFunnelMenuOpen(false)
        setCurrentPage(1)
      },
    },
  ]

  // Date range presets
  const datePresets = [
    { label: "Last 7 Days", value: [moment().subtract(7, "days"), moment()] },
    { label: "Last 30 Days", value: [moment().subtract(30, "days"), moment()] },
    { label: "Last 3 Months", value: [moment().subtract(3, "months"), moment()] },
    { label: "Last 6 Months", value: [moment().subtract(6, "months"), moment()] },
    { label: "This Year", value: [moment().startOf("year"), moment()] },
  ]

  return (
    <div className="p-5">
      <Helmet>
        <title>Blogs | GenWrite</title>
      </Helmet>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Blogs Generated
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-gray-500 text-sm mt-2 max-w-md"
          >
            All your content creation tools in one place. Streamline your workflow with our powerful
            suite of tools.
          </motion.p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            to="/blog-editor"
            className="flex items-center gap-2 px-4 py-2 bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Blog
          </Link>
        </motion.div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg mb-6 shadow-sm border border-gray-100">
        <div className="flex-1">
          <AntSearch
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<Search className="w-4 h-4 text-gray-500" />}
            className="rounded-lg border-gray-300 shadow-sm"
            allowClear
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-2">
          <Popover
            open={isMenuOpen}
            onOpenChange={(visible) => setMenuOpen(visible)}
            trigger="click"
            placement="bottomRight"
            content={
              <div className="min-w-[200px] rounded-lg space-y-1">
                {menuOptions.map(({ label, icon, onClick }) => (
                  <Tooltip title={label} placement="left" key={label}>
                    <button
                      onClick={onClick}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-lg">{icon}</span>
                      <span>{label}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            }
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="default"
                icon={<ArrowDownUp className="w-4 h-4" />}
                onClick={toggleMenu}
                className="p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100"
                disabled={isLoading}
              >
                Sort
              </Button>
            </motion.div>
          </Popover>

          <Popover
            open={isFunnelMenuOpen}
            onOpenChange={(visible) => setFunnelMenuOpen(visible)}
            trigger="click"
            placement="bottomRight"
            content={
              <div className="min-w-[200px] rounded-lg space-y-1">
                {funnelMenuOptions.map(({ label, icon, onClick }) => (
                  <Tooltip title={label} placement="left" key={label}>
                    <button
                      onClick={onClick}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-lg">{icon}</span>
                      <span>{label}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            }
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="default"
                icon={<Filter className="w-4 h-4" />}
                onClick={toggleFunnelMenu}
                className="p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100"
                disabled={isLoading}
              >
                Filter
              </Button>
            </motion.div>
          </Popover>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="default"
              icon={<RefreshCcw className="w-4 h-4" />}
              onClick={fetchBlogs}
              className="p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100"
              disabled={isLoading}
            >
              Refresh
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="default"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={resetFilters}
              className="p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100"
              disabled={isLoading}
            >
              Reset
            </Button>
          </motion.div>
        </div>
        <div className="flex-1">
          <RangePicker
            presets={datePresets}
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates)
              setCurrentPage(1)
            }}
            className="w-full rounded-lg border-gray-300 shadow-sm"
            format="YYYY-MM-DD"
            disabled={isLoading}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center p-2">
          {[...Array(itemsPerPage)].map((_, index) => (
            <div key={index} className="bg-white shadow-md rounded-xl p-4 min-w-[390px]">
              <SkeletonLoader />
            </div>
          ))}
        </div>
      ) : blogs.data.length === 0 ? (
        <div
          className="flex flex-col justify-center items-center"
          style={{ minHeight: "calc(100vh - 270px)" }}
        >
          <img src="Images/no-blog.png" alt="No Blogs" style={{ width: "8rem" }} />
          <p className="text-xl mt-5">No blogs available.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center p-2">
            {blogs.data.map((blog) => {
              const {
                _id,
                title,
                status,
                createdAt,
                content,
                aiModel,
                focusKeywords,
                updatedAt,
                wordpress,
                agendaJob,
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
                  color={isGemini ? "#4796E3" : aiModel === "claude" ? "#9368F8" : "#74AA9C"}
                >
                  <div
                    className={`bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl p-4 min-h-[180px] min-w-[390px] relative
                      ${
                        status === "failed"
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
                        status === "complete" ? "green" : status === "failed" ? "red" : "#eab308"
                      }
                    >
                      <div
                        className={`cursor-${
                          status === "complete" || status === "failed" ? "pointer" : "default"
                        }`}
                        onClick={() => {
                          if (status === "complete" || status === "failed") {
                            handleBlogClick(blog)
                          }
                        }}
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
                    <div className="flex items-center justify-end gap-2">
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
                      {status === "failed" && (
                        <Popconfirm
                          title="Retry Blog Generation"
                          description="Are you sure you want to retry generating this blog?"
                          icon={
                            <RotateCcw style={{ color: "red" }} size={15} className="mt-1 mr-1" />
                          }
                          okText="Yes"
                          cancelText="No"
                          onConfirm={() => handleRetry(_id)}
                        >
                          <RotateCcw className="w-5 h-5 cursor-pointer" />
                        </Popconfirm>
                      )}
                      <Button
                        type="default"
                        icon={<Trash2 className="w-5 h-5" />}
                        onClick={() =>
                          handlePopup({
                            title: "Move to Trash",
                            description: (
                              <span className="my-2">
                                Blog <b>{title}</b> will be moved to trash. You can restore it
                                later.
                              </span>
                            ),
                            confirmText: "Delete",
                            onConfirm: () => {
                              handleArchive(_id)
                            },
                            confirmProps: {
                              className: "border-red-500 hover:bg-red-500 hover:text-white",
                            },
                            cancelProps: {
                              danger: false,
                            },
                          })
                        }
                        className="p-2 hover:!border-red-500 hover:text-red-500"
                      />
                    </div>
                    <div className="mt-3 -mb-2 flex justify-end text-xs text-right text-gray-500 font-medium">
                      {wordpress?.postedOn && (
                        <span className="">
                          Posted on: {""}  
                          {new Date(wordpress.postedOn).toLocaleDateString("en-US", {
                            dateStyle: "medium",
                          })}
                        </span>
                      )}
                      <span className="ml-auto">
                        Last updated: {""}  
                        {new Date(updatedAt).toLocaleDateString("en-US", {
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
                pageSize={FIXED_LIMIT}
                total={totalBlogs}
                onChange={(page, pageSize) => {
                  setCurrentPage(page)
                  setItemsPerPage(pageSize)
                }}
                showTotal={(total) => `Total ${total} blogs`}
                responsive={true}
                disabled={isLoading}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MyProjects