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
  const inputRef = useRef(null)
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
      setBlogFilters(prev => ({ ...prev, ...parsedFilters } || {}))
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
      return {
        trashedBlogs: response.data || [],
        totalBlogs: response.totalItems || 0,
      }
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

  const totalItems = isTrashcan ? trashData?.totalBlogs || 0 : activeData?.pages[0]?.totalItems ?? 0

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
    if (inputRef?.current) inputRef.current.input.value = ""
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
      queryClient.refetchQueries({
        queryKey: isTrashcan ? ["trashedBlogs"] : ["blogs"],
        type: "active",
      })
    }

    socket.on("blog:statusChanged", handleStatusChange)
    socket.on("blog:archived", handleStatusChange)
    socket.on("blog:restored", handleStatusChange)
    socket.on("blog:deleted", handleStatusChange)

    return () => {
      socket.off("blog:statusChanged", handleStatusChange)
      socket.off("blog:archived", handleStatusChange)
      socket.off("blog:restored", handleStatusChange)
      socket.off("blog:deleted", handleStatusChange)
    }
  }, [user, userId, queryClient, isTrashcan])

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
    <div className="p-4 md:p-6 lg:p-8">
      <Helmet>
        <title>{isTrashcan ? "Trashcan" : "Blogs"} | GenWrite</title>
      </Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8 mt-5 md:mt-0">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            {isTrashcan ? "Trashcan" : "Blogs Generated"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 text-sm mt-2 max-w-md"
          >
            {isTrashcan
              ? "Restore valuable work or permanently delete clutter. Trashed items are deleted after 7 days."
              : "All our blogs in one place. Explore insights, tips, and strategies to level up your content creation."}
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          {!isTrashcan && (
            <button
              onClick={() => handleProAction(() => navigate("/blog-editor"))}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium cursor-pointer custom-cursor-on-hover"
            >
              <Plus size={20} />
              New Blog
            </button>
          )}

          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: isTrashcan ? ["trashedBlogs"] : ["blogs"] })
            }
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium cursor-pointer custom-cursor-on-hover border"
          >
            <RefreshCcw size={15} className={isRefetching ? "animate-spin" : ""} /> Refresh
          </button>

          {isTrashcan && allBlogs.length > 0 && (
            <Button
              danger
              size="medium"
              icon={<Trash2 size={18} />}
              onClick={() =>
                handlePopup({
                  title: "Wipe Trashcan?",
                  description: "Permanently delete all blogs. This cannot be undone.",
                  onConfirm: handleBulkDelete,
                })
              }
              className="rounded-lg py-[1.1rem] font-semibold transition-all"
            >
              Empty All
            </Button>
          )}
        </div>
      </div>

      {/* Responsive Filter Bar */}
      <div className="bg-white rounded-2xl border-slate-100 mb-8">
        <Flex justify="between" align="center" gap="small" wrap="wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              ref={inputRef}
              placeholder="Search by title or keywords..."
              defaultValue={blogFilters.q}
              onChange={e => updateBlogFilters({ q: e.target.value })}
              className="h-11 pl-10 pr-4 bg-slate-50 border-none hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {/* Basic Filters (Visible on Desktop) */}
            <div className="hidden lg:flex items-center gap-2">
              <Select
                value={blogFilters.status}
                onChange={val => updateBlogFilters({ status: val })}
                className="h-11 min-w-[160px]"
                variant="filled"
                dropdownStyle={{ borderRadius: "12px" }}
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
                className="h-11 min-w-[160px]"
                variant="filled"
                dropdownStyle={{ borderRadius: "12px" }}
              >
                {SORT_OPTIONS.map(opt => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Advanced Filters Dropdown */}
            <Popover
              open={isDetailedFilterOpen}
              onOpenChange={setDetailedFilterOpen}
              trigger="click"
              placement="bottomRight"
              content={
                <div className="w-[320px] space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-700 m-0">Detailed Filters</h4>
                    <Button
                      type="text"
                      size="small"
                      onClick={resetFilters}
                      className="text-blue-600 font-semibold p-0 h-auto"
                    >
                      Reset All
                    </Button>
                  </div>

                  {/* Range Filters for Mobile/Tablet */}
                  <div className="lg:hidden space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Status
                      </p>
                      <Select
                        value={blogFilters.status}
                        onChange={val => updateBlogFilters({ status: val })}
                        className="w-full h-10"
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
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Sort Order
                      </p>
                      <Select
                        value={blogFilters.sort}
                        onChange={val => updateBlogFilters({ sort: val })}
                        className="w-full h-10"
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

                  <Divider className="my-0 lg:hidden" />

                  {/* GSC Metric Filters */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MousePointerClick size={12} /> Min. GSC Clicks
                      </p>
                      <InputNumber
                        min={0}
                        placeholder="e.g. 50"
                        value={tempGscClicks}
                        onChange={val => setTempGscClicks(val)}
                        className="w-full h-10 rounded-lg bg-slate-50 border-slate-200"
                        controls={false}
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Eye size={12} /> Min. GSC Impressions
                      </p>
                      <InputNumber
                        min={0}
                        placeholder="e.g. 1000"
                        value={tempGscImpressions}
                        onChange={val => setTempGscImpressions(val)}
                        className="w-full h-10 rounded-lg bg-slate-50 border-slate-200"
                        controls={false}
                      />
                    </div>
                  </div>

                  <Divider className="my-0" />

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={12} /> Date Range
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
                      className="!w-full !h-10 !rounded-lg !bg-slate-50 !border-slate-200"
                    />
                  </div>
                </div>
              }
            >
              <Button
                className={clsx(
                  "h-11 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-sm",
                  hasActiveFilters || blogFilters.gscClicks || blogFilters.gscImpressions
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-white text-slate-600 border-slate-200"
                )}
              >
                <Filter size={18} />
                <span className="hidden sm:inline">Advanced</span>
                <ChevronDown
                  size={14}
                  className={clsx("transition-transform", isDetailedFilterOpen && "rotate-180")}
                />
              </Button>
            </Popover>

            {hasActiveFilters && (
              <Button
                type="text"
                onClick={resetFilters}
                icon={<RotateCcw size={18} />}
                className="h-11 px-3 text-slate-400 hover:text-rose-500 rounded-xl"
              />
            )}
          </div>
        </Flex>
      </div>

      {/* Blog Grid */}
      <AnimatePresence mode="wait">
        {isLoading || isRefetching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-white shadow-sm rounded-2xl p-6 border border-slate-100"
              >
                <SkeletonLoader />
              </div>
            ))}
          </div>
        ) : allBlogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col justify-center items-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200"
          >
            <img
              src={isTrashcan ? "/Images/trash-can.webp" : "/Images/no-blog.webp"}
              alt="Empty"
              className="w-32 opacity-40 grayscale mb-6"
            />
            <h3 className="text-xl font-bold text-slate-400">No blogs found</h3>
            <p className="text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
            <Button type="link" onClick={resetFilters} className="mt-4 font-bold">
              Clear all filters
            </Button>
          </motion.div>
        ) : (
          <>
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {/* Pagination/Load More */}
            <div className="mt-12 flex flex-col items-center gap-4">
              {!isTrashcan && hasNextPage && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-slate-500 text-sm font-medium">
                    Showing {allBlogs.length} of {totalItems}
                  </span>
                  <Button
                    size="large"
                    loading={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                    className="h-12 px-10 rounded-xl bg-white border-slate-200 text-slate-700 font-semibold hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                  >
                    Load More
                  </Button>
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

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .modern-pagination .ant-pagination-item {
          border-radius: 8px;
        }
        .modern-pagination .ant-pagination-item-active {
          border-color: #3b82f6;
          background: #3b82f6;
        }
        .modern-pagination .ant-pagination-item-active a {
          color: white;
        }
      `}</style>
    </div>
  )
}

export default BlogsPage
