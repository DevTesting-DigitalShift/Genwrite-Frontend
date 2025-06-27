import React, { useState, useEffect } from "react"
import { Button, Tooltip, Popconfirm, Badge } from "antd"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { FaTrash } from "react-icons/fa"
import { RefreshCcw, Trash2 } from "lucide-react"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { motion } from "framer-motion"
import { Helmet } from "react-helmet"
import { getAllBlogs } from "@api/blogApi"
import { deleteAllUserBlogs, restoreTrashedBlog } from "@store/slices/blogSlice"
import { useDispatch } from "react-redux"
import SkeletonLoader from "@components/Projects/SkeletonLoader"

const TRUNCATE_LENGTH = 85

// [s ] refresh button here too
// [s ] add delete all & call delete /blogs/ & other features in it & use main branch from now on

const Trashcan = () => {
  const [trashedBlogs, setTrashedBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const { handlePopup } = useConfirmPopup()
  const dispatch = useDispatch()

  const fetchTrashedBlogs = async () => {
    try {
      setLoading(true)
      const blogs = await getAllBlogs()
      const filteredBlogs = blogs.filter((blog) => blog.isArchived)
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
    await dispatch(restoreTrashedBlog(id)) // Restores from backend
    setTrashedBlogs((prev) => prev.filter((blog) => blog._id !== id)) // Remove from UI instantly
  }

  const handleBulkDelete = async () => {
    await dispatch(deleteAllUserBlogs())
    setTrashedBlogs([]) 
  }

  const handleRefresh = async () => {
    await fetchTrashedBlogs()
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
          <div className="flex justify-end">
            <Button
              type="button"
              className="p-2 hover:!border-yellow-500 hover:text-yellow-500"
              onClick={() => handleRefresh()}
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
                  onConfirm: () => {
                    handleBulkDelete()
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
          {[...Array(5)].map((_, index) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-2">
          {trashedBlogs?.map((blog) => {
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
              archiveDate,
            } = blog
            const isGemini = /gemini/gi.test(aiModel)
            // [ s] Create a universal blog card to show wherever we need, use it here & in trashcan with all event handlers
            // [s ] When blog is failed show user retry button [/blogs/:id/retry] - POST payload: create_new- boolean.
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
                    color={status === "complete" ? "black" : status === "failed" ? "red" : "orange"}
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
                      <div className="flex flex-col gap-4 items-center justify-between mb-2 ">
                        <h3 className="text-lg capitalize font-semibold text-gray-900 !text-left max-w-76">
                          {title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-all">
                          {content || ""}
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
                  <div className="mt-3 mb-2 flex justify-end text-xs text-right text-gray-500 font-medium">
                    {wordpress?.postedOn && (
                      <span className="">
                        Posted on : &nbsp;
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
