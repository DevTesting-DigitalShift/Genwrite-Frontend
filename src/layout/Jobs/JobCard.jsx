import React, { memo, useState } from "react"
import { motion } from "framer-motion"
import { message } from "antd"
import {
  CalendarDays,
  FileText,
  Cpu,
  Tag,
  Hash,
  Play,
  Square,
  PenTool,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { startJob, stopJob, deleteJob } from "@api/jobApi"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"

const Badge = ({ children, variant = "gray" }) => {
  const variants = {
    gray: "bg-slate-100 text-slate-600 border border-slate-200/60",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  }
  return (
    <span
      className={`px-2.5 py-1 text-[10px] font-semibold rounded-full uppercase tracking-wider ${variants[variant]}`}
    >
      {children}
    </span>
  )
}

const JobCard = memo(({ job, setCurrentPage, paginatedJobs, onEdit }) => {
  const queryClient = useQueryClient()
  const { handlePopup } = useConfirmPopup()
  const [showAllTopics, setShowAllTopics] = useState(false)

  const isRunning = job.status === "active"

  const toggleJobStatusMutation = useMutation({
    mutationFn: async ({ jobId, currentStatus }) => {
      if (currentStatus === "active") {
        await stopJob(jobId)
      } else {
        await startJob(jobId)
      }
      return { jobId, status: currentStatus === "active" ? "stop" : "active" }
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["jobs"], exact: false })
      message.success(
        data.status === "active" ? "Job started successfully!" : "Job paused successfully!"
      )
    },
    onError: error => {
      console.error("Failed to toggle job status:", error)
      message.error(error.message || "Failed to update job status")
    },
  })

  const deleteJobMutation = useMutation({
    mutationFn: async jobId => {
      await deleteJob(jobId)
      return jobId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"], exact: false })
      if (paginatedJobs.length === 1 && setCurrentPage) {
        setCurrentPage(prev => Math.max(1, prev - 1))
      }
      message.success("Job deleted successfully!")
    },
    onError: error => {
      console.error("Failed to delete job:", error)
      message.error(error.message || "Failed to delete job")
    },
  })

  const handleToggleStatus = e => {
    e.stopPropagation()
    toggleJobStatusMutation.mutate({ jobId: job._id, currentStatus: job.status })
  }

  const handleDeleteJob = jobId => {
    deleteJobMutation.mutate(jobId)
  }

  const handleEditJob = e => {
    e.stopPropagation()
    if (job.status === "active") {
      message.warning("Please pause the job before editing.")
      return
    }
    onEdit(job)
  }

  const formatDate = dateStr => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group bg-white rounded-3xl border border-slate-200/60 p-6 flex flex-col hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
    >

      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-bold text-slate-900 text-lg tracking-tight mb-1 truncate capitalize">
            {job.name}
          </h3>
          <p className="text-[10px] text-slate-400 font-mono tracking-wider">
            ID: {(job._id || "").toString().slice(-6).toUpperCase()}
          </p>
        </div>
        <button
          onClick={handleToggleStatus}
          disabled={toggleJobStatusMutation.isPending}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
            isRunning
              ? "bg-rose-50 text-rose-600 hover:bg-rose-100 hover:scale-105 active:scale-95"
              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105 active:scale-95"
          }`}
          title={isRunning ? "Stop Job" : "Start Job"}
        >
          {toggleJobStatusMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isRunning ? (
            <Square size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" className="ml-0.5" />
          )}
        </button>
      </div>

      {/* Core Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
          <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-500">
            <CalendarDays size={16} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-tighter text-slate-400 font-bold mb-0.5">
              Schedule
            </p>
            <p className="text-xs font-semibold text-slate-700 truncate capitalize">
              {job?.schedule?.type || "Manual"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
          <div className="p-2 bg-white rounded-xl shadow-sm text-amber-500">
            <FileText size={16} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-tighter text-slate-400 font-bold mb-0.5">
              Volume
            </p>
            <p className="text-xs font-semibold text-slate-700 truncate">
              {job?.blogs?.numberOfBlogs || 0} / day
            </p>
          </div>
        </div>
      </div>

      {/* Model & Status row */}
      <div className="flex items-center justify-between py-3 border-y border-slate-100 mb-5">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Cpu size={14} className="text-slate-400" />
          <span className="font-semibold tracking-tight">{job?.blogs?.aiModel}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-slate-100 px-2.5 py-1 rounded-full shadow-sm">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isRunning ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
            }`}
          />
          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${
              isRunning ? "text-emerald-600" : "text-slate-500"
            }`}
          >
            {job.status === "active" ? "Running" : "Stopped"}
          </span>
        </div>
      </div>

      {/* Tags Section */}
      <div className="space-y-4 flex-grow mb-6">
        {job?.blogs?.topics?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-slate-400">
              <Tag size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Topics</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(showAllTopics ? job.blogs.topics : job.blogs.topics.slice(0, 3)).map((topic, i) => (
                <Badge key={i} variant="gray">
                  {topic}
                </Badge>
              ))}
              {job.blogs.topics.length > 3 && (
                <button
                  onClick={() => setShowAllTopics(!showAllTopics)}
                  className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 ml-1 transition-colors"
                >
                  {showAllTopics ? "Show Less" : `+${job.blogs.topics.length - 3} More`}
                </button>
              )}
            </div>
          </div>
        )}
        {job?.blogs?.keywords?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-slate-400">
              <Hash size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Keywords</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {job.blogs.keywords.slice(0, 5).map((kw, i) => (
                <Badge key={i} variant="indigo">
                  {kw}
                </Badge>
              ))}
              {job.blogs.keywords.length > 5 && (
                <span className="text-[10px] font-bold text-slate-400 ml-1">
                  +{job.blogs.keywords.length - 5}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-5 border-t border-slate-100 bg-slate-50/30 -mx-6 -mb-6 px-6 pb-6 mt-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span className="font-bold text-slate-700">
              {(job?.createdBlogs || []).length}
            </span>{" "}
            blogs generated
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-[10px] text-slate-400 mb-5">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Clock size={10} /> Last Run:
            </span>
            <span className="text-slate-600 font-bold">{formatDate(job.lastRun)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Created:</span>
            <span className="text-slate-600 font-semibold">{formatDate(job.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleEditJob}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all border border-slate-200 shadow-sm active:scale-95"
          >
            <PenTool size={14} /> Edit
          </button>
          <button
            onClick={() =>
              handlePopup({
                title: "Delete Job",
                description: (
                  <span className="my-2">
                    Are you sure you want to delete <b className="capitalize">{job.name}</b> job?
                  </span>
                ),
                confirmText: "Delete",
                onConfirm: () => handleDeleteJob(job._id),
                confirmProps: {
                  type: "text",
                  className: "border-red-500 hover:bg-red-500 bg-red-100 text-red-600",
                },
                cancelProps: { danger: false },
              })
            }
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-100 shadow-sm active:scale-95"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </motion.div>
  )
})

export default JobCard
