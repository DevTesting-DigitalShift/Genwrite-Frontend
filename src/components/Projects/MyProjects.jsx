import { useState, useEffect, useCallback, useMemo } from "react"
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
  ClockCircleOutlined,
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
<<<<<<< HEAD
import isBetween from "dayjs/plugin/isBetween"
import clsx from "clsx"
import DateRangePicker from "@components/UI/DateRangePicker"

dayjs.extend(isBetween)
=======
import isBetween from "dayjs/plugin/isBetween";
import clsx from "clsx"
import DateRangePicker from "@components/UI/DateRangePicker"

// Add plugin before using
dayjs.extend(isBetween);
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e

const { RangePicker } = DatePicker

const MyProjects = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useSelector(selectUser)
  const userId = user?.id || "guest"

<<<<<<< HEAD
  const initialFilters = JSON.parse(sessionStorage.getItem(`user_${userId}_filters`)) || {}
  const [filteredBlogs, setFilteredBlogs] = useState([])
  const [currentPage, setCurrentPage] = useState(initialFilters.currentPage || 1)
  const [itemsPerPage, setItemsPerPage] = useState(6) // Default for mobile
=======
  // Initialize state from single sessionStorage object
  const initialFilters = JSON.parse(sessionStorage.getItem(`user_${userId}_filters`)) || {}
  const [filteredBlogs, setFilteredBlogs] = useState([])
  const [currentPage, setCurrentPage] = useState(initialFilters.currentPage || 1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
  const [sortType, setSortType] = useState(initialFilters.sortType || "updatedAt")
  const [sortOrder, setSortOrder] = useState(initialFilters.sortOrder || "desc")
  const [statusFilter, setStatusFilter] = useState(initialFilters.statusFilter || "all")
  const [dateRange, setDateRange] = useState([
    initialFilters.dateRangeStart ? dayjs(initialFilters.dateRangeStart) : null,
    initialFilters.dateRangeEnd ? dayjs(initialFilters.dateRangeEnd) : null,
  ])
  const [presetDateRange, setPresetDateRange] = useState([
    initialFilters.presetDateRangeStart ? dayjs(initialFilters.presetDateRangeStart) : null,
    initialFilters.presetDateRangeEnd ? dayjs(initialFilters.presetDateRangeEnd) : null,
  ])
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || "")
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isFunnelMenuOpen, setFunnelMenuOpen] = useState(false)
  const [isCustomDatePickerOpen, setIsCustomDatePickerOpen] = useState(false)
  const [activePresetLabel, setActivePresetLabel] = useState(
    initialFilters.activePresetLabel || "Last 7 Days"
  )
  const { handlePopup } = useConfirmPopup()
  const TRUNCATE_LENGTH = 120
  const [totalBlogs, setTotalBlogs] = useState(0)
