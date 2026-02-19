import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import SkeletonLoader from "../components/UI/SkeletonLoader"
import BlogCard from "../components/Blog/BlogCard"
import toast from "@utils/toast"
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
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { Helmet } from "react-helmet"
import useAuthStore from "@store/useAuthStore"
import { archiveBlog, fetchAllBlogs, retryBlog } from "@store/slices/blogSlice"
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

const MyProjects = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = user?._id || "guest"
  const { handleProAction } = useProAction()
  const { handlePopup } = useConfirmPopup()

  const initialBlogFilter = {
    start: DATE_PRESETS[0].range[0].toISOString(),
    end: DATE_PRESETS[0].range[1].toISOString(),
    q: "",
    status: BLOG_STATUS.ALL,
    sort: SORT_OPTIONS[0].value,
  }
  // Initialize filters from sessionStorage or default to "All" preset
  const [blogFilters, setBlogFilters] = useState(() => {
    const item = sessionStorage.getItem(`user_${user?._id}_blog_filters`)
    return item ? JSON.parse(item) : initialBlogFilter
  })

  useEffect(() => {
    const field = sessionStorage.getItem(`user_${user?._id}_blog_filters`)
    if (field) {
      setBlogFilters(prev => ({ ...prev, ...JSON.parse(field) }) || {})
    } else {
      setBlogFilters(prev => ({ ...prev, start: user?.createdAt }))
    }
  }, [user?.createdAt])

  const { isLoading, isRefetching, data, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
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
        }
        params = Object.fromEntries(Object.entries(params).filter(([_, v]) => Boolean(v)))
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
        // allPages.flatMap(...).length === total blogs already loaded
        return lastPage.hasMore ? (lastPage.page ?? 1) + 1 : undefined
      },
      enabled: !!user,
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      onError: error => {
        console.error("Failed to fetch blogs:", {
          error: error.message,
          status: error.status,
          response: error.response,
        })
        toast.error("Failed to load blogs. Please try again.")
      },
    })

  // Flatten all pages
  const allBlogs = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data])
  // const hasMore = data?.pages[data?.pages.length - 1]?.hasMore ?? false
  const totalItems = data?.pages[0]?.totalItems ?? 0
  const inputRef = useRef(null)

  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isFunnelMenuOpen, setFunnelMenuOpen] = useState(false)

  // // Reset filters to default
  const resetFilters = useCallback(() => {
    setBlogFilters(prev => ({ ...initialBlogFilter, start: user?.createdAt }))
    if (inputRef?.current && inputRef.current?.input?.value) inputRef.current.input.value = ""
    sessionStorage.removeItem(`user_${userId}_blog_filters`)
  }, [user])

  const hasActiveDates = useMemo(() => {
    if (!blogFilters || !initialBlogFilter) return false

    // normalize date fields before comparing
    const sameStart = blogFilters.start === user?.createdAt
    const sameEnd = blogFilters.end === initialBlogFilter.end

    return !sameStart || !sameEnd
  }, [blogFilters, user?.createdAt])

  const hasActiveFilters = useMemo(() => {
    if (!blogFilters || !initialBlogFilter) return false

    const isOtherChanged = Object.keys(blogFilters).some(key => {
      if (key === "start" || key === "end") return false
      return JSON.stringify(blogFilters[key]) !== JSON.stringify(initialBlogFilter[key])
    })

    return hasActiveDates || isOtherChanged
  }, [blogFilters, user?.createdAt])

  // Socket for real-time updates
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !user) {
      console.warn("⚠️ Socket or user not available for MyProjects")
      return
    }

    const handleStatusChange = data => {
      queryClient
        .refetchQueries({ queryKey: ["blogs"], type: "active" })
        .then(() => {
          console.debug("Blogs refetched successfully after socket event")
        })
        .catch(err => {
          console.error("Failed to refetch blogs:", err)
        })
    }

    socket.on("blog:statusChanged", handleStatusChange)

    return () => {
      socket.off("blog:statusChanged", handleStatusChange)
    }
  }, [user, userId, queryClient])

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

  const handleRetry = useCallback(async id => {
    try {
      await retryBlogById(id)
      toast.success("Blog will be regenerated shortly")
      refetch()
    } catch (err) {
      toast.error("Failed to retry blog")
    }
  }, [])

  const handleArchive = useCallback(async id => {
    try {
      await archiveBlogById(id)
      toast.success("Blog archived successfully")
      refetch()
    } catch (err) {
      toast.error("Failed to archive")
    }
  }, [])

  // Menu options
  const menuOptions = useMemo(
    () =>
      SORT_OPTIONS.map(opt => ({
        ...opt,
        onClick: _ => {
          updateBlogFilters({ sort: opt.value })
        },
      })),
    []
  )

  // Funnel menu options
  const funnelMenuOptions = useMemo(
    () =>
      BLOG_STATUS_OPTIONS.map(opt => ({
        ...opt,
        onClick: _ => {
          updateBlogFilters({ status: opt.value })
        },
      })),
    []
  )

  const updateBlogFilters = useCallback(
    updates => {
      setBlogFilters(prev => {
        const newValue = { ...prev, ...updates }
        sessionStorage.setItem(`user_${userId}_blog_filters`, JSON.stringify(newValue))
        return newValue
      })
    },
    [blogFilters, userId]
  )

  // -------------------------------------------------
  // AUTO LOAD ON SCROLL
  // -------------------------------------------------
  // const { ref: loadMoreRef, inView } = useInView({
  //   threshold: 0,
  //   rootMargin: "300px",
  // })

  // useEffect(() => {
  //   if (inView && hasNextPage && !isFetchingNextPage) {
  //     fetchNextPage()
  //   }
  // }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // -------------------------------------------------
  // CLIENT-SIDE FILTERING (only when ALL data loaded)
  // -------------------------------------------------
  // const displayedBlogs = useMemo(() => {
  //   let list = hasMore ? allBlogs : [...allBlogs]

  //   // Client-side search
  //   if (!hasMore && blogFilters.q) {
  //     const fuse = new Fuse(list, {
  //       keys: ["title", "focusKeywords"],
  //       threshold: 0.3,
  //     })
  //     list = fuse.search(blogFilters.q).map(r => r.item)
  //   }

  //   // Client-side status
  //   if (!hasMore && blogFilters.status !== BLOG_STATUS.ALL) {
  //     list = list.filter(b => b.status === blogFilters.status)
  //   }

  //   // Client-side sort
  //   if (!hasMore) {
  //     list.sort((a, b) => {
  //       const [sortType, sortOrder] = blogFilters.sort.split(":")
  //       if (sortType === "title") {
  //         return sortOrder === "asc"
  //           ? a.title.localeCompare(b.title)
  //           : b.title.localeCompare(a.title)
  //       }
  //       const da = new Date(a[blogFilters.sortType])
  //       const db = new Date(b[blogFilters.sortType])
  //       return blogFilters.sortOrder === "asc" ? da - db : db - da
  //     })
  //   }

  //   // Slice for current "page" (UI only)
  //   // const start = (blogFilters.page - 1) * ITEMS_PER_PAGE
  //   return list
  // }, [allBlogs, blogFilters, hasMore])

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
            className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
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
        <div className="flex gap-3">
          <div
            onClick={() => {
              handleProAction(() => {
                navigate("/blog-editor")
              })
            }}
            className="flex items-center gap-2 px-6 h-12 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-2xl transition-all shadow-xl shadow-blue-200/50 hover:shadow-blue-300 font-black text-sm cursor-pointer active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New Blog
          </div>
          <button
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["blogs", userId, blogFilters],
                refetchType: "all",
              })
            }
            className="btn btn-ghost h-12 px-5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all flex items-center gap-2 group"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-[24px] border border-slate-100 mb-8 shadow-sm">
        <div className="w-full lg:w-1/3">
          <DebouncedSearchInput
            initialValue={blogFilters.q}
            onSearch={value => {
              updateBlogFilters({ q: value })
            }}
            placeholder="Search projects..."
            className="w-full bg-white h-12 rounded-2xl border-slate-200 focus:border-blue-500 transition-all font-medium text-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 flex-1">
          <div className="dropdown dropdown-bottom dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className={`btn btn-ghost h-12 px-5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-sm transition-all flex items-center gap-3 normal-case ${
                blogFilters.sort !== SORT_OPTIONS[0].value
                  ? "border-blue-300 bg-blue-50/50 text-blue-600 ring-4 ring-blue-500/10"
                  : "text-slate-600"
              }`}
            >
              <ArrowDownUp className="w-4 h-4" />
              <span className="font-bold">
                Sort: {menuOptions.find(t => t.value === blogFilters.sort).label}
              </span>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-50 menu p-2 shadow-2xl bg-white rounded-3xl w-56 mt-2 border border-slate-100 animate-in fade-in slide-in-from-top-2"
            >
              {menuOptions.map(({ label, icon, onClick }) => (
                <li key={label}>
                  <button
                    onClick={onClick}
                    className="rounded-2xl py-3 px-4 hover:bg-indigo-50 hover:text-indigo-600 transition-all gap-3"
                  >
                    <span className="text-xl opacity-70">{icon}</span>
                    <span className="font-bold">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="dropdown dropdown-bottom dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className={`btn btn-ghost h-12 px-5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-sm transition-all flex items-center gap-3 normal-case ${
                blogFilters.status !== BLOG_STATUS.ALL
                  ? "border-emerald-300 bg-emerald-50/50 text-emerald-600 ring-4 ring-emerald-500/10"
                  : "text-slate-600"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="font-bold">
                Filter: {funnelMenuOptions.find(t => t.value === blogFilters.status).label}
              </span>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-50 menu p-2 shadow-2xl bg-white rounded-3xl w-56 mt-2 border border-slate-100 animate-in fade-in slide-in-from-top-2"
            >
              {funnelMenuOptions.map(({ label, icon, onClick }) => (
                <li key={label}>
                  <button
                    onClick={onClick}
                    className="rounded-2xl py-3 px-4 hover:bg-emerald-50 hover:text-emerald-600 transition-all gap-3"
                  >
                    <span className="text-xl opacity-70">{icon}</span>
                    <span className="font-bold">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={resetFilters}
            className={`btn btn-ghost h-12 px-6 rounded-2xl border transition-all normal-case font-bold flex items-center gap-2 ${
              hasActiveFilters
                ? "border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                : "border-slate-200 bg-white text-slate-400 opacity-50 cursor-not-allowed"
            }`}
            disabled={!hasActiveFilters}
          >
            <RotateCcw className={`w-4 h-4 ${hasActiveFilters ? "animate-spin-once" : ""}`} />
            Reset
          </button>
        </div>

        <div className="w-full lg:w-1/3">
          <DateRangePicker
            value={[dayjs(blogFilters.start), dayjs(blogFilters.end)]}
            minDate={user?.createdAt ? dayjs(user.createdAt) : undefined}
            maxDate={dayjs()}
            onChange={dates => {
              updateBlogFilters({
                ...(dates[0] ? { start: dates[0].toISOString(), end: dates[1].toISOString() } : {}),
              })
            }}
            className={clsx(
              "w-full h-12 rounded-2xl border-slate-200",
              hasActiveDates && "border-indigo-400! bg-indigo-50/30!"
            )}
          />
        </div>
      </div>
      <AnimatePresence>
        {isLoading || isRefetching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[...Array(ITEMS_PER_PAGE)].map((_, index) => (
              <div key={index} className="bg-white shadow-md rounded-lg p-4 sm:p-6">
                <SkeletonLoader />
              </div>
            ))}
          </div>
        ) : allBlogs.length === 0 ? (
          <div
            className="flex flex-col justify-center items-center"
            style={{ minHeight: "calc(100vh - 270px)" }}
          >
            <img src="Images/no-blog.webp" alt="No blogs" className="w-20 sm:w-24" />
            <p className="text-lg sm:text-xl mt-5">No blogs available.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 place-items-center p-2">
              {allBlogs.map(blog => (
                <BlogCard
                  key={blog._id}
                  blog={blog}
                  onBlogClick={handleBlogClick}
                  onManualBlogClick={handleManualBlogClick}
                  onRetry={handleRetry}
                  onArchive={handleArchive}
                  handlePopup={handlePopup}
                  hasGSCPermissions={Boolean(user?.gsc?.length)}
                />
              ))}
            </div>
            {/* Total */}
            {/* INFINITE SCROLL SENTINEL */}
            {hasNextPage && (
              <div className="mt-12 flex flex-col items-center gap-8">
                <div className="px-5 py-2 bg-slate-100 text-slate-500 rounded-full text-xs font-bold tracking-widest uppercase shadow-xs">
                  Showing {allBlogs.length} of {totalItems} projects
                </div>
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="btn btn-primary h-14 px-12 rounded-[24px] font-black text-lg bg-linear-to-r from-blue-600 to-indigo-600 border-none text-white shadow-2xl shadow-blue-200 normal-case hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isFetchingNextPage ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    "Load More Results"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MyProjects
