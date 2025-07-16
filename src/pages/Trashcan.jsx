import React, { useState, useEffect, useCallback } from "react"
import { Button, Tooltip, Popconfirm, Badge, Pagination } from "antd"
import { RefreshCcw, Trash2 } from "lucide-react"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { motion } from "framer-motion"
import { Helmet } from "react-helmet"
import { useDispatch } from "react-redux"
import SkeletonLoader from "@components/Projects/SkeletonLoader"
import { getAllBlogs } from "@api/blogApi"
import { deleteAllUserBlogs, restoreTrashedBlog } from "@store/slices/blogSlice"

const Trashcan = () => {
  const [trashedBlogs, setTrashedBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const { handlePopup } = useConfirmPopup()
  const dispatch = useDispatch()
  const TRUNCATE_LENGTH = 85
  const PAGE_SIZE = 15

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  const fetchTrashedBlogs = async () => {
    try {
      setLoading(true)
      const blogs = await getAllBlogs()
      const filteredBlogs = blogs.data.filter((blog) => blog.isArchived)
      setTrashedBlogs(filteredBlogs)
    } catch (error) {
      console.error("Error fetching trashed blogs:", error.message)
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
    await dispatch(restoreTrashedBlog(id))
    setTrashedBlogs((prev) => {
      const newBlogs = prev.filter((blog) => blog._id !== id)
      // If the current page becomes empty and it's not the first page, go to the previous page
      if (newBlogs.length <= (currentPage - 1) * PAGE_SIZE && currentPage > 1) {
        setCurrentPage((prevPage) => prevPage - 1)
      }
      return newBlogs
    })
  }

  const handleBulkDelete = async () => {
    await dispatch(deleteAllUserBlogs())
    setTrashedBlogs([])
    setCurrentPage(1)
  }

  const handleRefresh = async () => {
    await fetchTrashedBlogs()
    setCurrentPage(1) // Reset to first page on refresh
  }

  // Calculate paginated blogs
  const totalPages = trashedBlogs.length
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const paginatedBlogs = trashedBlogs.slice(startIndex, startIndex + PAGE_SIZE)

  const cleanText = (text) => {
    return text.replace(/[#=~`*_\-]+/g, "").trim()
  }

  return (
    <div className="p-5">
      <Helmet>
        <title>Trashcan | GenWrite</title>
      </Helmet>
      <div className="flex items-center justify-between gap-2">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl font-bold bg-blue-600 bg-clip-text text-transparent"
        >
          Trashcan
        </motion.h1>
        {trashedBlogs.length !== 0 && (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              className="p-2 hover:!border-yellow-500 hover:text-yellow-500"
              onClick={handleRefresh}
            >
              <RefreshCcw />
            </Button>
            <Button
              type="button"
              className="p-2 hover:!border-red-500 hover:text-red-500"
              onClick={() =>
                handlePopup({
                  title: "Delete All",
                  description: (
                    <span className="my-2">
                      All selected blogs will be <b>permanently deleted</b>. This action cannot be
                      undone.
                    </span>
                  ),
                  confirmText: "Delete",
                  onConfirm: handleBulkDelete,
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
        )}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-600 max-w-xl mt-2"
      >
        Restore valuable work or permanently delete clutter.
      </motion.p>
      {trashedBlogs.length !== 0 && (
        <p className="text-yellow-500 font-semibold mb-4">
          Warning: Trashed items will be permanently deleted after 7 days.
        </p>
      )}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(PAGE_SIZE)].map((_, index) => (
            <div key={index} className="bg-white shadow-md rounded-xl p-4">
              <SkeletonLoader />
            </div>
          ))}
        </div>
      ) : trashedBlogs.length === 0 ? (
        <div
          className="flex flex-col justify-center items-center"
          style={{ minHeight: "calc(100vh - 250px)" }}
        >
          <img src="Images/trash-can.png" alt="Trash" style={{ width: "8rem" }} />
          <p className="text-xl mt-5">No trashed blogs available.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-2">
            {paginatedBlogs.map((blog) => {
              const {
                _id,
                title,
                status,
                createdAt,
                content,
                aiModel,
                focusKeywords,
                wordpress,
                archiveDate,
              } = blog
              const isGemini = /gemini/gi.test(aiModel)
              return (
                <Badge.Ribbon
                  key={_id}
                  text={
                    <span className="flex items-center justify-center gap-1 py-1 font-medium tracking-wide">
                      <img
                        src={`./Images/${
                          isGemini ? "gemini" : aiModel === "claude" ? "claude" : "chatgpt"
                        }.png`}
                        alt=""
                        width={20}
                        height={20}
                        loading="lazy"
                        className="bg-white"
                      />
                      {isGemini
                        ? "Gemini-1.5-flash"
                        : aiModel === "claude"
                        ? "Claude-3-Haiku"
                        : "ChatGPT-4o-mini"}
                    </span>
                  }
                  className="absolute top-0"
                  color={
                    isGemini
                      ? "#4796E3" // Gemini blue
                      : aiModel === "claude"
                      ? "#9368F8" // Claude purple-ish
                      : "#74AA9C" // ChatGPT green
                  }
                >
                  <div
                    className={`bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl p-4 min-h-[180px] min-w-[390px] relative
                      ${
                        (status === "failed"
                          ? "border-red-500"
                          : status === "complete"
                          ? "border-green-500"
                          : "border-yellow-500") + " border-2"
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
                        <div className="flex flex-col gap-4 items-center justify-between mb-2">
                          <h3 className="text-lg capitalize font-semibold text-gray-900 !text-left max-w-76">
                            {title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-all">
                            {truncateContent(cleanText(content))}
                          </p>
                        </div>
                      </div>
                    </Tooltip>
                    <div className="flex items-center justify-between gap-2">
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
                      <Popconfirm
                        title="Restore Blog"
                        description="Are you sure to restore the blog?"
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
                    <div className="mt-3 mb-2 flex justify-end text-xs text-right text-gray-500 font-medium">
                      {wordpress?.postedOn && (
                        <span>
                          Posted on:  
                          {new Date(wordpress.postedOn).toLocaleDateString("en-US", {
                            dateStyle: "medium",
                          })}
                        </span>
                      )}
                      <span className="block -mb-2 text-sm text-right">
                        Archive Date:{" "}
                        {new Date(archiveDate).toLocaleDateString("en-US", {
                          dateStyle: "medium",
                        })}
                      </span>
                    </div>
                  </div>
                </Badge.Ribbon>
              )
            })}
          </div>
          {totalPages > PAGE_SIZE && (
            <div className="flex justify-center mt-6">
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={totalPages}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                responsive={true}
              />
            </div>
          )}
        </>
      )}
      <style>
        {`
          .restore-icon {
            transition: filter 0.2s;
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