<<<<<<< HEAD

  useEffect(() => {
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
  }, [
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  const resetFilters = useCallback(() => {
    setSortType("updatedAt")
    setSortOrder("desc")
    setStatusFilter("all")
    setDateRange([null, null])
    setPresetDateRange([null, null])
    setActivePresetLabel("Last 7 days")
    setSearchTerm("")
    setCurrentPage(1)
    sessionStorage.removeItem(`user_${userId}_filters`)
  }, [userId])

  const clearSearch = useCallback(() => {
    setSearchTerm("")
    setCurrentPage(1)
  }, [])

  const isDefaultSort = sortType === "updatedAt" && sortOrder === "desc"
  const hasActiveFilters = useMemo(
    () =>
      searchTerm || !isDefaultSort || statusFilter !== "all" || dateRange[0] || presetDateRange[0],
    [searchTerm, isDefaultSort, statusFilter, dateRange, presetDateRange]
  )

  const getCurrentSortLabel = useCallback(() => {
    if (sortType === "title" && sortOrder === "asc") return "A-Z"
    if (sortType === "title" && sortOrder === "desc") return "Z-A"
    if (sortType === "updatedAt" && sortOrder === "desc") return "Recently Updated"
    if (sortType === "updatedAt" && sortOrder === "asc") return "Oldest Updated"
    if (sortType === "createdAt" && sortOrder === "desc") return "Newest"
    if (sortType === "createdAt" && sortOrder === "asc") return "Oldest"
    return "Recently Updated"
  }, [sortType, sortOrder])

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

  const getCurrentDateLabel = useCallback(() => {
    if (activePresetLabel) return activePresetLabel
    if (dateRange[0] && dateRange[1]) {
      return `${dayjs(dateRange[0]).format("MMM DD")} - ${dayjs(dateRange[1]).format("MMM DD")}`
    }
    return "All Dates"
  }, [activePresetLabel, dateRange])

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
    }
    const response = await dispatch(fetchAllBlogs(queryParams)).unwrap()
    return response.data || []
  }, [dispatch, dateRange, presetDateRange])

  const { data: allBlogs = [], isLoading } = useQuery({
    queryKey: [
      "blogs",
      dateRange[0]?.toISOString() ?? null,
      dateRange[1]?.toISOString() ?? null,
      presetDateRange[0]?.toISOString() ?? null,
      presetDateRange[1]?.toISOString() ?? null,
    ],
    queryFn: fetchBlogsQuery,
    onError: (error) => {
      console.error("Failed to fetch blogs:", {
        error: error.message,
        status: error.status,
        response: error.response,
      })
      message.error("Failed to load blogs. Please try again.")
    },
  })

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    socket.on("blog:statusChanged", (data) => {
      console.debug("Blog status changed:", data)
      queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false })
    })

    return () => {
      socket.off("blog:statusChanged")
    }
  }, [queryClient])

  const retryMutation = useMutation({
    mutationFn: (id) => dispatch(retryBlog({ id })).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false })
      message.success("Blog retry initiated.")
    },
    onError: (error) => {
      console.error("Failed to retry blog:", error)
      message.error("Failed to retry blog.")
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id) => dispatch(archiveBlog(id)).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false })
    },
    onError: (error) => {
      console.error("Failed to archive blog:", error)
      message.error("Failed to archive blog.")
    },
  })

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
  }, [
    allBlogs,
    searchTerm,
    statusFilter,
    dateRange,
    presetDateRange,
    sortType,
    sortOrder,
    currentPage,
    itemsPerPage,
    fuse,
  ])

  useEffect(() => {
    setFilteredBlogs(filteredBlogsData.blogs)
    setTotalBlogs(filteredBlogsData.total)
  }, [filteredBlogsData])
