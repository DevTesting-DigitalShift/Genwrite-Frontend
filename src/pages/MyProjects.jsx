"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
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
import { AnimatePresence, motion } from "framer-motion"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { Helmet } from "react-helmet"
import { useDispatch, useSelector } from "react-redux"
import { selectUser } from "@store/slices/authSlice"
import { archiveBlog, fetchAllBlogs, retryBlog } from "@store/slices/blogSlice"
import dayjs from "dayjs"
import Fuse from "fuse.js"
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { getSocket } from "@utils/socket"
import isBetween from "dayjs/plugin/isBetween"
import clsx from "clsx"
import { debounce } from "lodash"
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
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useSelector(selectUser)
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
      setBlogFilters(prev => ({ ...prev, ...JSON.parse(field) } || {}))
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
        message.error("Failed to load blogs. Please try again.")
      },
    })

  // Flatten all pages
  const allBlogs = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data])
  // const hasMore = data?.pages[data?.pages.length - 1]?.hasMore ?? false
  const totalItems = data?.pages[0]?.totalItems ?? 0

  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isFunnelMenuOpen, setFunnelMenuOpen] = useState(false)

  // // Reset filters to default
  const resetFilters = useCallback(() => {
    setBlogFilters(prev => ({ ...initialBlogFilter, start: user?.createdAt }))
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
    if (!socket || !user) return

    const handleStatusChange = debounce(() => {
      queryClient.invalidateQueries({
        queryKey: ["blogs", userId, blogFilters],
        refetchType: "all", // ← Critical: refetch ALL pages
      })
    }, 1000)

    socket.on("blog:statusChanged", handleStatusChange)

    return () => {
      socket.off("blog:statusChanged", handleStatusChange)
      handleStatusChange.cancel?.()
    }
  }, [user, userId, queryClient])

  // Navigation handlers
  const handleBlogClick = useCallback(
    blog => {
      navigate(`/toolbox/${blog._id}`)
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
      message.success("Blog will be regenerated shortly")
      refetch()
    } catch (err) {
      message.error("Failed to retry blog")
    }
  }, [])

  const handleArchive = useCallback(async id => {
    try {
      await archiveBlogById(id)
      message.success("Blog archived successfully")
      refetch()
    } catch (err) {
      message.error("Failed to archive")
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
          <Flex gap={8} justify="center" align="center">
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
            {/* Refresh */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="default"
                icon={<RefreshCcw className="w-4 sm:w-5 h-4 sm:h-5" />}
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["blogs", userId, blogFilters],
                    refetchType: "all",
                  })
                }
                className="p-2 sm:p-3 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 w-full sm:w-auto text-xs sm:text-sm"
              >
                Refresh
              </Button>
            </motion.div>
          </Flex>
        </motion.div>
      </div>

      {/* Filter and Sort Bar */}
      <Flex
        justify="space-around"
        align="center"
        gap="middle"
        wrap={window?.innerWidth <= 1024}
        className="flex-col sm:flex-row p-4 sm:p-6 rounded-lg mb-4"
      >
        <Input.Search
          size="middle"
          className="min-w-[300px] w-1/3 text-center "
          placeholder="search blogs..."
          onSearch={value => {
            updateBlogFilters({ q: value })
          }}
          enterButton={<Search />}
          allowClear
          styles={{
            input: {
              border: "none !important",
            },
          }}
        />

        {/* Sort */}
        <Popover
          open={isMenuOpen}
          onOpenChange={visible => setMenuOpen(visible)}
          trigger="click"
          placement="bottomRight"
          content={
            <div className="min-w-[200px] rounded-lg space-y-1">
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
              className={`min-w-[210px] p-2 sm:p-3 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 w-full sm:w-auto text-xs sm:text-sm ${
                blogFilters.sort !== SORT_OPTIONS[0].value
                  ? "border-blue-400 bg-blue-50 text-blue-600"
                  : ""
              }`}
            >
              Sort: {menuOptions.find(t => t.value === blogFilters.sort).label}
            </Button>
          </motion.div>
        </Popover>

        {/* Filter */}
        <Popover
          open={isFunnelMenuOpen}
          onOpenChange={visible => setFunnelMenuOpen(visible)}
          trigger="click"
          placement="bottomRight"
          content={
            <div className="min-w-[200px] rounded-lg space-y-1">
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
              className={`min-w-[210px] p-2 sm:p-3 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 w-full sm:w-auto text-xs sm:text-sm ${
                blogFilters.status !== BLOG_STATUS.ALL
                  ? "border-green-400 bg-green-50 text-green-600"
                  : ""
              }`}
            >
              Filter: {funnelMenuOptions.find(t => t.value === blogFilters.status).label}
            </Button>
          </motion.div>
        </Popover>

        {/* Reset */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="default"
            icon={<RotateCcw className="w-4 sm:w-5 h-4 sm:h-5" />}
            onClick={resetFilters}
            className={`p-2 sm:p-3 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 w-full sm:w-auto text-xs sm:text-sm ${
              hasActiveFilters && "border-red-400 bg-red-50 text-red-600"
            }`}
          >
            Reset
          </Button>
        </motion.div>

        <DateRangePicker
          value={[dayjs(blogFilters.start), dayjs(blogFilters.end)]}
          minDate={user?.createdAt ? dayjs(user.createdAt) : undefined}
          maxDate={dayjs()}
          onChange={dates => {
            updateBlogFilters({
              ...(dates[0] ? { start: dates[0].toISOString(), end: dates[1].toISOString() } : {}),
            })
          }}
          className={clsx("min-w-[400px] !w-1/3", hasActiveDates && "border-purple-500")}
        />
      </Flex>
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
            <img src="Images/no-blog.png" alt="No blogs" className="w-20 sm:w-24" />
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
                />
              ))}
            </div>
            {/* Total */}
            {/* INFINITE SCROLL SENTINEL */}
            {hasNextPage && (
              <>
                <Flex vertical gap={12} justify="center" align="center" className="mt-4">
                  {/* <div ref={loadMoreRef} className="py-8 text-center">
               {isFetchingNextPage ? <Spinner /> : <div className="h-1" />}
               </div> */}
                  <div className="text-right text-sm text-gray-500 mr-0">
                    Showing {allBlogs.length} of {totalItems} blogs
                  </div>
                  <Button
                    loading={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? "loading..." : "Load More"}
                  </Button>
                </Flex>
              </>
            )}
            <style>{`
      .ant-input, .ant-input:focus, .ant-input-search .ant-input{
        border:none !important;
        height:100% !important;
      }

      ant-input-search .ant-input:focus, .ant-input-search .ant-input:hover{
        box-shadow:none !important;
      }
      
      `}</style>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MyProjects
