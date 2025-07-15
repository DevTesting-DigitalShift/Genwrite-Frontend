import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import SkeletonLoader from "./SkeletonLoader"
import { Badge, Button, Input, Popconfirm, Tooltip, Select, Popover, Pagination } from "antd"
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
import { getAllBlogs } from "@api/blogApi"

const MyProjects = () => {
  const [blogsData, setBlogsData] = useState([])
  const [filteredBlogs, setFilteredBlogs] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [loading, setLoading] = useState(true)
  const [sortType, setSortType] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [statusFilter, setStatusFilter] = useState("all")
  const navigate = useNavigate()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [funnelMenuOpen, setFunnelMenuOpen] = useState(false)
  const [isSearchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchType, setSearchType] = useState("title")
  const [isSearchModalOpen, setSearchModalOpen] = useState(false)
  const { handlePopup } = useConfirmPopup()
  const dispatch = useDispatch()
  const TRUNCATE_LENGTH = 120
  const PAGE_SIZE = 15
  const { blogs } = useSelector((state) => state.blog)

  console.log({blogs})

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  const toggleSearch = () => setSearchModalOpen(true)
  const toggleMenu = () => {
    setMenuOpen((prev) => {
      if (!prev) setFunnelMenuOpen(false) // close funnel if opening menu
      return !prev
    })
  }

  const toggleFunnelMenu = () => {
    setFunnelMenuOpen((prev) => {
      if (!prev) setMenuOpen(false) // close menu if opening funnel
      return !prev
    })
  }

  const resetFilters = () => {
    setSortOrder("")
    setSortType("")
    setStatusFilter("all")
  }

  const handleSearch = () => {
    setSearchTerm("")
    setDebouncedSearch("")
    setSearchOpen(false)
  }

  const handleSearchModalOk = () => {
    setSearchOpen(true)
    setSearchModalOpen(false)
  }

  const handleSearchModalCancel = () => {
    setSearchModalOpen(false)
  }

  useEffect(() => {
    dispatch(fetchAllBlogs())
  }, [])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const filteredBlogs = blogs.data.filter((blog) => !blog.isArchived)
      setBlogsData(filteredBlogs)

      applySortAndFilter(
        filteredBlogs,
        sortType,
        sortOrder,
        debouncedSearch,
        searchType,
        statusFilter
      )
    } catch (error) {
      console.error("Error fetching blogs:", error.message || "Failed to fetch blogs")
    } finally {
      setLoading(false)
    }
  }

  const applySortAndFilter = (blogs, sortBy, order, search, searchType, status) => {
    let sortedBlogs = [...blogs]

    // Apply status filter
    if (status !== "all") {
      sortedBlogs = sortedBlogs.filter((blog) => blog.status.toLowerCase() === status.toLowerCase())
    }

    // Apply search filter
    if (search) {
      sortedBlogs = sortedBlogs.filter((blog) => {
        if (searchType === "title") {
          return blog.title.toLowerCase().includes(search.toLowerCase())
        } else {
          return (
            blog.focusKeywords &&
            blog.focusKeywords.some((keyword) =>
              keyword.toLowerCase().includes(search.toLowerCase())
            )
          )
        }
      })
    }

    // Apply sorting
    sortedBlogs.sort((a, b) => {
      if (sortBy === "az") {
        return order === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      } else {
        return order === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

    setFilteredBlogs(sortedBlogs)
    setCurrentPage(1)
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 400)

    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    fetchBlogs()
  }, [])

  useEffect(() => {
    applySortAndFilter(blogsData, sortType, sortOrder, debouncedSearch, searchType, statusFilter)
  }, [blogsData, sortType, sortOrder, debouncedSearch, searchType, statusFilter])

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

  const handleBlogClick = (blog) => {
    navigate(`/toolbox/${blog._id}`)
  }

  const handleRetry = async (id) => {
    dispatch(retryBlog({ id }))
  }

  const truncateContent = (content, length = TRUNCATE_LENGTH) => {
    if (!content) return ""
    return content.length > length ? content.substring(0, length) + "..." : content
  }

  const totalPages = filteredBlogs.length
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentItems = filteredBlogs.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handleArchive = async (id) => {
    await dispatch(archiveBlog(id))
    setBlogsData((prev) => prev.filter((blog) => blog._id !== id))
  }

  const menuOptions = [
    {
      label: "A-Z (Ascending)",
      icon: <SortAscendingOutlined />,
      onClick: () => {
        setSortType("az")
        setSortOrder("asc")
        setMenuOpen(false)
      },
    },
    {
      label: "Z-A (Descending)",
      icon: <SortDescendingOutlined />,
      onClick: () => {
        setSortType("az")
        setSortOrder("desc")
        setMenuOpen(false)
      },
    },
    {
      label: "Created Date (Newest)",
      icon: <FieldTimeOutlined />,
      onClick: () => {
        setSortType("createdAt")
        setSortOrder("desc")
        setMenuOpen(false)
      },
    },
    {
      label: "Created Date (Oldest)",
      icon: <ClockCircleOutlined />,
      onClick: () => {
        setSortType("createdAt")
        setSortOrder("asc")
        setMenuOpen(false)
      },
    },
  ]

  const funnelMenuOptions = [
    {
      label: "Status: Completed",
      icon: <CheckCircleOutlined />,
      onClick: () => {
        setStatusFilter("complete")
        setFunnelMenuOpen(false)
      },
    },
    {
      label: "Status: Pending",
      icon: <HourglassOutlined />,
      onClick: () => {
        setStatusFilter("pending")
        setFunnelMenuOpen(false)
      },
    },
    {
      label: "Status: Failed",
      icon: <CloseCircleOutlined />,
      onClick: () => {
        setStatusFilter("failed")
        setFunnelMenuOpen(false)
      },
    },
  ]

  const handleRefresh = async () => {
    await fetchBlogs()
  }

  const stripMarkdown = (text) => {
    return text
      ?.replace(/<[^>]*>/g, "") // Remove HTML tags like <h1>, <p>, etc.
      ?.replace(/[\\*#=_~`>\-]+/g, "") // Remove markdown special characters
      ?.replace(/\s{2,}/g, " ") // Collapse multiple spaces
      ?.trim() // Trim leading/trailing whitespace
  }

  return (
    <div className="p-5">
      <Helmet>
        <title>Blogs | GenWrite</title>
      </Helmet>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title and Description */}
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

        {currentItems.length !== 0 && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/blog-editor"
              className="flex items-center gap-2 px-4 py-2 bg-[#1B6FC9]  hover:bg-[#1B6FC9]/90 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Blog
            </Link>
          </motion.div>
        )}
      </div>

      {/* Actions: Search, Filters, and New Blog */}
      <div className="flex items-center gap-3 justify-end mb-5">
        {/* Search Popover */}
        <Popover
          content={
            <div className="flex flex-col gap-3 w-72 p-3">
              <Select
                defaultValue="title"
                onChange={(value) => setSearchType(value)}
                options={[
                  { value: "title", label: "Search by Title" },
                  { value: "keywords", label: "Search by Focus Keywords" },
                ]}
                className="w-full"
              />
              <Input
                placeholder={`Search by ${searchType === "title" ? "title" : "focus keywords"}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={handleSearchModalOk}
                className="w-full"
              />
              <Button
                type="primary"
                onClick={handleSearchModalOk}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Search
              </Button>
            </div>
          }
          title="Search Blogs"
          trigger="click"
          placement="bottomRight"
          open={isSearchModalOpen}
          onOpenChange={(visible) => setSearchModalOpen(visible)}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Tooltip title="Search Blogs">
              {isSearchOpen ? (
                <Input
                  autoFocus
                  placeholder={`Search by ${
                    searchType === "title" ? "title" : "focus keywords"
                  }...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onPressEnter={handleSearchModalOk}
                  onBlur={() => setSearchOpen(false)}
                  className="w-48 rounded-lg border-gray-300 shadow-sm"
                />
              ) : (
                <Button
                  type="default"
                  icon={<Search className="w-4 h-4" />}
                  onClick={toggleSearch}
                  className="p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100"
                />
              )}
            </Tooltip>
          </motion.div>
        </Popover>

        {/* Refresh Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Tooltip title="Refresh">
            <Button
              type="default"
              icon={<RefreshCcw className="w-4 h-4" />}
              onClick={handleRefresh}
              className="p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100"
            />
          </Tooltip>
        </motion.div>

        {/* Sort Popover */}
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
            <Tooltip title="Sort Blogs">
              <Button
                type="default"
                icon={<ArrowDownUp className="w-4 h-4" />}
                onClick={toggleMenu}
                className="p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100"
              />
            </Tooltip>
          </motion.div>
        </Popover>

        {/* Filter Popover */}
        <Popover
          open={funnelMenuOpen}
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
            <Tooltip title="Filter Blogs">
              <Button
                type="default"
                icon={<Filter className="w-4 h-4" />}
                onClick={toggleFunnelMenu}
                className="p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100"
              />
            </Tooltip>
          </motion.div>
        </Popover>

        {/* Reset Filters Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Tooltip title="Reset Filters">
            <Button
              type="default"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={resetFilters}
              className="p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100"
            />
          </Tooltip>
        </motion.div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(itemsPerPage)].map((_, index) => (
            <div key={index} className="bg-white shadow-md rounded-xl p-4">
              <SkeletonLoader />
            </div>
          ))}
        </div>
      ) : currentItems.length === 0 ? (
        <div
          className="flex flex-col justify-center items-center"
          style={{ minHeight: "calc(100vh - 270px)" }}
        >
          <img src="Images/no-blog.png" alt="Trash" style={{ width: "8rem" }} />
          <p className="text-xl mt-5">No blogs available.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center p-2">
            {currentItems?.map((blog) => {
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
                          : status === "pending" || status === "in-progress"
                          ? "border-yellow-500"
                          : "border-green-500") + " border-2"
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
                        className="cursor-pointer"
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
                            {stripMarkdown(content) || ""}
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
                          <RotateCcw />
                        </Popconfirm>
                      )}
                      <Button
                        type="undefined"
                        className="p-2 hover:!border-red-500 hover:text-red-500"
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
                              type: "undefined",
                              className: "border-red-500 hover:bg-red-500 hover:text-white",
                            },
                            cancelProps: {
                              danger: false,
                            },
                          })
                        }
                      >
                        <Trash2 />
                      </Button>
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
          {totalPages > PAGE_SIZE && (
            <div className="flex justify-center mt-6">
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={totalPages}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                responsive={true}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MyProjects
