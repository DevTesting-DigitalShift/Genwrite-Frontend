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
import DebouncedSearchInput from "@components/UI/DebouncedSearchInput"
import DateRangePicker from "@components/UI/DateRangePicker"
import { useProAction } from "@/hooks/useProAction"
import toast from "@utils/toast"
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
      try {
        await archiveBlogById(id)
        toast.success("Article archived")
        refetchActive()
      } catch (err) {
        toast.error("Failed to archive")
      }
    },
    [refetchActive]
  )

  const handleRestore = useCallback(
    async id => {
      try {
        await restoreBlogById(id)
        toast.success("Article restored to main grid")
        queryClient.invalidateQueries({ queryKey: ["trashedBlogs"], exact: false })
        queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false })
      } catch (err) {
        toast.error("Restoration failed")
      }
    },
    [queryClient]
  )

  const handleBulkDelete = useCallback(async () => {
    try {
      await deleteAllBlogs()
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"], exact: false })
      setCurrentPage(1)
      toast.success("Trash emptied. Permanent deletion complete.")
    } catch (err) {
      toast.error("Purge failed")
    }
  }, [queryClient])

  // Total pages for trashcan pagination
  const totalTrashPages = Math.ceil(totalItems / pageSize)

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50 font-inter">
      <Helmet>
        <title>{isTrashcan ? "Trashcan" : "Content Matrix"} | GenWrite</title>
      </Helmet>

      {/* Header Grid */}
      <header className="mb-12">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 pb-10 border-b border-slate-200/50">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
              {isTrashcan ? (
                <Trash2 size={10} className="text-rose-400" />
              ) : (
                <Zap size={10} className="text-blue-400" />
              )}
              {isTrashcan ? "Archival Storage" : "Active Synthesis Grid"}
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
              {isTrashcan
                ? "Trashcan"
                : "Content <span className='text-blue-600 font-black'>Matrix</span>"}
              <span
                dangerouslySetInnerHTML={{
                  __html: isTrashcan ? "" : "Content <span className='text-blue-600'>Matrix</span>",
                }}
                style={{ display: "none" }}
              />
              {/* Note: dangerous style above is just to keep the logic consistent if I wanted to use a span, but I'll write it clearly below */}
              {!isTrashcan && <span className="text-blue-600 ml-3">Matrix</span>}
            </h1>
            <p className="text-slate-400 font-medium max-w-xl text-lg leading-relaxed">
              {isTrashcan
                ? "Items in the void are purged after 7 days. Restore valuable DNA or clear the cache."
                : "Manage your high-entropy AI articles and research output."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {!isTrashcan && (
              <button
                onClick={() => handleProAction(() => navigate("/blog-editor"))}
                className="btn btn-primary h-14 px-8 rounded-2xl bg-slate-900 border-none text-white font-black shadow-2xl hover:bg-black transition-all gap-2 group"
              >
                <Plus
                  size={20}
                  strokeWidth={3}
                  className="group-hover:rotate-90 transition-transform"
                />
                Forge New Article
              </button>
            )}

            <button
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: isTrashcan ? ["trashedBlogs"] : ["blogs"],
                })
              }
              className="btn btn-ghost h-14 px-6 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black hover:bg-slate-50 transition-all gap-2 shadow-sm"
            >
              <RefreshCcw size={18} className={isRefetching ? "animate-spin text-blue-500" : ""} />
              <span className="hidden sm:inline">Refresh Grid</span>
            </button>

            {isTrashcan && allBlogs.length > 0 && (
              <button
                onClick={() =>
                  handlePopup({
                    title: "Empty Trash?",
                    description: "Permanently purge all articles in trash. This cannot be undone.",
                    onConfirm: handleBulkDelete,
                  })
                }
                className="btn btn-error btn-outline h-14 px-6 rounded-2xl font-black gap-2"
              >
                <Trash2 size={18} />
                Purge All
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Control Matrix (Search & Filters) */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-6 mb-12">
        <div className="relative group flex-1 max-w-2xl">
          <DebouncedSearchInput
            initialValue={blogFilters.q}
            onSearch={val => updateBlogFilters({ q: val })}
            placeholder="Search by title, keywords or ID..."
            className="w-full h-16! pl-14! bg-white! border-slate-200! rounded-[24px]! shadow-sm! focus:ring-8! focus:ring-blue-500/5! focus:border-blue-500! transition-all! font-bold! text-slate-700!"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="hidden xl:flex items-center gap-4">
            <select
              value={blogFilters.status}
              onChange={e => updateBlogFilters({ status: e.target.value })}
              className="select select-bordered h-16 rounded-2xl bg-white border-slate-200 font-bold text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 min-w-[180px]"
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
              className="select select-bordered h-16 rounded-2xl bg-white border-slate-200 font-bold text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 min-w-[200px]"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className={clsx(
                "btn h-16 px-6 rounded-2xl font-black gap-3 transition-all",
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
            </div>

            <div
              tabIndex={0}
              className="dropdown-content z-50 card card-compact w-80 p-6 shadow-2xl bg-white border border-slate-100 mt-2 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Global Filters
                </h4>
                <button
                  onClick={resetFilters}
                  className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-6">
                {/* Mobile visible Selects in dropdown */}
                <div className="xl:hidden space-y-4">
                  <select
                    value={blogFilters.status}
                    onChange={e => updateBlogFilters({ status: e.target.value })}
                    className="select select-bordered w-full rounded-xl bg-slate-50 border-slate-100 font-bold"
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
                    className="select select-bordered w-full rounded-xl bg-slate-50 border-slate-100 font-bold"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MousePointerClick size={12} className="text-blue-500" /> Min Clicks
                  </label>
                  <input
                    type="number"
                    value={tempGscClicks || ""}
                    onChange={e => setTempGscClicks(parseInt(e.target.value) || null)}
                    placeholder="0"
                    className="input input-bordered w-full rounded-xl bg-slate-50 border-slate-100 font-bold"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} className="text-purple-500" /> Synthesis Timeframe
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
                    className="w-full! rounded-xl!"
                  />
                </div>
              </div>
            </div>
          </div>

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
            className="flex flex-col justify-center items-center py-40 bg-white rounded-[64px] border border-slate-100 shadow-2xl shadow-slate-200/50"
          >
            <div className="w-32 h-32 bg-slate-50 rounded-[48px] flex items-center justify-center mb-8 shadow-inner">
              <Search size={48} className="text-slate-200" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              Binary Void Detected
            </h3>
            <p className="text-slate-400 mt-4 font-medium max-w-sm text-center px-6">
              No matching content found in this sector. Adjust your search parameters or recalibrate
              filters.
            </p>
            <button
              onClick={resetFilters}
              className="btn btn-primary mt-10 h-14 px-10 rounded-2xl bg-slate-900 border-none text-white font-black shadow-xl hover:bg-black transition-all"
            >
              Reset Matrix Search
            </button>
          </motion.div>
        ) : (
          <div className="space-y-20">
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

            {/* Pagination Matrix */}
            <div className="pt-10 flex flex-col items-center gap-10">
              {!isTrashcan && hasNextPage && (
                <div className="flex flex-col items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-10 bg-slate-200" />
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">
                      Showing {allBlogs.length} / {totalItems} Entity IDs
                    </p>
                    <div className="h-px w-10 bg-slate-200" />
                  </div>

                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="btn btn-outline h-16 px-12 rounded-[24px] border-2 border-slate-200 bg-white text-slate-900 font-black hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-xl group disabled:opacity-50"
                  >
                    {isFetchingNextPage ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        Reveal More Articles
                        <ChevronDown
                          size={20}
                          className="group-hover:translate-y-1 transition-transform"
                        />
                      </>
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

      <footer className="mt-32 pb-10 flex flex-col items-center gap-4 opacity-30 select-none">
        <div className="flex items-center gap-4">
          <div className="h-1 w-1 bg-slate-400 rounded-full" />
          <span className="text-[10px] font-black uppercase tracking-[1em]">End of Sync</span>
          <div className="h-1 w-1 bg-slate-400 rounded-full" />
        </div>
      </footer>
    </div>
  )
}

export default BlogsPage
