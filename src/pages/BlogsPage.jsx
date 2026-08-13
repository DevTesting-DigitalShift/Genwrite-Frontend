import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import BlogCard from "../components/Blog/BlogCard"
import {
  Calendar,
  Filter,
  Plus,
  RefreshCcw,
  RotateCcw,
  Trash2,
  Loader2,
  MousePointerClick,
  Eye,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { Helmet } from "react-helmet"
import useAuthStore from "@store/useAuthStore"
import useWorkspaceStore from "@store/useWorkspaceStore"
import dayjs from "dayjs"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { getSocket } from "@utils/socket"
import isBetween from "dayjs/plugin/isBetween"
import clsx from "clsx"
import DebouncedSearchInput from "@components/ui/DebouncedSearchInput"
import DateRangePicker from "@components/ui/DateRangePicker"
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover"
import { useProAction } from "@/hooks/useProAction"
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard"
import { getDefaultFilterStart } from "@utils/dateDefaults"
import {
  archiveBlogById,
  getAllBlogs,
  retryBlogById,
  restoreBlogById,
  restoreAllBlogs,
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
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = user?._id || "guest"
  // Scope caching/filter-persistence to whichever account's blogs are actually being
  // viewed, so switching into/out of a shared workspace doesn't reuse the invitee's
  // own stale filters or React Query cache.
  const scopeKey = activeWorkspace?.id || userId
  const { handleProAction } = useProAction()
  const { guardWrite, isReadOnlyWorkspace, readOnlyMessage } = useReadOnlyGuard()
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
      `user_${scopeKey}_blog_filters_${isTrashcan ? "trash" : "active"}`
    )
    return item ? JSON.parse(item) : initialBlogFilter
  })

  const [_isDetailedFilterOpen, _setDetailedFilterOpen] = useState(false)

  const [tempGscClicks, setTempGscClicks] = useState(blogFilters.gscClicks)
  const [tempGscImpressions, setTempGscImpressions] = useState(blogFilters.gscImpressions)

  const updateBlogFilters = useCallback(
    (updates) => {
      setBlogFilters((prev) => {
        const newValue = { ...prev, ...updates }
        sessionStorage.setItem(
          `user_${scopeKey}_blog_filters_${isTrashcan ? "trash" : "active"}`,
          JSON.stringify(newValue)
        )
        return newValue
      })
    },
    [scopeKey, isTrashcan]
  )

  const handleApplyDetailedFilters = useCallback(() => {
    updateBlogFilters({ gscClicks: tempGscClicks, gscImpressions: tempGscImpressions })
    toast.success("Applied GSC filters")
  }, [updateBlogFilters, tempGscClicks, tempGscImpressions])

  useEffect(() => {
    const field = sessionStorage.getItem(
      `user_${scopeKey}_blog_filters_${isTrashcan ? "trash" : "active"}`
    )
    if (field) {
      const parsedFilters = JSON.parse(field)
      setBlogFilters((prev) => ({ ...prev, ...parsedFilters }))
      setTempGscClicks(parsedFilters.gscClicks ?? null)
      setTempGscImpressions(parsedFilters.gscImpressions ?? null)
    } else {
      const isSharedWorkspace = !!activeWorkspace
      setBlogFilters((prev) => ({
        ...prev,
        start: getDefaultFilterStart(user, { isSharedWorkspace }),
      }))
    }
  }, [scopeKey, activeWorkspace, user, isTrashcan])

  const {
    isLoading: isLoadingActive,
    isRefetching: isRefetchingActive,
    data: activeData,
    hasNextPage: hasNextPageActive,
    fetchNextPage: fetchNextPageActive,
    isFetchingNextPage: isFetchingNextPageActive,
    refetch: refetchActive,
  } = useInfiniteQuery({
    queryKey: ["blogs", scopeKey, blogFilters],
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
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? (lastPage.page ?? 1) + 1 : undefined
    },
    enabled: !!user && !isTrashcan,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  })

  const {
    isLoading: isLoadingTrash,
    isRefetching: isRefetchingTrash,
    data: trashData,
    hasNextPage: hasNextPageTrash,
    fetchNextPage: fetchNextPageTrash,
    isFetchingNextPage: isFetchingNextPageTrash,
  } = useInfiniteQuery({
    queryKey: ["trashedBlogs", scopeKey, blogFilters],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      let params = {
        isArchived: true,
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
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? (lastPage.page ?? 1) + 1 : undefined
    },
    enabled: !!user && isTrashcan,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  })

  const allBlogs = useMemo(() => {
    const data = isTrashcan ? trashData : activeData
    return data?.pages.flatMap((p) => p.data) ?? []
  }, [isTrashcan, trashData, activeData])

  const totalItems = (isTrashcan ? trashData : activeData)?.pages[0]?.totalItems ?? 0

  const isLoading = isTrashcan ? isLoadingTrash : isLoadingActive
  const isRefetching = isTrashcan ? isRefetchingTrash : isRefetchingActive
  const hasNextPage = isTrashcan ? hasNextPageTrash : hasNextPageActive
  const fetchNextPage = isTrashcan ? fetchNextPageTrash : fetchNextPageActive
  const isFetchingNextPage = isTrashcan ? isFetchingNextPageTrash : isFetchingNextPageActive

  const defaultFilterStart = useMemo(
    () => getDefaultFilterStart(user, { isSharedWorkspace: !!activeWorkspace }),
    [user, activeWorkspace]
  )

  const resetFilters = useCallback(() => {
    const freshStart = { ...initialBlogFilter, start: defaultFilterStart }
    setBlogFilters(freshStart)
    setTempGscClicks(null)
    setTempGscImpressions(null)
    sessionStorage.removeItem(`user_${scopeKey}_blog_filters_${isTrashcan ? "trash" : "active"}`)
    toast.success("Filters reset to basics")
  }, [defaultFilterStart, isTrashcan, scopeKey, initialBlogFilter])

  const hasActiveDates = useMemo(() => {
    if (!blogFilters || !initialBlogFilter) return false
    const sameStart = blogFilters.start === defaultFilterStart
    const sameEnd = blogFilters.end === initialBlogFilter.end
    return !sameStart || !sameEnd
  }, [blogFilters, defaultFilterStart, initialBlogFilter])

  const hasActiveFilters = useMemo(() => {
    if (!blogFilters || !initialBlogFilter) return false
    const isOtherChanged = Object.keys(blogFilters).some((key) => {
      if (key === "start" || key === "end") return false
      return JSON.stringify(blogFilters[key]) !== JSON.stringify(initialBlogFilter[key])
    })
    return hasActiveDates || isOtherChanged
  }, [blogFilters, hasActiveDates, initialBlogFilter])

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !user) return

    const activeQueryKey = isTrashcan ? ["trashedBlogs"] : ["blogs"]

    const patchBlogInCache = (blogId, patcher) => {
      if (!blogId) return
      queryClient.setQueriesData({ queryKey: activeQueryKey }, (oldData) => {
        if (!oldData?.pages) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((blog) => (blog._id === blogId ? patcher(blog) : blog)),
          })),
        }
      })
    }

    const handleProgressUpdated = ({ blogId, taskStatus } = {}) => {
      if (blogId && taskStatus) {
        patchBlogInCache(blogId, (blog) => ({ ...blog, taskStatus }))
      }
    }

    const handleStatusChange = ({ blogId, newStatus } = {}) => {
      if (newStatus === "complete" || newStatus === "failed") {
        // Final state — fetch fresh blog data from API (title, excerpt, taskStatus, etc. may have changed)
        queryClient.invalidateQueries({ queryKey: activeQueryKey, refetchType: "active" })
      } else if (blogId && newStatus) {
        // Transitional state (e.g. pending → in-progress) — patch status immediately, skip API round-trip
        patchBlogInCache(blogId, (blog) => ({ ...blog, status: newStatus }))
      }
    }

    const handleBlogMutation = (_) => {
      queryClient.invalidateQueries({ queryKey: activeQueryKey, refetchType: "active" })
    }

    const handleBlogCreated = (_) => {
      if (!isTrashcan) {
        queryClient.invalidateQueries({ queryKey: ["blogs"], refetchType: "active" })
      }
    }

    const handleBlogJobRetry = ({ blogId, retryTime } = {}) => {
      if (!blogId) return
      patchBlogInCache(blogId, (blog) => ({ ...blog, agendaNextRun: retryTime }))
    }

    socket.on("blog:progressUpdated", handleProgressUpdated)
    socket.on("blog:statusChanged", handleStatusChange)
    socket.on("blog:updated", handleBlogMutation)
    socket.on("blog:deleted", handleBlogMutation)
    socket.on("blog:created", handleBlogCreated)
    socket.on("blog:jobRetry", handleBlogJobRetry)

    return () => {
      socket.off("blog:progressUpdated", handleProgressUpdated)
      socket.off("blog:statusChanged", handleStatusChange)
      socket.off("blog:updated", handleBlogMutation)
      socket.off("blog:deleted", handleBlogMutation)
      socket.off("blog:created", handleBlogCreated)
      socket.off("blog:jobRetry", handleBlogJobRetry)
    }
  }, [user, queryClient, isTrashcan])

  const handleBlogClick = useCallback(
    (blog) => {
      navigate(`/editor/${blog._id}`)
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
    async (id) => {
      try {
        await retryBlogById(id)
        toast.success("Synthesis recalibrated. Retrying...")
        isTrashcan ? queryClient.invalidateQueries({ queryKey: ["trashedBlogs"] }) : refetchActive()
      } catch (_err) {
        toast.error("Retry failed")
      }
    },
    [isTrashcan, queryClient, refetchActive]
  )

  const handleArchive = useCallback(
    async (id) => {
      // Optimistic UI Update
      queryClient.setQueryData(["blogs", userId, blogFilters], (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.filter((blog) => blog._id !== id),
            totalItems: Math.max(0, page.totalItems - 1),
          })),
        }
      })
      toast.success("Article archived")

      try {
        await archiveBlogById(id)
      } catch (_err) {
        toast.error("Failed to archive")
        refetchActive()
      }
    },
    [queryClient, userId, blogFilters, refetchActive]
  )

  const handleRestore = useCallback(
    async (id) => {
      // Optimistic UI Update
      queryClient.setQueryData(["trashedBlogs", userId, blogFilters], (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.filter((blog) => blog._id !== id),
            totalItems: Math.max(0, page.totalItems - 1),
          })),
        }
      })
      toast.success("Article is restored. Check My Projects", {
        action: { label: "View", onClick: () => navigate("/blogs") },
      })

      try {
        await restoreBlogById(id)
        queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false })
      } catch (_err) {
        toast.error("Restoration failed")
        queryClient.invalidateQueries({ queryKey: ["trashedBlogs"], exact: false })
      }
    },
    [queryClient, userId, blogFilters, navigate]
  )

  const handleRestoreAll = useCallback(async () => {
    // Optimistic UI Update
    queryClient.setQueryData(["trashedBlogs", userId, blogFilters], (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({ ...page, data: [], totalItems: 0 })),
      }
    })
    toast.success("All articles are restored. Check My Projects", {
      action: { label: "View", onClick: () => navigate("/blogs") },
    })

    try {
      await restoreAllBlogs()
      queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false })
    } catch (_err) {
      toast.error("Restoration failed")
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"], exact: false })
    }
  }, [queryClient, userId, blogFilters, navigate])

  const handleBulkDelete = useCallback(async () => {
    // Optimistic UI Update
    queryClient.setQueryData(["trashedBlogs", userId, blogFilters], (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({ ...page, data: [], totalItems: 0 })),
      }
    })
    toast.success("Trash emptied. Permanent deletion complete.")

    try {
      await deleteAllBlogs()
    } catch (_err) {
      toast.error("delete failed")
      queryClient.invalidateQueries({ queryKey: ["trashedBlogs"], exact: false })
    }
  }, [queryClient, userId, blogFilters])

  return (
    <div className="md:p-6 p-3 md:mt-0 mt-6">
      <Helmet>
        <title>{isTrashcan ? "Trashcan" : "Blogs"} | GenWrite</title>
      </Helmet>

      {/* Header Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8 mt-5 md:mt-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#4C5BD6] tracking-tight">
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
              type="button"
              disabled={isReadOnlyWorkspace}
              title={isReadOnlyWorkspace ? readOnlyMessage : undefined}
              onClick={() => guardWrite(() => handleProAction(() => navigate("/blog-editor")))}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary hover:bg-[#3B4BB8] text-white rounded-md transition-all text-xs sm:text-sm font-bold cursor-pointer shadow-none border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
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
            type="button"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: isTrashcan ? ["trashedBlogs"] : ["blogs"] })
            }
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium cursor-pointer  border border-gray-300 text-gray-800"
          >
            <RefreshCcw size={18} className={isRefetching ? "animate-spin text-blue-500" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isTrashcan && allBlogs.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  handlePopup({
                    title: "Restore All Articles?",
                    description: "This will move all articles back to your main grid.",
                    onConfirm: handleRestoreAll,
                  })
                }
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
              >
                <RotateCcw size={18} />
                Restore All
              </button>
              <button
                type="button"
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
            </div>
          )}
        </div>
      </div>

      {/* Control Matrix (Search & Filters) */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-6 mb-12">
        <div className="relative group flex-1">
          <DebouncedSearchInput
            initialValue={blogFilters.q}
            onSearch={(val) => updateBlogFilters({ q: val })}
            placeholder="Search blogs by title or content..."
            className="w-full text-sm placeholder-gray-400 h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-all font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="hidden xl:flex items-center gap-4">
            <select
              value={blogFilters.status}
              onChange={(e) => updateBlogFilters({ status: e.target.value })}
              className="select min-w-[180px] focus:none rounded-lg outline-0"
            >
              {BLOG_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={blogFilters.sort}
              onChange={(e) => updateBlogFilters({ sort: e.target.value })}
              className="select min-w-[200px] focus:none rounded-lg outline-0"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
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
                  type="button"
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
                    onChange={(e) => updateBlogFilters({ status: e.target.value })}
                    className="select select-bordered w-full rounded-xl bg-slate-50 border-slate-100 font-bold outline-0"
                  >
                    {BLOG_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={blogFilters.sort}
                    onChange={(e) => updateBlogFilters({ sort: e.target.value })}
                    className="select select-bordered w-full rounded-xl bg-slate-50 border-slate-100 font-bold outline-0"
                  >
                    {SORT_OPTIONS.map((opt) => (
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
                    onChange={(e) => setTempGscClicks(parseInt(e.target.value, 10) || null)}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyDetailedFilters()}
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
                    onChange={(e) => setTempGscImpressions(parseInt(e.target.value, 10) || null)}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyDetailedFilters()}
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
                    minDate={
                      !activeWorkspace && user?.createdAt ? dayjs(user.createdAt) : undefined
                    }
                    maxDate={dayjs()}
                    onChange={(dates) => {
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

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleApplyDetailedFilters}
                    className="w-full py-2.5 bg-[#4C5BD6] hover:bg-[#3B4BB8] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    Apply Advanced Filters
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="btn btn-ghost rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 transition-all shadow-sm"
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
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-count skeleton placeholder, no content
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
              type="button"
              onClick={resetFilters}
              className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Clear all filters
            </button>
          </motion.div>
        ) : (
          <div>
            <div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allBlogs.map((blog) => (
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
              {hasNextPage && (
                <div className="flex flex-col items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-10 bg-slate-200" />
                    <p className="text-slate-500 text-sm">
                      Showing {allBlogs.length} / {totalItems}
                    </p>
                    <div className="h-px w-10 bg-slate-200" />
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="btn btn-outline p-6 px-8 border rounded-lg  border-slate-200 disabled:opacity-50"
                  >
                    {isFetchingNextPage ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>Load More</>
                    )}
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
