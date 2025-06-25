import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axiosInstance from "@api/index"
import SkeletonLoader from "./SkeletonLoader"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Badge, Button, Input, Popconfirm, Tooltip, Select, Modal, Popover } from "antd"
import { ArrowDownUp, Funnel, Menu, RefreshCcw, RotateCcw, Search, Trash2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import {
  CalendarOutlined,
  CheckCircleOutlined,
  SortAscendingOutlined,
  HourglassOutlined,
  CloseCircleOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons"
import { Helmet } from "react-helmet"

const TRUNCATE_LENGTH = 120

// [ s] DONE fix ui of sorting and filtering like leet code and install button to clear filter
// [ s] DONE in editor send the keywords to backend
// [ s] DONE in editor regenerate show the credit deduct it will minus 10 credit.
// [ s] DONE remove filter status line
// [ s] DONE in progress border yellow & change color of tooltip in pending
// [ s] DONE proofreading will be work only in normal editor
// [ s] DONE remove message in proofreading payload
// [ s] DONE get blog by id call in editor store the changes in redux

const MyProjects = () => {
  const [blogsData, setBlogsData] = useState([])
  const [filteredBlogs, setFilteredBlogs] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [loading, setLoading] = useState(true)
  const [sortType, setSortType] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [statusFilter, setStatusFilter] = useState("all") // New state for status filter
  const navigate = useNavigate()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [funnelMenuOpen, setFunnelMenuOpen] = useState(false)
  const [isSearchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchType, setSearchType] = useState("title")
  const [isSearchModalOpen, setSearchModalOpen] = useState(false)
  const { handlePopup } = useConfirmPopup()

  const toggleSearch = () => setSearchModalOpen(true)
  const toggleMenu = () => {
    setMenuOpen((prev) => {
      if (!prev) setFunnelMenuOpen(false) // close funnel if opening menu
      return !prev
    })
  }

  const toggleFunnelMenu = () => {
    setFunnelMenuOpen((prev) => {
      if (!prev) setMenuOpen(false) // close menu if opening funnel
      return !prev
    })
  }

  const resetFilters = () => {
    setSortOrder("")
    setSortType("")
    setStatusFilter("all")
  }

  const handleSearch = () => {
    setSearchTerm("")
    setDebouncedSearch("")
    setSearchOpen(false)
  }

  const handleSearchModalOk = () => {
    setSearchOpen(true)
    setSearchModalOpen(false)
  }

  const handleSearchModalCancel = () => {
    setSearchModalOpen(false)
  }

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get("/blogs/")
      const filteredBlogs = response.data.filter((blog) => !blog.isArchived)
      setBlogsData(filteredBlogs)
      applySortAndFilter(
        filteredBlogs,
        sortType,
        sortOrder,
        debouncedSearch,
        searchType,
        statusFilter
      )
    } catch (error) {
      console.error(
        "Error fetching blogs:",
        error.response?.data?.message || "Failed to fetch blogs"
      )
    } finally {
      setLoading(false)
    }
  }

  const applySortAndFilter = (blogs, sortBy, order, search, searchType, status) => {
    let sortedBlogs = [...blogs]

    // Apply status filter
    if (status !== "all") {
      sortedBlogs = sortedBlogs.filter((blog) => blog.status.toLowerCase() === status.toLowerCase())
    }

    // Apply search filter
    if (search) {
      sortedBlogs = sortedBlogs.filter((blog) => {
        if (searchType === "title") {
          return blog.title.toLowerCase().includes(search.toLowerCase())
        } else {
          return (
            blog.focusKeywords &&
            blog.focusKeywords.some((keyword) =>
              keyword.toLowerCase().includes(search.toLowerCase())
            )
          )
        }
      })
    }

    // Apply sorting
    sortedBlogs.sort((a, b) => {
      if (sortBy === "az") {
        return order === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      } else {
        return order === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

    setFilteredBlogs(sortedBlogs)
    setCurrentPage(1)
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 400)

    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    fetchBlogs()
  }, [])

  useEffect(() => {
    applySortAndFilter(blogsData, sortType, sortOrder, debouncedSearch, searchType, statusFilter)
  }, [blogsData, sortType, sortOrder, debouncedSearch, searchType, statusFilter])

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerPage(15)
      } else if (window.innerWidth >= 768) {
        setItemsPerPage(12)
      } else {
        setItemsPerPage(6)
      }
    }

    updateItemsPerPage()
    window.addEventListener("resize", updateItemsPerPage)

    return () => window.removeEventListener("resize", updateItemsPerPage)
  }, [])

  const handleBlogClick = (blog) => {
    navigate(`/toolbox/${blog._id}`)
  }

  const handleRetry = async (id) => {
    const payload = {
      createNew: false,
    }
    try {
      const response = await axiosInstance.post(`blogs/${id}/retry`, payload)
      if (response.status === 200) {
        toast.success(response?.data?.message || "Blog regenerated successfully!")
        fetchBlogs()
      } else {
        toast.error("Failed to regenerate blog.")
      }
    } catch (error) {
      toast.error("Failed to regenerate blog.")
      console.error(
        "Error regenerating blog:",
        error.response?.data?.message || "Failed to restore blog"
      )
    }
  }

  const truncateContent = (content, length = TRUNCATE_LENGTH) => {
    if (!content) return ""
    return content.length > length ? content.substring(0, length) + "..." : content
  }

  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentItems = filteredBlogs.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handleArchive = async (id) => {
    try {
      const response = await axiosInstance.patch(`/blogs/archive/${id}`)
      if (response.status === 200) {
        setBlogsData((prev) => prev.filter((blog) => blog._id !== id))
        toast.success("Blog archived successfully!")
      } else {
        toast.error("Failed to archive blog.")
      }
    } catch (error) {
      toast.error("Failed to archive blog.")
      console.error(
        "Error archiving blog:",
        error.response?.data?.message || "Failed to archive blog"
      )
    }
  }

  const menuOptions = [
    {
      label: "A-Z (Ascending)",
      icon: <SortAscendingOutlined />,
      onClick: () => {
        setSortType("az")
        setSortOrder("asc")
        setMenuOpen(false)
      },
    },
    {
      label: "Z-A (Descending)",
      icon: <SortDescendingOutlined />,
      onClick: () => {
        setSortType("az")
        setSortOrder("desc")
        setMenuOpen(false)
      },
    },
    {
      label: "Created Date (Newest)",
      icon: <CalendarOutlined />,
      onClick: () => {
        setSortType("createdAt")
        setSortOrder("desc")
        setMenuOpen(false)
      },
    },
    {
      label: "Created Date (Oldest)",
      icon: <CalendarOutlined />,
      onClick: () => {
        setSortType("createdAt")
        setSortOrder("asc")
        setMenuOpen(false)
      },
    },
  ]

  const funnelMenuOptions = [
    // {
    //   label: "Status: All",
    //   icon: <CheckCircleOutlined />,
    //   onClick: () => {
    //     setStatusFilter("all")
    //     setFunnelMenuOpen(false)
    //   },
    // },
    {
      label: "Status: Completed",
      icon: <CheckCircleOutlined />,
      onClick: () => {
        setStatusFilter("complete")
        setFunnelMenuOpen(false)
      },
    },
    {
      label: "Status: Pending",
      icon: <HourglassOutlined />,
      onClick: () => {
        setStatusFilter("pending")
        setFunnelMenuOpen(false)
      },
    },
    {
      label: "Status: Failed",
      icon: <CloseCircleOutlined />,
      onClick: () => {
        setStatusFilter("failed")
        setFunnelMenuOpen(false)
      },
    },
  ]

  const handleRefresh = async () => {
    await fetchBlogs()
  }

