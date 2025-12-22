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

  const initialBlogFilter = {
    start: DATE_PRESETS[0].range[0].toISOString(),
    end: DATE_PRESETS[0].range[1].toISOString(),
    q: "",
    status: BLOG_STATUS.ALL,
    sort: SORT_OPTIONS[0].value,
  }

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

  useEffect(() => {
    const field = sessionStorage.getItem(
      `user_${user?._id}_blog_filters_${isTrashcan ? "trash" : "active"}`
    )
    if (field) {
      setBlogFilters(prev => ({ ...prev, ...JSON.parse(field) } || {}))
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
      return lastPage.hasMore ? (lastPage.page ?? 1) + 1 : undefined
    },
    enabled: !!user && !isTrashcan,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  })

  // For trashed blogs - regular query with pagination
  const { data: trashData, isLoading: isLoadingTrash } = useQuery({
    queryKey: [
      "trashedBlogs",
      userId,
      blogFilters.status,
      blogFilters.q,
      blogFilters.start,
      blogFilters.end,
      currentPage,
      pageSize,
    ],
    queryFn: async () => {
      const queryParams = {
        isArchived: true,
        status: blogFilters.status !== BLOG_STATUS.ALL ? blogFilters.status : undefined,
        q: blogFilters.q || undefined,
        start: blogFilters.start || undefined,
        end: blogFilters.end || undefined,
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

  const resetFilters = useCallback(() => {
    setBlogFilters(prev => ({ ...initialBlogFilter, start: user?.createdAt }))
    if (inputRef?.current && inputRef.current?.input?.value) inputRef.current.input.value = ""
    sessionStorage.removeItem(`user_${userId}_blog_filters_${isTrashcan ? "trash" : "active"}`)
    setCurrentPage(1)
  }, [user, isTrashcan, userId, initialBlogFilter])

  const hasActiveDates = useMemo(() => {
    if (!blogFilters || !initialBlogFilter) return false
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
    [isTrashcan]
  )

  const handleArchive = useCallback(async id => {
    try {
      await archiveBlogById(id)
      message.success("Blog archived successfully")
      refetchActive()
    } catch (err) {
      message.error("Failed to archive")
    }
  }, [])

  const handleRestore = useCallback(
    async id => {
      try {
        await dispatch(restoreTrashedBlog(id)).unwrap()
        queryClient.invalidateQueries({ queryKey: ["trashedBlogs"], exact: false })
        queryClient.invalidateQueries({ queryKey: ["blogs"], exact: false })
        message.success("Blog restored successfully")
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
    []
  )

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
        sessionStorage.setItem(
          `user_${userId}_blog_filters_${isTrashcan ? "trash" : "active"}`,
          JSON.stringify(newValue)
        )
        return newValue
      })
    },
    [blogFilters, userId, isTrashcan]
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
    <div className="p-2 md:p-4 lg:p-8 max-w-full">
      <Helmet>
        <title>{isTrashcan ? "Trashcan" : "Blogs"} | GenWrite</title>
      </Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1 mt-5 p-2 md:mt-0 md:p-0">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            {isTrashcan ? "Trashcan" : "Blogs Generated"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-gray-500 text-sm mt-2 max-w-md"
          >
            {isTrashcan
              ? "Restore valuable work or permanently delete clutter. Trashed items are deleted after 7 days."
              : "All our blogs in one place. Explore insights, tips, and strategies to level up your content creation."}
          </motion.p>
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Flex gap={8} justify="center" align="center">
            {!isTrashcan && (
              <div
                onClick={() => {
                  handleProAction(() => {
                    navigate("/blog-editor")
                  })
                }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium cursor-pointer"
              >
                <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
                New Blog
              </div>
            )}

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="default"
                icon={<RefreshCcw className="w-4 sm:w-5 h-4 sm:h-5" />}
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: isTrashcan
                      ? ["trashedBlogs", userId]
                      : ["blogs", userId, blogFilters],
                    refetchType: "all",
                  })
                }
                className="p-2 sm:p-3 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 w-full sm:w-auto text-xs sm:text-sm"
              >
                Refresh
              </Button>
            </motion.div>

            {isTrashcan && allBlogs.length > 0 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="default"
                  icon={<Trash2 className="w-4 sm:w-5 h-4 sm:h-5" />}
                  onClick={() =>
                    handlePopup({
                      title: "Delete All Trashed Blogs",
                      description: (
                        <span className="my-2">
                          All trashed blogs will be <b>permanently deleted</b>. This action cannot
                          be undone.
                        </span>
                      ),
                      onConfirm: handleBulkDelete,
                      confirmProps: {
                        type: "text",
                        className: "border-red-500 hover:bg-red-500 bg-red-100 text-red-600",
                      },
                      cancelProps: {
                        danger: false,
                      },
                    })
                  }
                  disabled={isLoading}
                  className="text-xs sm:text-sm px-4 py-2"
                >
                  Delete All
                </Button>
              </motion.div>
            )}
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
          ref={inputRef}
          size="middle"
          className="min-w-[300px] w-1/3 text-center border-0"
          placeholder="search blogs..."
          onSearch={value => {
            updateBlogFilters({ q: value })
          }}
          enterButton={<Search />}
          styles={{
            input: {
              border: "none !important",
            },
          }}
        />

        {!isTrashcan && (
          <>
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
                  ...(dates[0]
                    ? { start: dates[0].toISOString(), end: dates[1].toISOString() }
                    : {}),
                })
              }}
              className={clsx("min-w-[400px] !w-1/3", hasActiveDates && "border-purple-500")}
            />
          </>
        )}

        {isTrashcan && (
          <Select
            value={blogFilters.status}
            onChange={value => {
              updateBlogFilters({ status: value })
              setCurrentPage(1)
            }}
            className="w-full sm:w-48 rounded-lg text-xs sm:text-sm"
            placeholder="Filter by status"
            disabled={isLoading}
          >
            <Option value={BLOG_STATUS.ALL}>All Status</Option>
            <Option value="complete">Complete</Option>
            <Option value="failed">Failed</Option>
            <Option value="pending">Pending</Option>
          </Select>
        )}
      </Flex>

      {/* Blog Grid */}
      <AnimatePresence>
        {isLoading || isRefetching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[...Array(isTrashcan ? pageSize : ITEMS_PER_PAGE)].map((_, index) => (
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
            <img
              src={isTrashcan ? "Images/trash-can.png" : "Images/no-blog.png"}
              alt={isTrashcan ? "Trash" : "No blogs"}
              className="w-20 sm:w-24"
            />
            <p className="text-lg sm:text-xl mt-5">
              {isTrashcan ? "No trashed blogs available." : "No blogs available."}
            </p>
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
                  onArchive={isTrashcan ? undefined : handleArchive}
                  onRestore={isTrashcan ? handleRestore : undefined}
                  handlePopup={handlePopup}
                  hasGSCPermissions={Boolean(user?.gsc?.length)}
                  isTrashcan={isTrashcan}
                />
              ))}
            </div>

            {/* Pagination/Load More */}
            {!isTrashcan && hasNextPage && (
              <Flex vertical gap={12} justify="center" align="center" className="mt-4">
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
            )}

            {isTrashcan && totalItems > pageSize && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex justify-center mt-6"
              >
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalItems}
                  pageSizeOptions={[10, 15, 20, 50]}
                  onChange={(page, newPageSize) => {
                    setCurrentPage(page)
                    if (newPageSize !== pageSize) {
                      setPageSize(newPageSize)
                      setCurrentPage(1)
                    }
                  }}
                  showSizeChanger
                  showTotal={total => `Total ${total} blogs`}
                  responsive={true}
                  disabled={isLoading}
                />
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BlogsPage
