import React, { useState, useEffect, Suspense } from "react"
import { useNavigate } from "react-router-dom"
import axiosInstance from "@api/index"
import SkeletonLoader from "./SkeletonLoader"
import { Tooltip } from "antd"

const TRUNCATE_LENGTH = 85

const MyProjects = () => {
  const [blogsData, setBlogsData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get("/blogs/")
      console.log("Fetched Blogs Data:", response.data) // Ensure `aiModel` is logged
      setBlogsData(response.data?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentItems.map((blog) => {
              const { _id, title, content, focusKeywords, status, aiModel } = blog // Include `aiModel`
              return (
                <Tooltip
                  title={status === "complete" ? title : `Blog generation is ${status}`}
                  key={_id}
                  color={status === "complete" ? "black" : status === "failed" ? "red" : "orange"}
                  className={
                    (status === "failed"
                      ? "border-red-500"
                      : status !== "complete" && "border-yellow-500") + " border-2"
                  }
                >
                  <div
                    className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 rounded-xl p-4 cursor-pointer"
                    title={title}
                    onClick={() => {
                      if (status === "complete") {
                        handleBlogClick(blog)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                      {aiModel ?(
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          {aiModel}
                        </span>
                      ):(
                        
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Gemini
                      </span>
            )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{truncateContent(content)}</p>
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
                  </div>
                </Tooltip>
              )
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
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