const stripMarkdown = (text) => {
  return text
    ?.replace(/<[^>]*>/g, "")            // Remove HTML tags like <h1>, <p>, etc.
    ?.replace(/[\\*#=_~`>\-]+/g, "")     // Remove markdown special characters
    ?.replace(/\s{2,}/g, " ")            // Collapse multiple spaces
    ?.trim();                            // Trim leading/trailing whitespace
};

  return (
    <div className="p-5">
      <Helmet>
        <title>Blogs | GenWrite</title>
      </Helmet>
      <ToastContainer />
      <div className="flex justify-between align-middle items-center">
        <div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Blogs Generated
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 max-w-xl mt-2 mb-5"
          >
            All your content creation tools in one place. Streamline your workflow with our powerful
            suite of tools.
          </motion.p>
        </div>
        <div className="flex gap-3">
          <Popover
            content={
              <div className="flex flex-col gap-4 w-64">
                <Select
                  defaultValue="title"
                  onChange={(value) => setSearchType(value)}
                  options={[
                    { value: "title", label: "Search by Title" },
                    { value: "keywords", label: "Search by Focus Keywords" },
                  ]}
                />
                <Input
                  placeholder={`Search by ${
                    searchType === "title" ? "title" : "focus keywords"
                  }...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onPressEnter={handleSearchModalOk}
                />
                <Button type="primary" onClick={handleSearchModalOk}>
                  Search
                </Button>
              </div>
            }
            title="Search Blogs"
            trigger="click"
            placement="bottomRight"
            open={isSearchModalOpen}
            onOpenChange={(visible) => setSearchModalOpen(visible)}
          >
            <Tooltip title="Search">
              {isSearchOpen ? (
                <Input
                  autoFocus
                  size="small"
                  placeholder={`Search by ${
                    searchType === "title" ? "title" : "focus keywords"
                  }...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onPressEnter={handleSearch}
                  onBlur={() => setSearchOpen(false)}
                  className="w-48"
                />
              ) : (
                <Button type="text" icon={<Search />} onClick={toggleSearch} />
              )}
            </Tooltip>
          </Popover>

          <Tooltip title="Refresh">
            <Button type="button" className="p-0" onClick={handleRefresh}>
              <RefreshCcw />
            </Button>
          </Tooltip>

          <Popover
            open={isMenuOpen}
            onOpenChange={(visible) => setMenuOpen(visible)}
            trigger="click"
            placement="bottomRight"
            content={
              <div className="min-w-[200px] rounded-lg shadow-lg border bg-white backdrop-blur-md p-2 space-y-1">
                {menuOptions.map(({ label, icon, onClick }) => (
                  <Tooltip title={label} placement="left" key={label}>
                    <button
                      onClick={onClick}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
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
              <Tooltip title="Sort">
                <Button
                  type="button"
                  icon={<ArrowDownUp />}
                  onClick={toggleMenu}
                  className="pt-1"
                />
              </Tooltip>
            </motion.div>
          </Popover>

          <Popover
            open={funnelMenuOpen}
            onOpenChange={(visible) => setFunnelMenuOpen(visible)}
            trigger="click"
            placement="bottomRight"
            content={
              <div className="min-w-[200px] rounded-lg shadow-lg border bg-white backdrop-blur-md p-2 space-y-1">
                {funnelMenuOptions.map(({ label, icon, onClick }) => (
                  <Tooltip title={label} placement="left" key={label}>
                    <button
                      onClick={onClick}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
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
              <Tooltip title="Filter">
                <Button
                  type="button"
                  icon={<Funnel />}
                  onClick={toggleFunnelMenu}
                  className="pt-1"
                />
              </Tooltip>
            </motion.div>
          </Popover>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Tooltip title="Reset Filters">
              <Button type="button" icon={<RotateCcw />} onClick={resetFilters} className="pt-1" />
            </Tooltip>
          </motion.div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(itemsPerPage)].map((_, index) => (
            <div key={index} className="bg-white shadow-md rounded-xl p-4">
              <SkeletonLoader />
            </div>
          ))}
        </div>
      ) : currentItems.length === 0 ? (
        <div
          className="flex flex-col justify-center items-center"
          style={{ minHeight: "calc(100vh - 270px)" }}
        >
          <img src="Images/no-blog.png" alt="Trash" style={{ width: "8rem" }} />
          <p className="text-xl mt-5">No blogs available.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center p-2">
            {currentItems?.map((blog) => {
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
                    <span className="flex items-center justify-center gap-1 py-1 font-medium tracking-wide">
                      <img
                        src={`./Images/${isGemini ? "gemini" : "chatgpt"}.png`}
                        alt=""
                        width={20}
                        height={20}
                        loading="lazy"
                        className="bg-white"
                      />
                      {isGemini ? "Gemini-1.5-flash" : "Chatgpt-4o-mini"}
                    </span>
                  }
                  className="absolute top-0"
                  color={isGemini ? "#4796E3" : "#74AA9C"}
                >
                  <div
                    className={`bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl p-4 min-h-[180px] min-w-[390px] relative
                      ${
                        (status === "failed"
                          ? "border-red-500"
                          : status === "pending" || status === "in-progress"
                          ? "border-yellow-500"
                          : "border-green-500") + " border-2"
                      }
                    `}
                    title={title}
                  >
                    <div className="text-xs font-semibold text-gray-400 mb-2 -mt-2">
                      {new Date(createdAt).toLocaleDateString("en-US", {
                        dateStyle: "medium",
                      })}
                    </div>
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
                      >
                        <div className="flex flex-col gap-4 items-center justify-between mb-2">
                          <h3 className="text-lg capitalize font-semibold text-gray-900 !text-left max-w-76">
                            {title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-all">
                            {stripMarkdown(content) || ""}
                          </p>
                        </div>
                      </div>
                    </Tooltip>
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex flex-wrap gap-2">
                        {focusKeywords?.map((keyword, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full"
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
                          <RotateCcw />
                        </Popconfirm>
                      )}
                      <Button
                        type="undefined"
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
                              type: "undefined",
                              className: "border-red-500 hover:bg-red-500 hover:text-white",
                            },
                            cancelProps: {
                              danger: false,
                            },
                          })
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="mt-3 -mb-2 flex justify-end text-xs text-right text-gray-500 font-medium">
                      {wordpress?.postedOn && (
                        <span className="">
                          Posted on :  
                          {new Date(wordpress.postedOn).toLocaleDateString("en-US", {
                            dateStyle: "medium",
                          })}
                        </span>
                      )}
                      <span className="ml-auto">
                        Last updated :  
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
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 self-end">
              <nav className="inline-flex rounded-md shadow">
                <ul className="flex">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <li key={index}>
                      <button
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-4 py-2 border-r border-gray-200 text-sm font-medium ${
                          currentPage === index + 1
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        } ${index === 0 ? "rounded-l-md" : ""} ${
                          index === totalPages - 1 ? "rounded-r-md border-r-0" : ""
                        }`}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MyProjects
