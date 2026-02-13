import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import SkeletonLoader from "../components/UI/SkeletonLoader"
import BlogCard from "../components/Blog/BlogCard"
import {
  Badge,
  Button,
  Input,
  Popconfirm,
  Tooltip,
  Popover,
  Pagination,
  message,
  Flex,
  Spin,
  Select,
  InputNumber,
  Divider,
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
  ArchiveRestore,
  MousePointerClick,
  Eye,
  ChevronDown,
  Loader2,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { Helmet } from "react-helmet"
import { useDispatch, useSelector } from "react-redux"
import { selectUser } from "@store/slices/authSlice"
import {
  archiveBlog,
  fetchAllBlogs,
  retryBlog,
  restoreTrashedBlog,
  deleteAllUserBlogs,
} from "@store/slices/blogSlice"
import dayjs from "dayjs"
import Fuse from "fuse.js"
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { getSocket } from "@utils/socket"
import isBetween from "dayjs/plugin/isBetween"
import clsx from "clsx"
import DebouncedSearchInput from "@components/UI/DebouncedSearchInput"
import DateRangePicker from "@components/UI/DateRangePicker"
import { useProAction } from "@/hooks/useProAction"
import { archiveBlogById, getAllBlogs, retryBlogById } from "@api/blogApi"
import {
  BLOG_STATUS,
  BLOG_STATUS_OPTIONS,
  DATE_PRESETS,
  ITEMS_PER_PAGE,
  SORT_OPTIONS,
} from "@/data/blogFilters"
import { useInView } from "react-intersection-observer"

dayjs.extend(isBetween)

const { Option } = Select
const TRUNCATE_LENGTH = 200

const BlogsPage = () => {
  const location = useLocation()
  const isTrashcan = location.pathname === "/trashcan"

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useSelector(selectUser)
  const userId = user?._id || "guest"
  const { handleProAction } = useProAction()
  const { handlePopup } = useConfirmPopup()

  const initialBlogFilter = useMemo(
    () => ({
      start: DATE_PRESETS[0].range[0].toISOString(),
      end: DATE_PRESETS[0].range[1].toISOString(),
      q: "",
      status: BLOG_STATUS.ALL,
      sort: SORT_OPTIONS[0].value,
      gscClicks: null,
      gscImpressions: null,
    }),
    []
  )

  const [blogFilters, setBlogFilters] = useState(() => {
    const item = sessionStorage.getItem(
      `user_${user?._id}_blog_filters_${isTrashcan ? "trash" : "active"}`
    )
    return item ? JSON.parse(item) : initialBlogFilter
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isFunnelMenuOpen, setFunnelMenuOpen] = useState(false)
  const [isDetailedFilterOpen, setDetailedFilterOpen] = useState(false)

  // Temporary state for GSC filters (immediate input values)
  const [tempGscClicks, setTempGscClicks] = useState(blogFilters.gscClicks)
  const [tempGscImpressions, setTempGscImpressions] = useState(blogFilters.gscImpressions)

  // Debounce effect for GSC Clicks - waits 5 seconds after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tempGscClicks !== blogFilters.gscClicks) {
        updateBlogFilters({ gscClicks: tempGscClicks })
      }
    }, 3000) // 5 second delay

    return () => clearTimeout(timer)
  }, [tempGscClicks])

  // Debounce effect for GSC Impressions - waits 5 seconds after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tempGscImpressions !== blogFilters.gscImpressions) {
        updateBlogFilters({ gscImpressions: tempGscImpressions })
      }
    }, 5000) // 5 second delay

    return () => clearTimeout(timer)
  }, [tempGscImpressions])

  useEffect(() => {
    const field = sessionStorage.getItem(
      `user_${user?._id}_blog_filters_${isTrashcan ? "trash" : "active"}`
    )
    if (field) {
      const parsedFilters = JSON.parse(field)
      setBlogFilters(prev => ({ ...prev, ...parsedFilters }) || {})
      // Sync temp values with loaded filters
      setTempGscClicks(parsedFilters.gscClicks ?? null)
      setTempGscImpressions(parsedFilters.gscImpressions ?? null)
    } else {
      setBlogFilters(prev => ({ ...prev, start: user?.createdAt }))
    }
  }, [user?.createdAt, isTrashcan])

  // For active blogs - infinite query
  const {
    isLoading: isLoadingActive,
    isRefetching: isRefetchingActive,
    data: activeData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchActive,
  } = useInfiniteQuery({
    queryKey: ["blogs", userId, blogFilters],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      let params = {
        page: pageParam,
        limit: ITEMS_PER_PAGE,
        q: blogFilters.q || undefined,
        status: blogFilters.status !== BLOG_STATUS.ALL ? blogFilters.status : undefined,
        sort: blogFilters.sort,
        start: blogFilters.start || undefined,
        end: blogFilters.end || undefined,
        gscClicks: blogFilters.gscClicks || undefined,
        gscImpressions: blogFilters.gscImpressions || undefined,
      }
      params = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
      )
      const res = await getAllBlogs(params)
      return {
        data: res?.data ?? [],
        page: res?.page ?? 1,
        totalPages: res?.totalPages ?? 1,
        hasMore: res?.hasMore ?? false,
        totalItems: res?.totalItems ?? 0,
      }
    },
    getNextPageParam: lastPage => {
      return lastPage.hasMore ? (lastPage.page ?? 1) + 1 : undefined
    },
    enabled: !!user && !isTrashcan,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    // Refetch every 10 seconds if we have pending blogs
    refetchInterval: data => {
      const hasPending = data?.pages?.some(page =>
        page.data?.some(blog => blog.status === "pending")
      )
      return hasPending ? 10000 : false // Poll every 10s if pending blogs exist
    },
  })

  // For trashed blogs - regular query with pagination
  const { data: trashData, isLoading: isLoadingTrash } = useQuery({
    queryKey: ["trashedBlogs", userId, blogFilters, currentPage, pageSize],
    queryFn: async () => {
      const queryParams = {
        isArchived: true,
        status: blogFilters.status !== BLOG_STATUS.ALL ? blogFilters.status : undefined,
        q: blogFilters.q || undefined,
        start: blogFilters.start || undefined,
        end: blogFilters.end || undefined,
        gscClicks: blogFilters.gscClicks || undefined,
        gscImpressions: blogFilters.gscImpressions || undefined,
        page: currentPage,
        limit: pageSize,
      }
      const response = await getAllBlogs(queryParams)
      return { trashedBlogs: response.data || [], totalBlogs: response.totalItems || 0 }
    },
    enabled: !!user && isTrashcan,
  })

  // Always call useMemo - compute blogs based on which data is available
  const allBlogs = useMemo(() => {
    if (isTrashcan) {
      return trashData?.trashedBlogs || []
    }
    return activeData?.pages.flatMap(p => p.data) ?? []
  }, [isTrashcan, trashData, activeData])

  const totalItems = isTrashcan
    ? trashData?.totalBlogs || 0
    : (activeData?.pages[0]?.totalItems ?? 0)

  const isLoading = isTrashcan ? isLoadingTrash : isLoadingActive
  const isRefetching = isTrashcan ? false : isRefetchingActive

  const updateBlogFilters = useCallback(
    updates => {
      setBlogFilters(prev => {
        const newValue = { ...prev, ...updates }
        sessionStorage.setItem(
          `user_${userId}_blog_filters_${isTrashcan ? "trash" : "active"}`,
          JSON.stringify(newValue)
        )
        return newValue
      })
    },
    [userId, isTrashcan]
  )

  const resetFilters = useCallback(() => {
    setBlogFilters({ ...initialBlogFilter, start: user?.createdAt })
    setTempGscClicks(null)
    setTempGscImpressions(null)
    setTempGscImpressions(null)
    sessionStorage.removeItem(`user_${userId}_blog_filters_${isTrashcan ? "trash" : "active"}`)
    setCurrentPage(1)
  }, [user, isTrashcan, userId, initialBlogFilter])

  const hasActiveDates = useMemo(() => {
    if (!blogFilters || !initialBlogFilter) return false
    const sameStart = blogFilters.start === user?.createdAt
    const sameEnd = blogFilters.end === initialBlogFilter.end
    return !sameStart || !sameEnd
  }, [blogFilters, user?.createdAt, initialBlogFilter])

  const hasActiveFilters = useMemo(() => {
    if (!blogFilters || !initialBlogFilter) return false
    const isOtherChanged = Object.keys(blogFilters).some(key => {
      if (key === "start" || key === "end") return false
      return JSON.stringify(blogFilters[key]) !== JSON.stringify(initialBlogFilter[key])
    })
    return hasActiveDates || isOtherChanged
  }, [blogFilters, user?.createdAt, hasActiveDates, initialBlogFilter])

  // Socket for real-time updates
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !user) return

    const handleStatusChange = data => {
      // Check if blog failed due to insufficient credits
      if (data?.newStatus === "failed") {
        // Check recent notifications for insufficient credits
        const recentNotification = user?.notifications?.[0]
        if (recentNotification?.type === "INSUFFICIENT_CREDITS") {
          message.error({
            content: (
              <div>
                <strong>Insufficient Credits</strong>
                <p className="mt-1">
                  {recentNotification.message ||
                    "You don't have enough credits to complete this operation."}
                </p>
                <a
                  href="/pricing"
                  className="text-blue-600 hover:text-blue-700 font-semibold underline"
                  onClick={e => {
                    e.preventDefault()
                    navigate("/pricing")
                  }}
                >
                  Add Credits →
                </a>
              </div>
            ),
            duration: 8,
            className: "insufficient-credits-notification",
          })
        }
      }

      queryClient.refetchQueries({
        queryKey: isTrashcan ? ["trashedBlogs"] : ["blogs"],
        type: "active",
      })
    }

    // When a new blog is created, invalidate cache to fetch it
    const handleBlogCreated = data => {
      if (!isTrashcan) {
        queryClient.invalidateQueries({ queryKey: ["blogs"] })
      }
    }

    socket.on("blog:statusChanged", handleStatusChange)
    socket.on("blog:archived", handleStatusChange)
    socket.on("blog:restored", handleStatusChange)
    socket.on("blog:deleted", handleStatusChange)
    socket.on("blog:created", handleBlogCreated)

    return () => {
      socket.off("blog:statusChanged", handleStatusChange)
      socket.off("blog:archived", handleStatusChange)
      socket.off("blog:restored", handleStatusChange)
      socket.off("blog:deleted", handleStatusChange)
      socket.off("blog:created", handleBlogCreated)
    }
  }, [user, userId, queryClient, isTrashcan, navigate])

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

  const handleRetry = useCallback(
    async id => {
      try {
        await retryBlogById(id)
        message.success("Blog will be regenerated shortly")
        isTrashcan ? queryClient.invalidateQueries(["trashedBlogs"]) : refetchActive()
      } catch (err) {
        message.error("Failed to retry blog")
      }
    },
    [isTrashcan, queryClient, refetchActive]
  )

  const handleArchive = useCallback(
    async id => {
      try {
        await archiveBlogById(id)
        message.success("Blog archived successfully")
        refetchActive()
      } catch (err) {
        message.error("Failed to archive")
      }
    },
    [refetchActive]
  )

  const handleRestore = useCallback(
    async id => {
      try {
        await dispatch(restoreTrashedBlog(id)).unwrap()
        queryClient.invalidateQueries({ queryKey: ["trashedBlogs"], exact: false })
        queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false })
      } catch (err) {
        message.error("Failed to restore blog")
      }
    },
    [dispatch, queryClient]
  )

  const handleBulkDelete = useCallback(async () => {
    try {
      await dispatch(deleteAllUserBlogs()).unwrap()
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"], exact: false })
      setCurrentPage(1)
      message.success("All trashed blogs deleted")
    } catch (err) {
      message.error("Failed to delete all blogs")
    }
  }, [dispatch, queryClient])

  const menuOptions = useMemo(
    () =>
      SORT_OPTIONS.map(opt => ({
        ...opt,
        onClick: _ => {
          updateBlogFilters({ sort: opt.value })
        },
      })),
    [updateBlogFilters]
  )

  const funnelMenuOptions = useMemo(
    () =>
      BLOG_STATUS_OPTIONS.map(opt => ({
        ...opt,
        onClick: _ => {
          updateBlogFilters({ status: opt.value })
        },
      })),
    [updateBlogFilters]
  )

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

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen">
      <Helmet>
        <title>{isTrashcan ? "Trashcan" : "Blogs"} | GenWrite</title>
      </Helmet>

      {/* Page Header */}
      <div className="pt-4">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200/60">
            <div className="space-y-1">
              <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                {isTrashcan ? "Trashcan" : "Generated Content"}
              </h1>
              <p className="text-slate-500 text-sm max-w-md font-medium">
                {isTrashcan
                  ? "Restore valuable work or permanently delete clutter. Items are wiped after 7 days."
                  : "Review and manage your AI-crafted articles, insights, and marketing copy."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isTrashcan && (
                <button
                  onClick={() => handleProAction(() => navigate("/blog-editor"))}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-600/90 text-white rounded-lg transition-all shadow-lg text-sm font-bold cursor-pointer active:scale-95"
                >
                  <Plus size={18} strokeWidth={3} />
                  New Article
                </button>
              )}

              <button
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: isTrashcan ? ["trashedBlogs"] : ["blogs"],
                  })
                }
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg transition-all hover:border-slate-300 hover:bg-slate-50 text-sm font-bold cursor-pointer shadow-sm active:scale-95"
              >
                <RefreshCcw size={16} className={isRefetching ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {isTrashcan && allBlogs.length > 0 && (
                <Button
                  danger
                  size="large"
                  icon={<Trash2 size={18} />}
                  onClick={() =>
                    handlePopup({
                      title: "Empty Trash?",
                      description: "Permanently delete all blogs. This action is irreversible.",
                      onConfirm: handleBulkDelete,
                    })
                  }
                  className="rounded-2xl h-[44px] font-bold shadow-sm"
                >
                  Empty All
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Advanced Filters */}
        <div className="flex flex-col justify-between lg:flex-row lg:items-center gap-4 mb-8">
          <div className="relative group flex-1 max-w-xl">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <DebouncedSearchInput
              initialValue={blogFilters.q}
              onSearch={val => updateBlogFilters({ q: val })}
              placeholder="Search by title, keywords or ID..."
              className="pl-12 pr-4 py-3 bg-white !border border-slate-300 rounded-2xl text-sm w-full focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Desktop Quick Filters */}
            <div className="hidden lg:flex items-center gap-3">
              <Select
                value={blogFilters.status}
                onChange={val => updateBlogFilters({ status: val })}
                className="min-w-[150px] h-11 custom-select"
                variant="filled"
                dropdownStyle={{ borderRadius: "16px" }}
              >
                {BLOG_STATUS_OPTIONS.map(opt => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>

              <Select
                value={blogFilters.sort}
                onChange={val => updateBlogFilters({ sort: val })}
                className="min-w-[150px] h-11 custom-select"
                variant="filled"
                dropdownStyle={{ borderRadius: "16px" }}
              >
                {SORT_OPTIONS.map(opt => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </div>

            <Popover
              open={isDetailedFilterOpen}
              onOpenChange={setDetailedFilterOpen}
              trigger="click"
              placement="bottomRight"
              content={
                <div className="w-[320px] p-2 space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 m-0">Advanced Filters</h4>
                    <button
                      onClick={resetFilters}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg"
                    >
                      Reset All
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Mobile Only Quick Filters */}
                    <div className="lg:hidden space-y-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Status Filter
                        </p>
                        <Select
                          value={blogFilters.status}
                          onChange={val => updateBlogFilters({ status: val })}
                          className="w-full h-10 custom-select"
                          variant="filled"
                        >
                          {BLOG_STATUS_OPTIONS.map(opt => (
                            <Option key={opt.value} value={opt.value}>
                              {opt.label}
                            </Option>
                          ))}
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Sort Order
                        </p>
                        <Select
                          value={blogFilters.sort}
                          onChange={val => updateBlogFilters({ sort: val })}
                          className="w-full h-10 custom-select"
                          variant="filled"
                        >
                          {SORT_OPTIONS.map(opt => (
                            <Option key={opt.value} value={opt.value}>
                              {opt.label}
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </div>

                    <Divider className="my-2" />

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <MousePointerClick size={12} /> Search Clicks
                      </p>
                      <InputNumber
                        min={0}
                        placeholder="Min. clicks"
                        value={tempGscClicks}
                        onChange={val => setTempGscClicks(val)}
                        className="w-full h-10 rounded-xl bg-slate-50 border-slate-100"
                        controls={false}
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={12} /> Publication Period
                      </p>
                      <DateRangePicker
                        value={[dayjs(blogFilters.start), dayjs(blogFilters.end)]}
                        minDate={user?.createdAt ? dayjs(user.createdAt) : undefined}
                        maxDate={dayjs()}
                        onChange={dates => {
                          if (dates?.[0]) {
                            updateBlogFilters({
                              start: dates[0].toISOString(),
                              end: dates[1].toISOString(),
                            })
                          }
                        }}
                        className="!w-full !h-10 !rounded-xl !bg-slate-50 !border-slate-100"
                      />
                    </div>
                  </div>
                </div>
              }
            >
              <button
                className={clsx(
                  "h-11 px-5 rounded-2xl flex items-center gap-2 font-bold transition-all shadow-sm border",
                  hasActiveFilters || blogFilters.gscClicks || blogFilters.gscImpressions
                    ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                )}
              >
                <Filter size={18} />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse ml-0.5" />
                )}
              </button>
            </Popover>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="h-11 w-11 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-slate-200"
                title="Clear Filters"
              >
                <RotateCcw size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <AnimatePresence mode="wait">
          {isLoading || isRefetching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white shadow-sm rounded-3xl p-6 border border-slate-100 h-[320px] animate-pulse"
                >
                  <div className="w-1/3 h-4 bg-slate-100 rounded mb-6" />
                  <div className="w-full h-12 bg-slate-50 rounded mb-4" />
                  <div className="w-2/3 h-4 bg-slate-50 rounded mb-8" />
                  <div className="flex gap-2 mt-auto">
                    <div className="w-12 h-6 bg-slate-50 rounded-full" />
                    <div className="w-12 h-6 bg-slate-50 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : allBlogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col justify-center items-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200 shadow-sm"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Search size={40} className="text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">No Articles Found</h3>
              <p className="text-slate-400 mt-2 font-medium">
                Try adjusting your filters or searching for something else.
              </p>
              <button
                onClick={resetFilters}
                className="mt-8 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                Clear All Filters
              </button>
            </motion.div>
          ) : (
            <>
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allBlogs.map(blog => (
                  <BlogCard
                    key={blog._id}
                    blog={blog}
                    onBlogClick={handleBlogClick}
                    onManualBlogClick={handleManualBlogClick}
                    onRetry={handleRetry}
                    onArchive={isTrashcan ? undefined : handleArchive}
                    onRestore={isTrashcan ? handleRestore : undefined}
                    handlePopup={handlePopup}
                    hasGSCPermissions={Boolean(user?.gsc?.length)}
                    isTrashcan={isTrashcan}
                  />
                ))}
              </motion.div>

              {/* Sequential Loading / Pagination */}
              <div className="mt-16 flex flex-col items-center gap-6 pb-20">
                {!isTrashcan && hasNextPage && (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
                      Displaying {allBlogs.length} of {totalItems} items
                    </p>
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="group flex items-center gap-3 px-8 py-3.5 bg-white border-2 border-slate-200 text-slate-800 rounded-2xl font-black hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {isFetchingNextPage ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>
                          <ChevronDown
                            size={20}
                            className="group-hover:translate-y-0.5 transition-transform"
                          />
                          Reveal More Articles
                        </>
                      )}
                    </button>
                  </div>
                )}

                {isTrashcan && totalItems > pageSize && (
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalItems}
                    onChange={(page, size) => {
                      setCurrentPage(page)
                      if (size !== pageSize) setPageSize(size)
                    }}
                    showSizeChanger
                    className="modern-pagination"
                  />
                )}
              </div>
            </>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .custom-select .ant-select-selector {
          border-radius: 12px !important;
          background-color: #f8fafc !important;
          border: none !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
        }
        .modern-pagination .ant-pagination-item {
          border-radius: 12px;
          border-color: #e2e8f0;
          font-weight: 700;
        }
        .modern-pagination .ant-pagination-item-active {
          background-color: #4f46e5;
          border-color: #4f46e5;
        }
        .modern-pagination .ant-pagination-item-active a {
          color: white !important;
        }
      `}</style>
    </div>
  )
}

export default BlogsPage
