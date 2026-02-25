import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import BlogCard from "../components/Blog/BlogCard"
import {
  ArrowDownUp,
  Calendar,
  Filter,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Trash2,
  ChevronDown,
  Loader2,
  MousePointerClick,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
  Eye,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { Helmet } from "react-helmet"
import useAuthStore from "@store/useAuthStore"
import dayjs from "dayjs"
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query"
import { getSocket } from "@utils/socket"
import isBetween from "dayjs/plugin/isBetween"
import clsx from "clsx"
import DebouncedSearchInput from "@components/ui/DebouncedSearchInput"
import DateRangePicker from "@components/ui/DateRangePicker"
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover"
import { useProAction } from "@/hooks/useProAction"
import {
  archiveBlogById,
  getAllBlogs,
  retryBlogById,
  restoreBlogById,
  deleteAllBlogs,
} from "@api/blogApi"
import {
  BLOG_STATUS,
  BLOG_STATUS_OPTIONS,
  DATE_PRESETS,
  ITEMS_PER_PAGE,
  SORT_OPTIONS,
} from "@/data/blogFilters"
import { toast } from "sonner"

dayjs.extend(isBetween)

const BlogsPage = () => {
  const location = useLocation()
  const isTrashcan = location.pathname === "/trashcan"

  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
  const [isDetailedFilterOpen, setDetailedFilterOpen] = useState(false)

  const [tempGscClicks, setTempGscClicks] = useState(blogFilters.gscClicks)
  const [tempGscImpressions, setTempGscImpressions] = useState(blogFilters.gscImpressions)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tempGscClicks !== blogFilters.gscClicks) {
        updateBlogFilters({ gscClicks: tempGscClicks })
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [tempGscClicks])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tempGscImpressions !== blogFilters.gscImpressions) {
        updateBlogFilters({ gscImpressions: tempGscImpressions })
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [tempGscImpressions])

  useEffect(() => {
    const field = sessionStorage.getItem(
      `user_${user?._id}_blog_filters_${isTrashcan ? "trash" : "active"}`
    )
    if (field) {
      const parsedFilters = JSON.parse(field)
      setBlogFilters(prev => ({ ...prev, ...parsedFilters }) || {})
      setTempGscClicks(parsedFilters.gscClicks ?? null)
      setTempGscImpressions(parsedFilters.gscImpressions ?? null)
    } else {
      setBlogFilters(prev => ({ ...prev, start: user?.createdAt }))
    }
  }, [user?.createdAt, isTrashcan])

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
    refetchInterval: query => {
      const data = query.state.data
      const hasPending = data?.pages?.some(page =>
        page.data?.some(blog => blog.status === "pending" || blog.status === "in-progress")
      )
      return hasPending ? 10000 : false
    },
  })

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
    sessionStorage.removeItem(`user_${userId}_blog_filters_${isTrashcan ? "trash" : "active"}`)
    setCurrentPage(1)
    toast.success("Filters reset to factory defaults")
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

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !user) return

    const handleStatusChange = _ => {
      queryClient.refetchQueries({
        queryKey: isTrashcan ? ["trashedBlogs"] : ["blogs"],
        type: "active",
      })
    }

    const handleBlogCreated = _ => {
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
  }, [user, queryClient, isTrashcan])

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
        toast.success("Synthesis recalibrated. Retrying...")
        isTrashcan ? queryClient.invalidateQueries({ queryKey: ["trashedBlogs"] }) : refetchActive()
      } catch (err) {
        toast.error("Retry failed")
      }
    },
    [isTrashcan, queryClient, refetchActive]
  )

  const handleArchive = useCallback(
    async id => {
      // Optimistic UI Update
      queryClient.setQueryData(["blogs", userId, blogFilters], oldData => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            data: page.data.filter(blog => blog._id !== id),
            totalItems: Math.max(0, page.totalItems - 1),
          })),
        }
      })
      toast.success("Article archived")

      try {
        await archiveBlogById(id)
      } catch (err) {
        toast.error("Failed to archive")
        refetchActive()
      }
    },
    [queryClient, userId, blogFilters, refetchActive]
  )

  const handleRestore = useCallback(
    async id => {
      // Optimistic UI Update
      queryClient.setQueryData(
        ["trashedBlogs", userId, blogFilters, currentPage, pageSize],
        oldData => {
          if (!oldData) return oldData
          return {
            ...oldData,
            trashedBlogs: oldData.trashedBlogs.filter(blog => blog._id !== id),
            totalBlogs: Math.max(0, oldData.totalBlogs - 1),
          }
        }
      )
      toast.success("Article restored to main grid")

      try {
        await restoreBlogById(id)
        queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false })
      } catch (err) {
        toast.error("Restoration failed")
        queryClient.invalidateQueries({ queryKey: ["trashedBlogs"], exact: false })
      }
    },
    [queryClient, userId, blogFilters, currentPage, pageSize]
  )

  const handleBulkDelete = useCallback(async () => {
    // Optimistic UI Update
    queryClient.setQueryData(
      ["trashedBlogs", userId, blogFilters, currentPage, pageSize],
      oldData => {
        if (!oldData) return oldData
        return { ...oldData, trashedBlogs: [], totalBlogs: 0 }
      }
    )
    setCurrentPage(1)
    toast.success("Trash emptied. Permanent deletion complete.")

    try {
      await deleteAllBlogs()
    } catch (err) {
      toast.error("delete failed")
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"], exact: false })
    }
  }, [queryClient, userId, blogFilters, currentPage, pageSize])

  // Total pages for trashcan pagination
  const totalTrashPages = Math.ceil(totalItems / pageSize)

  return (
    <div className="md:p-6 p-3 md:mt-0 mt-6">
      <Helmet>
        <title>{isTrashcan ? "Trashcan" : "Blogs"} | GenWrite</title>
      </Helmet>

      {/* Header Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8 mt-5 md:mt-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isTrashcan ? "Trashcan" : "Blogs Generated"}
          </h1>
          <p className="text-gray-500 text-sm max-w-md">
            {isTrashcan
              ? "Restore valuable work or permanently delete clutter. Trashed items are deleted after 7 days."
              : "All our blogs in one place. Explore insights, tips, and strategies to level up your content creation."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {!isTrashcan && (
            <button
              onClick={() => handleProAction(() => navigate("/blog-editor"))}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium cursor-pointer "
            >
              <Plus
                size={20}
                strokeWidth={3}
                className="group-hover:rotate-90 transition-transform"
              />
              New Blog
            </button>
          )}

          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: isTrashcan ? ["trashedBlogs"] : ["blogs"] })
            }
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium cursor-pointer  border border-gray-300 text-gray-800"
          >
            <RefreshCcw size={18} className={isRefetching ? "animate-spin text-blue-500" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isTrashcan && allBlogs.length > 0 && (
            <button
              onClick={() =>
                handlePopup({
                  title: "Empty Trash?",
                  description: "Permanently delete all articles in trash. This cannot be undone.",
                  onConfirm: handleBulkDelete,
                })
              }
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border border-red-300 bg-red-100 text-red-500 hover:bg-red-200"
            >
              <Trash2 size={18} />
              Delete All
            </button>
          )}
        </div>
      </div>

      {/* Control Matrix (Search & Filters) */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-6 mb-12">
        <div className="relative group flex-1">
          <DebouncedSearchInput
            initialValue={blogFilters.q}
            onSearch={val => updateBlogFilters({ q: val })}
            placeholder="Search by title or keywords..."
            className="w-full text-sm placeholder-gray-400 focus:outline-none h-11 pl-10 pr-4 bg-slate-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="hidden xl:flex items-center gap-4">
            <select
              value={blogFilters.status}
              onChange={e => updateBlogFilters({ status: e.target.value })}
              className="select min-w-[180px] focus:none rounded-lg outline-0"
            >
              {BLOG_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={blogFilters.sort}
              onChange={e => updateBlogFilters({ sort: e.target.value })}
              className="select min-w-[200px] focus:none rounded-lg outline-0"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <button
                className={clsx(
                  "btn gap-3 transition-all rounded-lg",
                  hasActiveFilters || blogFilters.gscClicks || blogFilters.gscImpressions
                    ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                <Filter size={18} />
                Advanced
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-80 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white border border-slate-100 rounded-2xl z-100"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <h4 className="font-bold text-slate-800 text-sm">Detailed Filters</h4>
                <button
                  onClick={resetFilters}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Reset All
                </button>
              </div>

              <div className="space-y-4">
                {/* Mobile visible Selects in dropdown */}
                <div className="xl:hidden space-y-4">
                  <select
                    value={blogFilters.status}
                    onChange={e => updateBlogFilters({ status: e.target.value })}
                    className="select select-bordered w-full rounded-xl bg-slate-50 border-slate-100 font-bold outline-0"
                  >
                    {BLOG_STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={blogFilters.sort}
                    onChange={e => updateBlogFilters({ sort: e.target.value })}
                    className="select select-bordered w-full rounded-xl bg-slate-50 border-slate-100 font-bold outline-0"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <MousePointerClick size={14} className="text-slate-400" /> MIN. GSC CLICKS
                  </label>
                  <input
                    type="number"
                    value={tempGscClicks || ""}
                    onChange={e => setTempGscClicks(parseInt(e.target.value) || null)}
                    placeholder="e.g. 50"
                    className="input input-sm h-10 w-full rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-slate-700 placeholder:text-slate-300 transition-all outline-0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Eye size={14} className="text-slate-400" /> MIN. GSC IMPRESSIONS
                  </label>
                  <input
                    type="number"
                    value={tempGscImpressions || ""}
                    onChange={e => setTempGscImpressions(parseInt(e.target.value) || null)}
                    placeholder="e.g. 1000"
                    className="input input-sm h-10 w-full rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-slate-700 placeholder:text-slate-300 transition-all outline-0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" /> DATE RANGE
                  </label>
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
                    className="w-full! rounded-lg!"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="btn btn-ghost h-16 w-16 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 transition-all shadow-sm"
              title="Clear Matrix Filters"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      <AnimatePresence mode="wait">
        {isLoading || isRefetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(9)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-[40px] p-8 border border-slate-100 h-[400px] flex flex-col space-y-6"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-2xl animate-pulse" />
                <div className="space-y-3">
                  <div className="w-3/4 h-8 bg-slate-50 rounded animate-pulse" />
                  <div className="w-1/2 h-8 bg-slate-50 rounded animate-pulse" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="w-full h-4 bg-slate-50 rounded animate-pulse" />
                  <div className="w-full h-4 bg-slate-50 rounded animate-pulse" />
                  <div className="w-2/3 h-4 bg-slate-50 rounded animate-pulse" />
                </div>
                <div className="flex justify-between mt-auto">
                  <div className="w-20 h-8 bg-slate-50 rounded-xl animate-pulse" />
                  <div className="w-24 h-8 bg-slate-50 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : allBlogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col justify-center items-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-3xl"
          >
            <img
              src="/Images/trash-can.webp"
              alt="No blogs found"
              className="w-36 h-36 mb-4 object-contain opacity-80"
            />
            <h3 className="text-xl font-bold text-slate-600">No blogs found</h3>
            <p className="text-slate-400 mt-2 text-sm">
              Try adjusting your filters or search terms.
            </p>
            <button
              onClick={resetFilters}
              className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Clear all filters
            </button>
          </motion.div>
        ) : (
          <div>
            <div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            </div>

            {/* Pagination Matrix */}
            <div className="pt-10 flex flex-col items-center gap-10">
              {!isTrashcan && hasNextPage && (
                <div className="flex flex-col items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-10 bg-slate-200" />
                    <p className="text-slate-500 text-sm">
                      Showing {allBlogs.length} / {totalItems}
                    </p>
                    <div className="h-px w-10 bg-slate-200" />
                  </div>

                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="btn btn-outline p-6 px-8 border rounded-lg text-gray-700 border-slate-200 disabled:opacity-50"
                  >
                    {isFetchingNextPage ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>Load More</>
                    )}
                  </button>
                </div>
              )}

              {isTrashcan && totalItems > pageSize && (
                <div className="flex items-center gap-2 join">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="join-item btn btn-outline border-slate-200 h-12 w-12 p-0"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {[...Array(totalTrashPages)].map((_, i) => {
                    const page = i + 1
                    // Show limited pages if many
                    if (totalTrashPages > 5) {
                      if (
                        page !== 1 &&
                        page !== totalTrashPages &&
                        (page < currentPage - 1 || page > currentPage + 1)
                      ) {
                        if (page === currentPage - 2 || page === currentPage + 2)
                          return (
                            <span key={i} className="join-item btn btn-disabled">
                              ...
                            </span>
                          )
                        return null
                      }
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(page)}
                        className={clsx(
                          "join-item btn h-12 w-12 border-slate-200",
                          currentPage === page
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {page}
                      </button>
                    )
                  })}

                  <button
                    disabled={currentPage === totalTrashPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalTrashPages, prev + 1))}
                    className="join-item btn btn-outline border-slate-200 h-12 w-12 p-0"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BlogsPage
