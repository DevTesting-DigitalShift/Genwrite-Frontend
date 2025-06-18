import React, { useState, useEffect, Suspense } from "react"
import { useNavigate } from "react-router-dom"
import axiosInstance from "@api/index"
import SkeletonLoader from "./SkeletonLoader"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Badge, Button, Input, Popconfirm, Tooltip } from "antd"
import { Menu, RefreshCcw, RotateCcw, Search, Trash2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons"

const TRUNCATE_LENGTH = 120

// [ ] DONE refresh button on the top right
// [ ] sorting and filter option
// 1. a-z 2. created date 3. status = pending, failed, complete 4. gemini and chatgpt (optional)
// [ ] search bar: based on title and keyboard (focus keyboard)
// [ ] DONE archive replace trash

// [ ] in editor blog score, Analysis Results, ca to SEO score
// [ ] save functionality in editor, if user doesn't save those changes show blog
// [ ]  DONE when ctrl+- editor width not correct
// [ ] QUERY once blog is post show re-post & show blog link

const MyProjects = () => {
  const [blogsData, setBlogsData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isSearchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const { handlePopup } = useConfirmPopup()

  const toggleMenu = () => setMenuOpen((prev) => !prev)
  const toggleSearch = () => setSearchOpen((prev) => !prev)

  const handleSearch = () => {
    setSearchTerm("")
  }

  const fetchBlogs = async ({ sortType = "date", filterStatus = null, search = "" } = {}) => {
    try {
      setLoading(true)

      // Build query params only if they are present
      const params = {}
      if (search) params.search = search
      if (filterStatus) params.status = filterStatus
      if (sortType) params.sortBy = sortType

      // Send the query to backend for better optimization
      const response = await axiosInstance.get("/blogs", { params })

      // Filter isArchived blogs (assuming backend doesn’t filter this)
      const blogs = response.data.filter((blog) => !blog.isArchived)

      setBlogsData(blogs)
    } catch (error) {
      console.error(
        "Error fetching blogs:",
        error.response?.data?.message || "Failed to fetch blogs"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 400) // 400ms debounce

    return () => clearTimeout(handler)
  }, [searchTerm])

  // Trigger blog fetch when debouncedSearch changes
  useEffect(() => {
    fetchBlogs({ sortBy: "date", search: debouncedSearch })
  }, [debouncedSearch])

  useEffect(() => {
    fetchBlogs("date") // default
  }, [])

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
    navigate(`/toolbox/${blog._id}`, { state: { blog } })
  }

  const handleRetry = async (id) => {
    const payload = {
      create_new: false,
    }
    try {
      const response = await axiosInstance.post(`blogs/${id}/retry`, payload)
      if (response.status === 200) {
        toast.success(response?.data?.message || "Blog regenerated successfully!")
      } else {
        toast.error("Failed to regenerated blog.")
      }
    } catch (error) {
      toast.error("Failed to regenerated blog.")
      console.error(
        "Error regenerating blog:",
        (error.response && error.response.data && error.response.data.message) ||
          "Failed to restore blog"
      )
    }
  }

  const truncateContent = (content, length = TRUNCATE_LENGTH) => {
    if (!content) return ""
    return content.length > length ? content.substring(0, length) + "..." : content
  }

  const totalPages = Math.ceil(blogsData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentItems = blogsData.slice(startIndex, startIndex + itemsPerPage)

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
        (error.response && error.response.data && error.response.data.message) ||
          "Failed to archive blog"
      )
    }
  }

  const menuOptions = [
    {
      label: "A-Z",
      icon: <SortAscendingOutlined />,
      onClick: () => {
        fetchBlogs("az")
        setMenuOpen(false)
      },
    },
    {
      label: "Created Date",
      icon: <CalendarOutlined />,
      onClick: () => {
        fetchBlogs("date")
        setMenuOpen(false)
      },
    },
    {
      label: "Status",
      icon: <CheckCircleOutlined />,
      onClick: () => {
        // Example: Filter only 'published' status
        fetchBlogs("date", "published")
        setMenuOpen(false)
      },
    },
  ]

  const handleRefresh = async () => {
    await fetchBlogs()
  }

  return (
    <div className="p-5">
      <ToastContainer  />
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
          {isSearchOpen ? (
            <Input
              autoFocus
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onPressEnter={handleSearch}
              onBlur={() => setSearchOpen(false)} // closes when clicked outside
              className="w-48"
            />
          ) : (
            <Button
              type="button"
              className="p-0 hover:!border-yellow-500 hover:text-yellow-500"
              onClick={toggleSearch}
            >
              <Search />
            </Button>
          )}
          <Button
            type="button"
            className="p-2 hover:!border-yellow-500 hover:text-yellow-500"
            onClick={() => handleRefresh()}
          >
            <RefreshCcw />
          </Button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="default"
              icon={isMenuOpen ? <CloseOutlined /> : <Menu />}
              onClick={toggleMenu}
              className="pt-1"
            />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[12rem] right-10 z-50 min-w-[200px] rounded-lg shadow-lg border bg-white backdrop-blur-md p-2 space-y-1"
          >
            {menuOptions.map(({ label, icon, onClick }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Tooltip title={label} placement="left">
                  <button
                    onClick={() => {
                      onClick()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-lg">{icon}</span>
                    <span>{label}</span>
                  </button>
                </Tooltip>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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
              // [ s] Create a universal blog card to show wherever we need, use it here & in trashcan with all event handlers
              // [ s] When blog is failed show user retry button [/blogs/:id/retry] - POST payload: create_new- boolean.
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
                    className={`bg-white shadow-md  hover:shadow-xl  transition-all duration-300 rounded-xl p-4 min-h-[180px] min-w-[390px] relative
                        ${
                          (status === "failed"
                            ? "border-red-500"
                            : status !== "complete" && "border-yellow-500") + " border-2"
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
                          : ["failed", "in-progress"].includes(status)
                          ? `Blog generation is ${status}`
                          : `Pending Blog will be generated ${
                              agendaJob?.nextRunAt
                                ? "at " +
                                  new Date(agendaJob.nextRunAt).toLocaleString("en-IN", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })
                                : "shortly"
                            }`
                      }
                      color={
                        status === "complete" ? "black" : status === "failed" ? "red" : "orange"
                      }
                    >
                      <div
                        className="cursor-pointer"
                        onClick={() => {
                          const { status } = blog
                          if (status === "complete") {
                            handleBlogClick(blog)
                          }
                        }}
                      >
                        {/* Gemini Model - Top Right */}
                        {/* <div className="absolute top-4 right-4 z-10  space-x-2"></div> */}
                        <div className="flex flex-col gap-4 items-center justify-between mb-2 ">
                          <h3 className="text-lg capitalize font-semibold text-gray-900 !text-left max-w-76">
                            {title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-all">
                            {content || ""}
                            {/* {truncateContent(content)} */}
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
                          Posted on : &nbsp;
                          {new Date(wordpress.postedOn).toLocaleDateString("en-US", {
                            dateStyle: "medium",
                          })}
                        </span>
                      )}
                      <span className="ml-auto">
                        Last updated : &nbsp;
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
