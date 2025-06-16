import React, { useState, useEffect } from "react"
import axiosInstance from "@api/index"
import SkeletonLoader from "../components/Projects/SkeletonLoader"
import { Popconfirm, Tooltip } from "antd"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { QuestionCircleOutlined } from "@ant-design/icons"

const TRUNCATE_LENGTH = 85

const Trashcan = () => {
  const [trashedBlogs, setTrashedBlogs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTrashedBlogs = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get("/blogs/")
      const filteredBlogs = response.data.filter((blog) => blog.isArchived) // Filter isArchived=true
      setTrashedBlogs(filteredBlogs)
    } catch (error) {
      console.error(
        "Error fetching trashed blogs:",
        error.response?.data?.message || "Failed to fetch trashed blogs"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrashedBlogs()
  }, [])

  const truncateContent = (content, length = TRUNCATE_LENGTH) => {
    if (!content) return ""
    return content.length > length ? content.substring(0, length) + "..." : content
  }

  const handleRestore = async (id) => {
    try {
      const response = await axiosInstance.patch(`/blogs/restore/${id}`)
      if (response.status === 200) {
        setTrashedBlogs((prev) => prev.filter((blog) => blog._id !== id))
        toast.success("Blog restored successfully!")
      } else {
        toast.error("Failed to restore blog.")
      }
    } catch (error) {
      toast.error("Failed to restore blog.")
      console.error(
        "Error restoring blog:",
        (error.response && error.response.data && error.response.data.message) ||
          "Failed to restore blog"
      )
    }
  }

  return (
    <div className="max-w-7xl mx-auto" style={{ overflowY: "auto" }}>
      <h1 className="text-3xl font-bold mb-6">Trashcan</h1>
      <p className="text-red-600 font-semibold mb-4">
        Warning: Trashed items will be permanently deleted after 7 days.
      </p>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white shadow-md rounded-xl p-4">
              <SkeletonLoader />
            </div>
          ))}
        </div>
      ) : trashedBlogs.length === 0 ? (
        <p>No trashed blogs available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-2">
          {trashedBlogs.map((blog) => {
            const { _id, title, content, focusKeywords, aiModel, archiveDate } = blog
            return (
              <Tooltip key={_id} title={title} color="gray">
                <div className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <Popconfirm
                      title="Restore Blog"
                      description="Are you sure to restore the blog ?"
                      icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                      okText="Yes"
                      cancelText="No"
                      onConfirm={() => handleRestore(_id)}
                    >
                      <img
                        src="Images/restore.svg"
                        alt="Restore"
                        width="20"
                        height="20"
                        className="cursor-pointer restore-icon"
                      />
                    </Popconfirm>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-1">
                    {truncateContent(content)}
                  </p>
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
                  <span className="block mt-4 -mb-2 text-sm text-right">
                    Archive Date:{" "}
                    {new Date(archiveDate).toLocaleDateString("en-US", { dateStyle: "medium" })}
                  </span>
                </div>
              </Tooltip>
            )
          })}
        </div>
      )}
      <ToastContainer />
      <style>
        {`
          .restore-icon {
            transition: filter 0.2s, filter 0.2s;
          }
          .restore-icon:hover {
            filter: invert(18%) sepia(99%) saturate(7482%) hue-rotate(357deg) brightness(97%) contrast(119%);
          }
        `}
      </style>
    </div>
  )
}

export default Trashcan