=======

  // Persist all filters to single sessionStorage object
  useEffect(() => {
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
  }, [
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

  // Reset filters
  const resetFilters = useCallback(() => {
    setSortType("updatedAt")
    setSortOrder("desc")
    setStatusFilter("all")
    setDateRange([null, null])
    setPresetDateRange([null, null])
    setActivePresetLabel("Last 7 days")
    setSearchTerm("")
    setCurrentPage(1)
    sessionStorage.removeItem(`user_${userId}_filters`)
  }, [userId])

  const clearSearch = useCallback(() => {
    setSearchTerm("")
    setCurrentPage(1)
  }, [])

  // Check if filters are active
  const isDefaultSort = sortType === "updatedAt" && sortOrder === "desc"
  const hasActiveFilters = useMemo(
    () =>
      searchTerm || !isDefaultSort || statusFilter !== "all" || dateRange[0] || presetDateRange[0],
    [searchTerm, isDefaultSort, statusFilter, dateRange, presetDateRange]
  )

  // Get current sort label
  const getCurrentSortLabel = useCallback(() => {
    if (sortType === "title" && sortOrder === "asc") return "A-Z"
    if (sortType === "title" && sortOrder === "desc") return "Z-A"
    if (sortType === "updatedAt" && sortOrder === "desc") return "Recently Updated"
    if (sortType === "updatedAt" && sortOrder === "asc") return "Oldest Updated"
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

  // TanStack Query: Fetch blogs
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
        : undefined
    }
    const response = await dispatch(fetchAllBlogs(queryParams)).unwrap()
    return response.data || []
  }, [dispatch, dateRange, presetDateRange])

  const { data: allBlogs = [], isLoading } = useQuery({
    queryKey: [
      "blogs",
      dateRange[0]?.toISOString() ?? null,
      dateRange[1]?.toISOString() ?? null,
      presetDateRange[0]?.toISOString() ?? null,
      presetDateRange[1]?.toISOString() ?? null,
    ],
    queryFn: fetchBlogsQuery,
    // staleTime: 10 * 60 * 1000, // 10 minutes
    // cacheTime: 15 * 60 * 1000, // 15 minutes
    onError: (error) => {
      console.error("Failed to fetch blogs:", {
        error: error.message,
        status: error.status,
        response: error.response,
      })
      message.error("Failed to load blogs. Please try again.")
    },
  })

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e

    socket.on("blog:statusChanged", (data) => {
      console.debug("Blog status changed:", data)
      // Optionally, you can trigger a refetch or update the UI based on the new status
      queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false })
    })

    return () => {
      socket.off("blog:statusChanged")
    }
  }, [])

  // TanStack Query: Retry mutation
  const retryMutation = useMutation({
    mutationFn: (id) => dispatch(retryBlog({ id })).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false })
      message.success("Blog retry initiated.")
    },
    onError: (error) => {
      console.error("Failed to retry blog:", error)
      message.error("Failed to retry blog.")
    },
  })

  // TanStack Query: Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (id) => dispatch(archiveBlog(id)).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false })
    },
    onError: (error) => {
      console.error("Failed to archive blog:", error)
      message.error("Failed to archive blog.")
    },
  })

  // Fuse.js setup
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

  // Client-side filtered and searched data
  const filteredBlogsData = useMemo(() => {
    let result = allBlogs

    // Apply fuzzy search with Fuse.js
    if (searchTerm.trim()) {
      result = fuse.search(searchTerm).map(({ item }) => item)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((blog) => blog.status === statusFilter)
    }
    // Apply date range filter
    // if (dateRange[0] && dateRange[1]) {
    //   result = result.filter((blog) =>
    //     dayjs(blog.updatedAt).isBetween(
    //       dayjs(dateRange[0]).startOf("day"),
    //       dayjs(dateRange[1]).endOf("day"),
    //       null,
    //       "[]"
    //     )
    //   )
    // } else if (presetDateRange[0] && presetDateRange[1]) {
    //   result = result.filter((blog) =>
    //     dayjs(blog.updatedAt).isBetween(
    //       dayjs(presetDateRange[0]).startOf("day"),
    //       dayjs(presetDateRange[1]).endOf("day"),
    //       null,
    //       "[]"
    //     )
    //   )
    // }

    // console.log("Filtered blogs:", result)

    // Apply sorting
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
    }
     else if (sortType === "createdAt") {
      sortedResult.sort((a, b) =>
        sortOrder === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt)
      )
    }

    // Return both filtered blogs and total count
    return {
      blogs: sortedResult.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
      total: sortedResult.length,
    }
  }, [
    allBlogs,
    searchTerm,
    statusFilter,
    dateRange,
    presetDateRange,
    sortType,
    sortOrder,
    currentPage,
    itemsPerPage,
    fuse,
  ])

  // Update filteredBlogs and totalBlogs
  useEffect(() => {
    setFilteredBlogs(filteredBlogsData.blogs)
    setTotalBlogs(filteredBlogsData.total)
  }, [filteredBlogsData])

  // Responsive items per page
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerPage(15)
      } else if (window.innerWidth >= 768) {
        setItemsPerPage(12)
      } else {
        setItemsPerPage(6)
      }
      setCurrentPage(1)
    }

    updateItemsPerPage()
    window.addEventListener("resize", updateItemsPerPage)
    return () => window.removeEventListener("resize", updateItemsPerPage)
  }, [])

