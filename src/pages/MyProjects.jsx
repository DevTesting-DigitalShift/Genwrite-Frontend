"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import SkeletonLoader from "../components/UI/SkeletonLoader"
import { Badge, Button, Input, Popconfirm, Tooltip, Popover, Pagination, message } from "antd"
import {
  ArrowDownUp,
  Calendar,
  Filter,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { motion } from "framer-motion"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import {
  CheckCircleOutlined,
  SortAscendingOutlined,
  HourglassOutlined,
  CloseCircleOutlined,
  SortDescendingOutlined,
  FieldTimeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons"
import { Helmet } from "react-helmet"
import { useDispatch, useSelector } from "react-redux"
import { selectUser } from "@store/slices/authSlice"
import { archiveBlog, fetchAllBlogs, retryBlog } from "@store/slices/blogSlice"
import dayjs from "dayjs"
import Fuse from "fuse.js"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getSocket } from "@utils/socket"
import isBetween from "dayjs/plugin/isBetween"
import clsx from "clsx"
import { debounce } from "lodash"
import DateRangePicker from "@components/UI/DateRangePicker"
import { useProAction } from "@/hook/useProAction"

dayjs.extend(isBetween)

const INITIAL_LIMIT = 100

const MyProjects = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useSelector(selectUser)
  const userId = user?.id || "guest"
  const { handleProAction } = useProAction()

  // Initialize filters from sessionStorage or default to "All" preset
  const initialFilters = JSON.parse(sessionStorage.getItem(`user_${userId}_filters`)) || {}
  const [filteredBlogs, setFilteredBlogs] = useState([])
  const [currentPage, setCurrentPage] = useState(initialFilters.currentPage || 1)
  const [itemsPerPage, setItemsPerPage] = useState(6) // Default for mobile
  const [sortType, setSortType] = useState(initialFilters.sortType || "updatedAt")
  const [sortOrder, setSortOrder] = useState(initialFilters.sortOrder || "desc")
  const [statusFilter, setStatusFilter] = useState(initialFilters.statusFilter || "all")
  const [dateRange, setDateRange] = useState([
    initialFilters.dateRangeStart ? dayjs(initialFilters.dateRangeStart) : null,
    initialFilters.dateRangeEnd ? dayjs(initialFilters.dateRangeEnd) : null,
  ])
  const [presetDateRange, setPresetDateRange] = useState([
    initialFilters.presetDateRangeStart
      ? dayjs(initialFilters.presetDateRangeStart)
      : dayjs().startOf("year").startOf("day"),
    initialFilters.presetDateRangeEnd
      ? dayjs(initialFilters.presetDateRangeEnd)
      : dayjs().endOf("day"),
  ])
  const [activePresetLabel, setActivePresetLabel] = useState(
    initialFilters.activePresetLabel || "All"
  )
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || "")
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isFunnelMenuOpen, setFunnelMenuOpen] = useState(false)
  const [isCustomDatePickerOpen, setIsCustomDatePickerOpen] = useState(false)
  const { handlePopup } = useConfirmPopup()
  const TRUNCATE_LENGTH = 120
  const [totalBlogs, setTotalBlogs] = useState(0)
  const [limit, setLimit] = useState(INITIAL_LIMIT)

  // Clear data on user change or logout
  useEffect(() => {
    if (!user) {
      sessionStorage.removeItem(`user_${userId}_filters`)
      queryClient.clear()
      setFilteredBlogs([])
      setCurrentPage(1)
      setSortType("updatedAt")
      setSortOrder("desc")
      setStatusFilter("all")
      setDateRange([null, null])
      setPresetDateRange([dayjs().startOf("year").startOf("day"), dayjs().endOf("day")])
      setActivePresetLabel("All")
      setSearchTerm("")
      setLimit(INITIAL_LIMIT)
    } else {
      queryClient.invalidateQueries({ queryKey: ["blogs", userId] })
    }
  }, [user, userId, queryClient])

  // Save filters to sessionStorage
  useEffect(() => {
    if (user) {
      const filters = {
        sortType,
        sortOrder,
        statusFilter,
        searchTerm,
        activePresetLabel,
        dateRangeStart: dateRange[0] ? dateRange[0].toISOString() : null,
        dateRangeEnd: dateRange[1] ? dateRange[1].toISOString() : null,
        presetDateRangeStart: presetDateRange[0] ? presetDateRange[0].toISOString() : null,
        presetDateRangeEnd: presetDateRange[1] ? presetDateRange[1].toISOString() : null,
        currentPage,
      }
      sessionStorage.setItem(`user_${userId}_filters`, JSON.stringify(filters))
    }
  }, [
    user,
    userId,
    sortType,
    sortOrder,
    statusFilter,
    searchTerm,
    dateRange,
    presetDateRange,
    activePresetLabel,
    currentPage,
  ])

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setSortType("updatedAt")
    setSortOrder("desc")
    setStatusFilter("all")
    setDateRange([null, null])
    setPresetDateRange([dayjs().startOf("year").startOf("day"), dayjs().endOf("day")])
    setActivePresetLabel("All")
    setSearchTerm("")
    setCurrentPage(1)
    setLimit(INITIAL_LIMIT)
    sessionStorage.removeItem(`user_${userId}_filters`)
    queryClient.invalidateQueries({ queryKey: ["blogs", userId] })
  }, [userId, queryClient])

  // Clear search term
  const clearSearch = useCallback(() => {
    setSearchTerm("")
    setCurrentPage(1)
  }, [])

  // Check for active filters
  const isDefaultSort = sortType === "updatedAt" && sortOrder === "desc"
  const hasActiveFilters = useMemo(
    () =>
      searchTerm ||
      !isDefaultSort ||
      statusFilter !== "all" ||
      dateRange[0] ||
      (presetDateRange[0] && !presetDateRange[0].isSame(dayjs().startOf("year").startOf("day"))),
    [searchTerm, isDefaultSort, statusFilter, dateRange, presetDateRange]
  )

  // Get current sort label
  const getCurrentSortLabel = useCallback(() => {
    if (sortType === "title" && sortOrder === "asc") return "A-Z"
    if (sortType === "title" && sortOrder === "desc") return "Z-A"
    if (sortType === "createdAt" && sortOrder === "desc") return "Newest"
    if (sortType === "createdAt" && sortOrder === "asc") return "Oldest"
    return "Recently Updated"
  }, [sortType, sortOrder])

  // Get current status label
  const getCurrentStatusLabel = useCallback(() => {
    switch (statusFilter) {
      case "complete":
        return "Completed"
      case "pending":
        return "Pending"
      case "failed":
        return "Failed"
      default:
        return "All"
    }
  }, [statusFilter])

  // Get current date label
  const getCurrentDateLabel = useCallback(() => {
    if (activePresetLabel) return activePresetLabel
    if (dateRange[0] && dateRange[1]) {
      return `${dayjs(dateRange[0]).format("MMM DD")} - ${dayjs(dateRange[1]).format("MMM DD")}`
    }
    return "All Dates"
  }, [activePresetLabel, dateRange])

  // Fetch blogs with optimized query
  const fetchBlogsQuery = useCallback(async () => {
    const queryParams = {
      start: dateRange[0]
        ? dayjs(dateRange[0]).startOf("day").toISOString()
        : presetDateRange[0]
        ? dayjs(presetDateRange[0]).startOf("day").toISOString()
        : undefined,
      end: dateRange[1]
        ? dayjs(dateRange[1]).endOf("day").toISOString()
        : presetDateRange[1]
        ? dayjs(presetDateRange[1]).endOf("day").toISOString()
        : undefined,
      limit,
    }
    const response = await dispatch(fetchAllBlogs(queryParams)).unwrap()
    return response.data || []
  }, [dispatch, dateRange, presetDateRange, limit])

  const {
    data: allBlogs = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "blogs",
      userId,
      dateRange[0]?.toISOString() ?? null,
      dateRange[1]?.toISOString() ?? null,
      presetDateRange[0]?.toISOString() ?? null,
      presetDateRange[1]?.toISOString() ?? null,
      limit,
    ],
    queryFn: fetchBlogsQuery,
    staleTime: Infinity, // Data never becomes stale
    gcTime: Infinity, // Cache persists for the session
    refetchOnMount: false, // Prevent refetch on component mount
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    enabled: !!user, // Only fetch if user is logged in
    onError: (error) => {
      console.error("Failed to fetch blogs:", {
        error: error.message,
        status: error.status,
        response: error.response,
      })
      message.error("Failed to load blogs. Please try again.")
    },
  })

  // Socket for real-time updates
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !user) return

    const handleBlogChange = (data, eventType) => {
      console.debug(`Blog event: ${eventType}`, data)
      if (eventType === "blog:deleted" || eventType === "blog:archived") {
        // Remove from cache if deleted or archived
        queryClient.setQueryData(
          [
            "blogs",
            userId,
            dateRange[0]?.toISOString() ?? null,
            dateRange[1]?.toISOString() ?? null,
            presetDateRange[0]?.toISOString() ?? null,
            presetDateRange[1]?.toISOString() ?? null,
            limit,
          ],
          (old = []) => old.filter((blog) => blog._id !== data.blogId)
        )
        queryClient.invalidateQueries({ queryKey: ["blog", data.blogId] })
      } else {
        // Update or add the blog in the list cache
        queryClient.setQueryData(
          [
            "blogs",
            userId,
            dateRange[0]?.toISOString() ?? null,
            dateRange[1]?.toISOString() ?? null,
            presetDateRange[0]?.toISOString() ?? null,
            presetDateRange[1]?.toISOString() ?? null,
            limit,
          ],
          (old = []) => {
            const index = old.findIndex((blog) => blog._id === data.blogId)
            if (index > -1) {
              old[index] = { ...old[index], ...data }
              return [...old]
            } else {
              // If new blog and within date range, add it
              const blogDate = dayjs(data.updatedAt || data.createdAt)
              const start = dateRange[0] || presetDateRange[0]
              const end = dateRange[1] || presetDateRange[1]
              if (!start || !end || blogDate.isBetween(start, end, "day", "[]")) {
                return [data, ...old]
              }
              return old
            }
          }
        )
        // Update single blog query if exists
        queryClient.setQueryData(["blog", data.blogId], (old) => ({ ...old, ...data }))
      }
    }

    socket.on("blog:statusChanged", (data) => handleBlogChange(data, "blog:statusChanged"))
    socket.on("blog:updated", (data) => handleBlogChange(data, "blog:updated"))
    socket.on("blog:deleted", (data) => handleBlogChange(data, "blog:deleted"))
    socket.on("blog:archived", (data) => handleBlogChange(data, "blog:archived"))

    return () => {
      socket.off("blog:statusChanged")
      socket.off("blog:updated")
      socket.off("blog:deleted")
      socket.off("blog:archived")
    }
  }, [queryClient, user, userId, dateRange, presetDateRange, limit])

  // Retry and archive mutations
  const retryMutation = useMutation({
    mutationFn: (id) => dispatch(retryBlog({ id })).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs", userId], exact: false })
    },
    onError: (error) => {
      console.error("Failed to retry blog:", error)
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id) => dispatch(archiveBlog(id)).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs", userId], exact: false })
    },
    onError: (error) => {
      console.error("Failed to archive blog:", error)
    },
  })

  // Fuse.js for search
  const fuse = useMemo(() => {
    return new Fuse(allBlogs, {
      keys: [
        { name: "title", weight: 0.5 },
        { name: "content", weight: 0.3 },
        { name: "focusKeywords", weight: 0.2 },
      ],
      threshold: 0.3,
      includeScore: true,
      shouldSort: true,
    })
  }, [allBlogs])

  // Debounced search handler
  const debouncedSetSearchTerm = useMemo(
    () =>
      debounce((value) => {
        setSearchTerm(value)
        setCurrentPage(1)
      }, 300),
    []
  )

  // Filtered and sorted blogs
  const filteredBlogsData = useMemo(() => {
    let result = allBlogs

    if (searchTerm.trim()) {
      result = fuse.search(searchTerm).map(({ item }) => item)
    }

    if (statusFilter !== "all") {
      result = result.filter((blog) => blog.status === statusFilter)
    }

    const sortedResult = [...result]
    if (sortType === "title") {
      sortedResult.sort((a, b) =>
        sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      )
    } else if (sortType === "updatedAt") {
      sortedResult.sort((a, b) =>
        sortOrder === "asc"
          ? new Date(a.updatedAt) - new Date(b.updatedAt)
          : new Date(b.updatedAt) - new Date(a.updatedAt)
      )
    } else if (sortType === "createdAt") {
      sortedResult.sort((a, b) =>
        sortOrder === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt)
      )
    }

    return {
      blogs: sortedResult.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
      total: sortedResult.length,
    }
  }, [allBlogs, searchTerm, statusFilter, sortType, sortOrder, currentPage, itemsPerPage, fuse])

  useEffect(() => {
    setFilteredBlogs(filteredBlogsData.blogs)
    setTotalBlogs(filteredBlogsData.total)
  }, [filteredBlogsData])

  // Responsive items per page with debounced resize handler
  useEffect(() => {
    const updateItemsPerPage = debounce(() => {
      if (window.innerWidth >= 1024) {
        setItemsPerPage(15)
      } else if (window.innerWidth >= 768) {
        setItemsPerPage(12)
      } else {
        setItemsPerPage(6)
      }
      setCurrentPage(1)
    }, 200)

    updateItemsPerPage()
    window.addEventListener("resize", updateItemsPerPage)
    return () => {
      window.removeEventListener("resize", updateItemsPerPage)
      updateItemsPerPage.cancel()
    }
  }, [])

  // Navigation handlers
  const handleBlogClick = useCallback(
    (blog) => {
      navigate(`/toolbox/${blog._id}`)
    },
    [navigate]
  )

  const handleManualBlogClick = useCallback(
    (blog) => {
      navigate(`/blog-editor/${blog._id}`)
    },
    [navigate]
  )

  const handleRetry = useCallback(
    (id) => {
      retryMutation.mutate(id)
    },
    [retryMutation]
  )

  const handleArchive = useCallback(
    (id) => {
      archiveMutation.mutate(id)
    },
    [archiveMutation]
  )

  // Utility functions
  const truncateContent = useCallback((content, length = TRUNCATE_LENGTH) => {
    if (!content) return ""
    return content.length > length ? content.substring(0, length) + "..." : content
  }, [])

  const stripMarkdown = useCallback((text) => {
    return text
      ?.replace(/<[^>]*>/g, "")
      ?.replace(/[\\*#=_~`>\-]+/g, "")
      ?.replace(/\s{2,}/g, " ")
      ?.trim()
  }, [])

  // Menu options
  const menuOptions = useMemo(
    () => [
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
        label: "Newest Blog",
        icon: <ArrowUpOutlined />,
        onClick: () => {
          setSortType("createdAt")
          setSortOrder("desc")
          setMenuOpen(false)
          setCurrentPage(1)
        },
      },
      {
        label: "Oldest Blog",
        icon: <ArrowDownOutlined />,
        onClick: () => {
          setSortType("createdAt")
          setSortOrder("asc")
          setMenuOpen(false)
          setCurrentPage(1)
        },
      },
    ],
    []
  )

  // Funnel menu options
  const funnelMenuOptions = useMemo(
    () => [
      {
        label: "All Status",
        icon: <CheckCircleOutlined />,
        onClick: () => {
          setStatusFilter("all")
          setFunnelMenuOpen(false)
          setCurrentPage(1)
        },
      },
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
    ],
    []
  )

  // Date presets
  const datePresets = useMemo(
    () => [
      {
        label: "Last 7 Days",
        value: [dayjs().subtract(7, "days").startOf("day"), dayjs().endOf("day")],
        onClick: () => {
          setPresetDateRange([dayjs().subtract(7, "days").startOf("day"), dayjs().endOf("day")])
          setDateRange([null, null])
          setActivePresetLabel("Last 7 Days")
          setCurrentPage(1)
          setIsCustomDatePickerOpen(false)
          setLimit(INITIAL_LIMIT)
        },
      },
      {
        label: "Last 30 Days",
        value: [dayjs().subtract(30, "days").startOf("day"), dayjs().endOf("day")],
        onClick: () => {
          setPresetDateRange([dayjs().subtract(30, "days").startOf("day"), dayjs().endOf("day")])
          setDateRange([null, null])
          setActivePresetLabel("Last 30 Days")
          setCurrentPage(1)
          setIsCustomDatePickerOpen(false)
          setLimit(INITIAL_LIMIT)
        },
      },
      {
        label: "Last 3 Months",
        value: [dayjs().subtract(3, "months").startOf("day"), dayjs().endOf("day")],
        onClick: () => {
          setPresetDateRange([dayjs().subtract(3, "months").startOf("day"), dayjs().endOf("day")])
          setDateRange([null, null])
          setActivePresetLabel("Last 3 Months")
          setCurrentPage(1)
          setIsCustomDatePickerOpen(false)
          setLimit(INITIAL_LIMIT)
        },
      },
      {
        label: "Last 6 Months",
        value: [dayjs().subtract(6, "months").startOf("day"), dayjs().endOf("day")],
        onClick: () => {
          setPresetDateRange([dayjs().subtract(6, "months").startOf("day"), dayjs().endOf("day")])
          setDateRange([null, null])
          setActivePresetLabel("Last 6 Months")
          setCurrentPage(1)
          setIsCustomDatePickerOpen(false)
          setLimit(INITIAL_LIMIT)
        },
      },
      {
        label: "All",
        value: [dayjs().startOf("year").startOf("day"), dayjs().endOf("day")],
        onClick: () => {
          setPresetDateRange([dayjs().startOf("year").startOf("day"), dayjs().endOf("day")])
          setDateRange([null, null])
          setActivePresetLabel("All")
          setCurrentPage(1)
          setIsCustomDatePickerOpen(false)
          setLimit(INITIAL_LIMIT)
        },
      },
    ],
    []
  )

  return (
    <div className="p-2 md:p-4 lg:p-8 max-w-full">
      <Helmet>
        <title>Blogs | GenWrite</title>
      </Helmet>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1 mt-5 p-2 md:mt-0 md:p-0">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Blogs Generated
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-gray-500 text-sm mt-2 max-w-md"
          >
            All our blogs in one place. Explore insights, tips, and strategies to level up your
            content creation.
          </motion.p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <div
            onClick={() => {
              handleProAction(() => {
                navigate("/blog-editor") // only runs for Pro users
              })
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium cursor-pointer"
          >
            <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
            New Blog
          </div>
        </motion.div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6 rounded-lg mb-6">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative w-full">
            <input
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => debouncedSetSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 py-2"
              aria-label="Search blogs"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            {searchTerm && (
              <X
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 cursor-pointer"
                onClick={clearSearch}
              />
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          {/* Sort */}
          <Popover
            open={isMenuOpen}
            onOpenChange={(visible) => setMenuOpen(visible)}
            trigger="click"
            placement="bottomRight"
            content={
              <div className="min-w-[180px] sm:min-w-[200px] rounded-lg space-y-1">
                {menuOptions.map(({ label, icon, onClick }) => (
                  <Tooltip title={label} placement="left" key={label}>
                    <button
                      onClick={onClick}
                      className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-base sm:text-lg">{icon}</span>
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
                icon={<ArrowDownUp className="w-4 sm:w-5 h-4 sm:h-5" />}
                className={`p-2 sm:p-3 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 w-full sm:w-auto text-xs sm:text-sm ${
                  !isDefaultSort ? "border-blue-400 bg-blue-50 text-blue-600" : ""
                }`}
              >
                Sort: {getCurrentSortLabel()}
              </Button>
            </motion.div>
          </Popover>

          {/* Filter */}
          <Popover
            open={isFunnelMenuOpen}
            onOpenChange={(visible) => setFunnelMenuOpen(visible)}
            trigger="click"
            placement="bottomRight"
            content={
              <div className="min-w-[180px] sm:min-w-[200px] rounded-lg space-y-1">
                {funnelMenuOptions.map(({ label, icon, onClick }) => (
                  <Tooltip title={label} placement="left" key={label}>
                    <button
                      onClick={onClick}
                      className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-base sm:text-lg">{icon}</span>
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
                icon={<Filter className="w-4 sm:w-5 h-4 sm:h-5" />}
                className={`p-2 sm:p-3 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 w-full sm:w-auto text-xs sm:text-sm ${
                  statusFilter !== "all" ? "border-green-400 bg-green-50 text-green-600" : ""
                }`}
              >
                Filter: {getCurrentStatusLabel()}
              </Button>
            </motion.div>
          </Popover>

          {/* Date Preset */}
          <Popover
            open={isCustomDatePickerOpen}
            onOpenChange={(visible) => setIsCustomDatePickerOpen(visible)}
            trigger="click"
            placement="bottomRight"
            content={
              <div className="min-w-[180px] sm:min-w-[200px] rounded-lg space-y-1">
                {datePresets.map(({ label, onClick }) => (
                  <Tooltip title={label} placement="left" key={label}>
                    <button
                      onClick={onClick}
                      className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-base sm:text-lg">
                        <FieldTimeOutlined />
                      </span>
                      <span>{label}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            }
          ></Popover>

          {/* Refresh */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="default"
              icon={<RefreshCcw className="w-4 sm:w-5 h-4 sm:h-5" />}
              onClick={() => queryClient.invalidateQueries(["blogs", userId])}
              className="p-2 sm:p-3 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 w-full sm:w-auto text-xs sm:text-sm"
            >
              Refresh
            </Button>
          </motion.div>

          {/* Reset */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="default"
              icon={<RotateCcw className="w-4 sm:w-5 h-4 sm:h-5" />}
              onClick={resetFilters}
              className={`p-2 sm:p-3 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 w-full sm:w-auto text-xs sm:text-sm ${
                hasActiveFilters ? "border-red-400 bg-red-50 text-red-600" : ""
              }`}
            >
              Reset
            </Button>
          </motion.div>
        </div>

        <div className="flex-1">
          <DateRangePicker
            value={dateRange}
            minDate={user?.createdAt ? dayjs(user?.createdAt) : undefined}
            maxDate={dayjs()}
            onChange={(dates) => {
              setDateRange(
                dates
                  ? [dayjs(dates[0]).startOf("day"), dayjs(dates[1]).endOf("day")]
                  : [null, null]
              )
              setPresetDateRange([null, null])
              setActivePresetLabel("")
              setCurrentPage(1)
              setLimit(INITIAL_LIMIT)
            }}
            className={clsx(
              "w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-300 text-xs sm:text-sm",
              (dateRange[0] || presetDateRange[0]) && "!border-purple-400 !shadow-purple-100"
            )}
            format="YYYY-MM-DD"
            placeholder={["Start date", "End date"]}
            aria-label="Select date range"
          />
        </div>
      </div>

      {isLoading || isFetching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {[...Array(itemsPerPage)].map((_, index) => (
            <div key={index} className="bg-white shadow-md rounded-lg p-4 sm:p-6">
              <SkeletonLoader />
            </div>
          ))}
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div
          className="flex flex-col justify-center items-center"
          style={{ minHeight: "calc(100vh - 270px)" }}
        >
          <img src="Images/no-blog.png" alt="No blogs" className="w-20 sm:w-24" />
          <p className="text-lg sm:text-xl mt-5">No blogs available.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 place-items-center p-2">
            {filteredBlogs.map((blog) => {
              const isManualEditor = blog.isManuallyEdited === true
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
                    <span className="flex items-center justify-center gap-1 py-1 font-medium tracking-wide text-xs sm:text-sm">
                      {isManualEditor ? (
                        <>Manually Generated</>
                      ) : (
                        <>
                          <img
                            src={`./Images/${
                              isGemini ? "gemini" : aiModel === "claude" ? "claude" : "chatgpt"
                            }.png`}
                            alt={isGemini ? "Gemini" : aiModel === "claude" ? "Claude" : "ChatGPT"}
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
                      {new Date(createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                    </div>

                    {isManualEditor ? (
                      <div
                        className="cursor-pointer"
                        onClick={() => handleManualBlogClick(blog)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && handleManualBlogClick(blog)}
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

                    <div className="flex items-center justify-end gap-2">
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
                      {status === "failed" && (
                        <Button
                          type="text"
                          className="p-2 hover:!border-blue-500 hover:text-blue-500"
                          aria-label="Regenerate Blog"
                          onClick={() =>
                            handlePopup({
                              title: "Regenerate Blog",
                              description: (
                                <span className="my-2">
                                  Are you sure you want to retry generating <b>{title}</b> blog?
                                </span>
                              ),
                              confirmText: "Yes",
                              onConfirm: () => {
                                handleRetry(_id)
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
                          <RotateCcw className="w-4 sm:w-5 h-4 sm:h-5" />
                        </Button>
                      )}
                      <Button
                        type="text"
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
                              type: "text",
                              className: "border-red-500 hover:bg-red-500 bg-red-100 text-red-600",
                            },
                            cancelProps: {
                              danger: false,
                            },
                          })
                        }
                        aria-label={`Move blog ${title} to trash`}
                      >
                        <Trash2 className="w-4 sm:w-5 h-4 sm:h-5" />
                      </Button>
                    </div>

                    <div className="mt-3 -mb-2 flex justify-end text-xs sm:text-sm text-right text-gray-500 font-medium">
                      {wordpress?.postedOn && (
                        <span className="">
                          Posted on:{" "}
                          {new Date(wordpress.postedOn).toLocaleDateString("en-US", {
                            dateStyle: "medium",
                          })}
                        </span>
                      )}
                      <span className="ml-auto">
                        Last updated:{" "}
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
          {totalBlogs > itemsPerPage && (
            <div className="flex justify-center mt-6 sm:mt-8">
              <Pagination
                current={currentPage}
                total={totalBlogs}
                pageSize={itemsPerPage}
                onChange={(page, pageSize) => {
                  setCurrentPage(page)
                  if (pageSize !== itemsPerPage) {
                    setItemsPerPage(pageSize)
                    setCurrentPage(1)
                  }
                }}
                showTotal={(total) => `Total ${total} blogs`}
                responsive={true}
                showSizeChanger={false}
                pageSizeOptions={["6", "12", "15"]}
                disabled={isLoading || isFetching}
                className="text-xs sm:text-sm"
              />
            </div>
          )}
          {allBlogs.length === limit &&
            limit !== -1 &&
            currentPage === Math.ceil(totalBlogs / itemsPerPage) && (
              <div className="flex justify-center mt-4">
                <Button
                  onClick={() => setLimit((prev) => prev + INITIAL_LIMIT)}
                  disabled={isLoading || isFetching}
                >
                  Load More
                </Button>
              </div>
            )}
        </>
      )}
    </div>
  )
}

export default MyProjects
