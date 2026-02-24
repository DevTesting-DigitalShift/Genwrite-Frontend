import React, { memo, useState } from "react"
import { motion } from "framer-motion"
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
import { useToggleJobStatusMutation, useDeleteJobMutation } from "@api/queries/jobQueries"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

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

  const { mutate: toggleStatus, isPending: isToggling } = useToggleJobStatusMutation()
  const { mutate: deleteMutate } = useDeleteJobMutation()

  const handleToggleStatus = e => {
    e.stopPropagation()
    toggleStatus({ jobId: job._id, currentStatus: job.status })
  }

  const handleDeleteJob = jobId => {
    deleteMutate(jobId, {
      onSuccess: () => {
        if (paginatedJobs.length === 1 && setCurrentPage) {
          setCurrentPage(prev => Math.max(1, prev - 1))
        }
      },
    })
  }

  const handleEditJob = e => {
    e.stopPropagation()
    if (job.status === "active") {
      toast.warning("Please pause the job before editing.")
      return
    }
    onEdit(job)
  }

  const formatDate = dateStr => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
  }
  const getTrueOptions = options => {
    if (!options) return []
    const mapping = {
      wordpressPosting: "WordPress Posting",
      includeFaqs: "FAQs",
      includeCompetitorResearch: "Comp. Research",
      includeInterlinks: "Interlinks",
      performKeywordResearch: "Keyword Research",
      includeTableOfContents: "TOC",
      addOutBoundLinks: "Outbound Links",
      embedYouTubeVideos: "YouTube Emb.",
      easyToUnderstand: "Simple Style",
    }
    return Object.entries(options)
      .filter(([key, value]) => value === true && mapping[key])
      .map(([key]) => mapping[key])
  }

  const activeOptions = getTrueOptions(job.options)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:shadow-xl transition-all duration-300 relative"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="font-black text-slate-900 text-xl tracking-tight mb-1 truncate capitalize">
            {job.name}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            ID: {(job._id || "").toString().slice(-6)}
          </p>
        </div>
        <button
          onClick={handleToggleStatus}
          disabled={isToggling}
          className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all ${
            isRunning
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100"
          }`}
          title={isRunning ? "Stop Job" : "Start Job"}
        >
          {isToggling ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isRunning ? (
            <Square size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" className="ml-0.5" />
          )}
        </button>
      </div>

      {/* Topics & Keywords - starting 5 +n */}
      <div className="space-y-4 mb-6 pt-4 border-t border-slate-100">
        {job.blogs?.topics?.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Topics
            </p>
            <div className="flex flex-wrap gap-1.5">
              {job.blogs.topics.slice(0, 5).map((topic, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-slate-50 text-slate-600 text-[11px] font-bold rounded-lg border border-slate-100"
                >
                  {topic}
                </span>
              ))}
              {job.blogs.topics.length > 5 && (
                <span className="text-[11px] font-black text-indigo-600 ml-1">
                  +{job.blogs.topics.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {job.blogs?.keywords?.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Focus Keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {job.blogs.keywords.slice(0, 5).map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-indigo-50/50 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-100/50"
                >
                  {kw}
                </span>
              ))}
              {job.blogs.keywords.length > 5 && (
                <span className="text-[11px] font-black text-indigo-600 ml-1">
                  +{job.blogs.keywords.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {activeOptions.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Active Settings
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeOptions.map((opt, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold border border-slate-200"
                >
                  {opt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Intelligence & Schedule - Clean Layout */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-100">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Intelligence
          </span>
          <span className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">
            {job.blogs?.aiModel} / {job.blogs?.languageToWrite}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Schedule
          </span>
          <span className="text-xs font-bold text-slate-900 truncate capitalize tracking-tight">
            {job.schedule?.type} ({job.blogs?.numberOfBlogs})
          </span>
        </div>
        <div className="flex flex-col col-span-2 mt-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Last Run
          </span>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-700">{formatDate(job.lastRun)}</span>
          </div>
        </div>
      </div>

      {/* Footer - Minimalist */}
      <div className="mt-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-500" : "bg-slate-300"}`}
            />
            <span
              className={`text-[11px] font-black uppercase tracking-widest ${isRunning ? "text-emerald-600" : "text-slate-400"}`}
            >
              {isRunning ? "Running" : "Stopped"}
            </span>
          </div>
          <div className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
            {job?.createdBlogs?.length || 0} GENERATED
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleEditJob}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            Edit Job
          </button>
          <button
            onClick={() =>
              handlePopup({
                title: "Delete Job",
                description: "Are you sure you want to delete this job?",
                confirmText: "Delete",
                onConfirm: () => handleDeleteJob(job._id),
                confirmProps: { danger: true },
              })
            }
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors border border-rose-100"
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  )
})

export default JobCard