<<<<<<< HEAD
=======
  // Handle blog click
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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

<<<<<<< HEAD
=======
  // Handle retry
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
  const handleRetry = useCallback(
    (id) => {
      retryMutation.mutate(id)
    },
    [retryMutation]
  )

<<<<<<< HEAD
=======
  // Handle archive
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
  const handleArchive = useCallback(
    (id) => {
      archiveMutation.mutate(id)
    },
    [archiveMutation]
  )

<<<<<<< HEAD
=======
  // Truncate content
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
  const truncateContent = useCallback((content, length = TRUNCATE_LENGTH) => {
    if (!content) return ""
    return content.length > length ? content.substring(0, length) + "..." : content
  }, [])

<<<<<<< HEAD
=======
  // Strip markdown
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
  const stripMarkdown = useCallback((text) => {
    return text
      ?.replace(/<[^>]*>/g, "")
      ?.replace(/[\\*#=_~`>\-]+/g, "")
      ?.replace(/\s{2,}/g, " ")
      ?.trim()
  }, [])

<<<<<<< HEAD
=======
  // Menu options for sorting
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
        label: "Recently Updated",
        icon: <FieldTimeOutlined />,
        onClick: () => {
          setSortType("updatedAt")
          setSortOrder("desc")
          setMenuOpen(false)
          setCurrentPage(1)
        },
      },
      {
        label: "Oldest Updated",
        icon: <ClockCircleOutlined />,
        onClick: () => {
          setSortType("updatedAt")
          setSortOrder("asc")
          setMenuOpen(false)
          setCurrentPage(1)
        },
      },
      {
        label: "Newest",
        icon: <ArrowUpOutlined />,
        onClick: () => {
          setSortType("createdAt")
          setSortOrder("desc")
          setMenuOpen(false)
          setCurrentPage(1)
        },
      },
      {
        label: "Oldest",
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

<<<<<<< HEAD
=======
  // Filter options
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
  const funnelMenuOptions = useMemo(
    () => [
      {
        label: "All Statuses",
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

<<<<<<< HEAD
=======
  // Date range presets
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
        },
      },
      {
        label: "This Year",
        value: [dayjs().startOf("year").startOf("day"), dayjs().endOf("day")],
        onClick: () => {
          setPresetDateRange([dayjs().startOf("year").startOf("day"), dayjs().endOf("day")])
          setDateRange([null, null])
          setActivePresetLabel("This Year")
          setCurrentPage(1)
          setIsCustomDatePickerOpen(false)
        },
      },
    ],
    []
  )

  return (
<<<<<<< HEAD
    <div className="p-4 sm:p-6 md:p-8 max-w-full">
=======
    <div className="p-5">
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg mb-6">
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            prefix={<Search className="w-4 h-4 text-gray-500" />}
            suffix={
              searchTerm ? (
                <X className="w-4 h-4 text-gray-500 cursor-pointer" onClick={clearSearch} />
              ) : null
            }
            className="rounded-lg border-gray-300 shadow-sm"
            aria-label="Search blogs"
          />
        </div>
<<<<<<< HEAD
        <div className="flex flex-wrap gap-3 items-center">
          {/* Sort */}
=======
        <div className="flex gap-2 items-center">
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
<<<<<<< HEAD
=======
                      aria-label={`Sort by ${label}`}
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
<<<<<<< HEAD
                className={`p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 w-full sm:w-auto ${
                  !isDefaultSort ? "border-blue-400 bg-blue-50 text-blue-600" : ""
                }`}
=======
                className={`p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 ${
                  !isDefaultSort ? "border-blue-400 bg-blue-50 text-blue-600" : ""
                }`}
                aria-label="Open sort menu"
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
              >
                Sort: {getCurrentSortLabel()}
              </Button>
            </motion.div>
          </Popover>

<<<<<<< HEAD
          {/* Filter */}
=======
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
<<<<<<< HEAD
=======
                      aria-label={`Filter by ${label}`}
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
<<<<<<< HEAD
                className={`p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 w-full sm:w-auto ${
                  statusFilter !== "all" ? "border-green-400 bg-green-50 text-green-600" : ""
                }`}
=======
                className={`p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 ${
                  statusFilter !== "all" ? "border-green-400 bg-green-50 text-green-600" : ""
                }`}
                aria-label="Open filter menu"
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
              >
                Filter: {getCurrentStatusLabel()}
              </Button>
            </motion.div>
          </Popover>

<<<<<<< HEAD
          {/* Date Preset */}
=======
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
          <Popover
            open={isCustomDatePickerOpen}
            onOpenChange={(visible) => setIsCustomDatePickerOpen(visible)}
            trigger="click"
            placement="bottomRight"
            content={
              <div>
                {datePresets.map(({ label, onClick }) => (
                  <Tooltip title={label} placement="left" key={label}>
                    <button
                      onClick={onClick}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
<<<<<<< HEAD
=======
                      aria-label={`Filter by ${label}`}
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
                    >
                      <span className="text-lg">
                        <FieldTimeOutlined />
                      </span>
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
                icon={<Calendar className="w-4 h-4" />}
<<<<<<< HEAD
                className={`p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 w-full sm:w-auto ${
=======
                className={`p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 ${
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
                  dateRange[0] || presetDateRange[0]
                    ? "border-purple-400 bg-purple-50 text-purple-600"
                    : ""
                }`}
<<<<<<< HEAD
=======
                aria-label="Open date preset menu"
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
              >
                Date: {getCurrentDateLabel()}
              </Button>
            </motion.div>
          </Popover>

<<<<<<< HEAD
          {/* Refresh */}
=======
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="default"
              icon={<RefreshCcw className="w-4 h-4" />}
              onClick={() => queryClient.invalidateQueries(["blogs"])}
<<<<<<< HEAD
              className="p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 w-full sm:w-auto"
=======
              className="p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100"
              aria-label="Refresh blogs"
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
            >
              Refresh
            </Button>
          </motion.div>

<<<<<<< HEAD
          {/* Reset */}
=======
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="default"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={resetFilters}
<<<<<<< HEAD
              className={`p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 w-full sm:w-auto ${
                hasActiveFilters ? "border-red-400 bg-red-50 text-red-600" : ""
              }`}
=======
              className={`p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 ${
                hasActiveFilters ? "border-red-400 bg-red-50 text-red-600" : ""
              }`}
              aria-label="Reset filters"
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
            >
              Reset
            </Button>
          </motion.div>
        </div>
<<<<<<< HEAD

        <div className="flex-1">
          <RangePicker
            value={dateRange}
            minDate={user?.createdAt ? dayjs(user?.createdAt) : undefined}
            maxDate={dayjs()}
=======
        <div className="flex-1">
          <RangePicker
            value={dateRange}
            minDate = {user?.createdAt ? dayjs(user?.createdAt): undefined}
            maxDate = {dayjs()}
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
            onChange={(dates) => {
              setDateRange(
                dates
                  ? [dayjs(dates[0]).startOf("day"), dayjs(dates[1]).endOf("day")]
                  : [null, null]
              )
              setPresetDateRange([null, null])
              setActivePresetLabel("")
              setCurrentPage(1)
            }}
<<<<<<< HEAD
            className={clsx(
              "w-full rounded-lg border-gray-300 shadow-sm",
              (dateRange[0] || presetDateRange[0]) && "!border-purple-400 !shadow-purple-100"
=======
            className={clsx("w-full rounded-lg border-gray-300 shadow-sm",
              (dateRange[0] || presetDateRange[0]) &&  "!border-purple-400 !shadow-purple-100"
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
            )}
            format="YYYY-MM-DD"
            placeholder={["Start date", "End date"]}
            aria-label="Select date range"
<<<<<<< HEAD
          />
=======
            />
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
        </div>
      </div>

      {isLoading ? (
<<<<<<< HEAD
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
=======
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
<<<<<<< HEAD
          <img src="Images/no-blog.png" alt="No blogs" className="w-20 sm:w-24" />
          <p className="text-lg sm:text-xl mt-5">No blogs available.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 place-items-center p-2">
=======
          <img src="Images/no-blog.png" alt="No blogs" style={{ width: "8rem" }} />
          <p className="text-xl mt-5">No blogs available.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center p-2">
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
<<<<<<< HEAD
                    <span className="flex items-center justify-center gap-1 py-1 font-medium tracking-wide text-xs sm:text-sm">
=======
                    <span className="flex items-center justify-center gap-1 py-1 font-medium tracking-wide">
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
                      {isManualEditor ? (
                        <>Manually Generated</>
                      ) : (
                        <>
                          <img
                            src={`./Images/${
                              isGemini ? "gemini" : aiModel === "claude" ? "claude" : "chatgpt"
                            }.png`}
                            alt={isGemini ? "Gemini" : aiModel === "claude" ? "Claude" : "ChatGPT"}
<<<<<<< HEAD
                            width={16}
                            height={16}
=======
                            width={20}
                            height={20}
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
<<<<<<< HEAD
                    className={`bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-lg p-4 sm:p-6 min-h-[180px] min-w-0 relative ${
=======
                    className={`bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl p-4 min-h-[180px] min-w-[390px] relative ${
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
<<<<<<< HEAD
                          <h3 className="text-base sm:text-lg capitalize font-semibold text-gray-900 !text-left max-w-full">
                            {title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-3 break-all">
=======
                          <h3 className="text-lg capitalize font-semibold text-gray-900 !text-left max-w-76">
                            {title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-all">
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
<<<<<<< HEAD
                            <h3 className="text-base sm:text-lg capitalize font-semibold text-gray-900 !text-left max-w-full">
                              {title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-3 break-all">
=======
                            <h3 className="text-lg capitalize font-semibold text-gray-900 !text-left max-w-76">
                              {title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-all">
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
                              {truncateContent(stripMarkdown(content)) || ""}
                            </p>
                          </div>
                        </div>
                      </Tooltip>
                    )}

                    <div className="flex items-center justify-end gap-2">
<<<<<<< HEAD
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {focusKeywords?.map((keyword, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full"
=======
                      <div className="flex flex-wrap gap-2">
                        {focusKeywords?.map((keyword, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full"
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
                          <Button
                            type="text"
                            className="p-2 hover:!border-blue-500 hover:text-blue-500"
                            aria-label="Retry blog generation"
                          >
<<<<<<< HEAD
                            <RotateCcw className="w-4 sm:w-5 h-4 sm:h-5" />
=======
                            <RotateCcw />
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
                          </Button>
                        </Popconfirm>
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
                              className: "border-red-500 hover:bg-red-500 hover:text-white",
                            },
                            cancelProps: {
                              danger: false,
                            },
                          })
                        }
                        aria-label={`Move blog ${title} to trash`}
                      >
<<<<<<< HEAD
                        <Trash2 className="w-4 sm:w-5 h-4 sm:h-5" />
                      </Button>
                    </div>

                    <div className="mt-3 -mb-2 flex justify-end text-xs sm:text-sm text-right text-gray-500 font-medium">
=======
                        <Trash2 />
                      </Button>
                    </div>

                    <div className="mt-3 -mb-2 flex justify-end text-xs text-right text-gray-500 font-medium">
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
<<<<<<< HEAD
            <div className="flex justify-center mt-6 sm:mt-8">
=======
            <div className="flex justify-center mt-8">
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
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
                disabled={isLoading}
<<<<<<< HEAD
                className="text-xs sm:text-sm"
=======
>>>>>>> 86bb258a1a776161dcae6c41a1f608b79c6c808e
              />
            </div>
          )}
        </>
      )}
    
    </div>
  )
}

export default MyProjects
