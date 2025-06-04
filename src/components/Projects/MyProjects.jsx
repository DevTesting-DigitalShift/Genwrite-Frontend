import React, { useState, useEffect, Suspense } from "react"
import { useNavigate } from "react-router-dom"
import axiosInstance from "@api/index"
import SkeletonLoader from "./SkeletonLoader"
import { Badge, Button, Tooltip } from "antd"
import { useNotification } from "@/context/NotificationsContext"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Trash2 } from "lucide-react"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"

const TRUNCATE_LENGTH = 120

const MyProjects = () => {
  const [blogsData, setBlogsData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { updateNotifications, fetchNotificationsFromBackend } = useNotification()
  const { handlePopup } = useConfirmPopup()

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get("/blogs/")
      const filteredBlogs = response.data.filter((blog) => !blog.isArchived) // Filter isArchived=false
      const sortedBlogs = filteredBlogs.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
      setBlogsData(sortedBlogs)
      updateNotifications(sortedBlogs) // <-- update notifications here
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
    fetchBlogs()
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
        // Fetch notifications from backend after archive
        fetchNotificationsFromBackend && fetchNotificationsFromBackend()
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

  return (
    <div className="max-w-7xl mx-auto" style={{ overflowY: "auto" }}>
      <h1 className="text-3xl font-bold mb-6">Blogs Generated</h1>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(itemsPerPage)].map((_, index) => (
            <div key={index} className="bg-white shadow-md rounded-xl p-4">
              <SkeletonLoader />
            </div>
          ))}
        </div>
      ) : currentItems.length === 0 ? (
        <p>No blogs available.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center p-2">
            {currentItems.map((blog) => {
              const { _id, title, content, focusKeywords, status, aiModel } = blog // Include `aiModel`
              return (
                <Badge.Ribbon
                  key={_id}
                  text={
                    <span className="flex items-center justify-center gap-1 p-1 font-medium">
                      <img
                        src="./Images/gemini.png"
                        alt=""
                        width={16}
                        height={16}
                        loading="lazy"
                        className="bg-white"
                      />
                      {aiModel ? aiModel.charAt(0).toUpperCase() + aiModel.slice(1) : "Gemini"}
                    </span>
                  }
                  className="absolute top-0"
                >
                  <div
                    className={`bg-white shadow-md  hover:shadow-xl  transition-all duration-300 rounded-xl p-4 min-h-[180px] relative
                        ${
                          (status === "failed"
                            ? "border-red-500"
                            : status !== "complete" && "border-yellow-500") + " border-2"
                        }
                      `}
                    title={title}
                  >
                    <div className="text-xs font-semibold text-gray-400 mb-2 -mt-2">
                      {new Date(blog.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <Tooltip
                      title={status === "complete" ? title : `Blog generation is ${status}`}
                      color={
                        status === "complete" ? "black" : status === "failed" ? "red" : "orange"
                      }
                    >
                      <div
                        className="cursor-pointer"
                        onClick={() => {
                          if (status === "complete") {
                            handleBlogClick(blog)
                          }
                        }}
                      >
                        {/* Gemini Model - Top Right */}
                        {/* <div className="absolute top-4 right-4 z-10  space-x-2"></div> */}
                        <div className="flex flex-col gap-4 items-center justify-between mb-2 ">
                          <h3 className="text-lg font-semibold text-gray-900 !text-left max-w-76">
                            {title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-all">
                            {content || ""}
                            {/* {truncateContent(content)} */}
                          </p>
                        </div>
                      </div>
                    </Tooltip>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        {focusKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <Button
                        type="undefined"
                        className="p-2 hover:!border-red-500 hover:text-red-500"
                        onClick={() =>
                          handlePopup({
                            title: "Move to Trash",
                            description: (
                              <span className="my-2">
                                Blog <b>{blog.title}</b> will be moved to trash. You can restore it later.
                              </span>
                            ),
                            confirmText: "Archieve",
                            onConfirm: () => {
                              console.log("Trashing blog:", blog._id)
                              handleArchive(blog._id)
                            },
                            confirmProps:{
                              type:"undefined",
                              className: "border-red-500 hover:bg-red-500 hover:text-white"
                            },
                            cancelProps:{
                              danger:false
                            }
                          })
                        }
                      >
                        <Trash2 />
                      </Button>
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
      <ToastContainer />
    </div>
  )
}

export default MyProjects
