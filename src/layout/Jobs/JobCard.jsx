import React, { memo, useState } from "react"
import { motion } from "framer-motion"
import { useDispatch } from "react-redux"
import { message } from "antd"
import { FiCalendar, FiFileText, FiSettings, FiEdit } from "react-icons/fi"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { toggleJobStatusThunk, deleteJobThunk, openJobModal } from "@store/slices/jobSlice"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"

const JobCard = memo(({ job, setCurrentPage, paginatedJobs }) => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { handlePopup } = useConfirmPopup()
  const [showAllTopics, setShowAllTopics] = useState(false)

  const toggleJobStatusMutation = useMutation({
    mutationFn: ({ jobId, currentStatus }) =>
      dispatch(toggleJobStatusThunk({ jobId, currentStatus })).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"], exact: false })
    },
    onError: (error) => {
      console.error("Failed to toggle job status:", error)
    },
  })

  const deleteJobMutation = useMutation({
    mutationFn: (jobId) => dispatch(deleteJobThunk(jobId)).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"], exact: false })
      if (paginatedJobs.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1)
      }
    },
    onError: (error) => {
      console.error("Failed to delete job:", error)
    },
  })

  const handleStartJob = (jobId) => {
    const job = paginatedJobs.find((j) => j._id === jobId)
    if (!job) {
      message.error("Job not found.")
      return
    }
    toggleJobStatusMutation.mutate({ jobId, currentStatus: job.status })
  }

  const handleDeleteJob = (jobId) => {
    deleteJobMutation.mutate(jobId)
  }

  const handleEditJob = (job) => {
    if (!job?._id) {
      message.error("Invalid job ID.")
      return
    }
    if (job.status === "active") {
      message.warning("Please pause the job before editing.")
      return
    }
    dispatch(openJobModal(job)) // Pass the job object
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.3 } }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 transition-all duration-200"
      layout
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 capitalize">{job.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            ID: {(job._id || "").toString().slice(-6) || "N/A"}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleStartJob(job._id)}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            job.status === "active"
              ? "bg-red-100 text-red-600 hover:bg-red-200"
              : "bg-green-100 text-green-600 hover:bg-green-200"
          }`}
          aria-label={job.status === "active" ? "Stop job" : "Start job"}
        >
          {job.status === "active" ? "Stop" : "Start"}
        </motion.button>
      </div>
      <div className="space-y-3 text-sm text-gray-600">
        <div className="flex items-center gap-2 capitalize">
          <FiCalendar className="w-4 h-4 text-blue-500" />
          <span>Scheduling: {job?.schedule?.type}</span>
        </div>
        <div className="flex items-center gap-2 capitalize">
          <FiFileText className="w-4 h-4 text-purple-500" />
          <span>Daily Blogs: {job?.blogs?.numberOfBlogs}</span>
        </div>
        <div className="flex items-center gap-2 capitalize">
          <FiSettings className="w-4 h-4 text-green-500" />
          <span>Model: {job?.blogs?.aiModel}</span>
        </div>
        <div className="flex items-center gap-2 capitalize">
          <FiCalendar className="w-4 h-4 text-red-500" />
          <span>Status: {job?.status}</span>
        </div>
        {job?.blogs?.topics?.length > 0 && (
          <div className="flex items-start gap-2">
            <FiFileText className="w-4 h-4 text-purple-500 mt-0.5" />
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-700 font-medium">Topics:</span>
              {(showAllTopics ? job.blogs.topics : job.blogs.topics.slice(0, 6)).map(
                (topic, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"
                  >
                    {topic}
                  </span>
                )
              )}
              {job.blogs.topics.length > 6 && (
                <button
                  onClick={() => setShowAllTopics((prev) => !prev)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {showAllTopics ? "Show less" : `+${job.blogs.topics.length - 6} more`}
                </button>
              )}
            </div>
          </div>
        )}
        {job?.blogs?.keywords?.length > 0 && (
          <div className="flex items-start gap-2">
            <FiFileText className="w-4 h-4 text-indigo-500 mt-0.5" />
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-700 font-medium">Keywords:</span>
              {job?.blogs?.keywords?.map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-md text-xs"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <FiFileText className="w-4 h-4 text-purple-500" />
          <span>Generated Blogs: {(job?.createdBlogs || []).length}</span>
        </div>
        {job?.lastRun && (
          <div className="flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-yellow-500" />
            <span>
              Last Run:{" "}
              {new Date(job?.lastRun).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4 text-yellow-500" />
          <span>
            Created:{" "}
            {job?.createdAt
              ? new Date(job?.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "N/A"}
          </span>
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleEditJob(job)}
          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 flex items-center gap-2"
          aria-label="Edit job"
        >
          <FiEdit />
          Edit
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
          aria-label="Delete job"
          onClick={() =>
            handlePopup({
              title: "Delete Job",
              description: (
                <span className="my-2">
                  Are you sure you want to delete <b className="capitalize">{job.name}</b> job?
                </span>
              ),
              confirmText: "Delete",
              onConfirm: () => {
                handleDeleteJob(job._id)
              },
              confirmProps: {
                type: "text",
                className: "border-red-500 hover:bg-red-500 bg-red-100 text-red-600",
              },
              cancelProps: {
                danger: false,
              },
            })
          }
        >
          Delete
        </motion.button>
      </div>
    </motion.div>
  )
})

export default JobCard
