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
import toast from "@utils/toast"

const Badge = ({ children, variant = "gray" }) => {
  const variants = {
    gray: "bg-slate-100 text-slate-600 border border-slate-200/60",
    blue: "bg-blue-50 text-blue-700 border border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  }
  return (
    <span
      className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${variants[variant]}`}
    >
      {children}
    </span>
  )
}

const JobCard = memo(({ job, setCurrentPage, paginatedJobs, onEdit }) => {
  const queryClient = useQueryClient()
  const { handlePopup } = useConfirmPopup()

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
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTrueOptions = options => {
    if (!options) return []
    const mapping = {
      wordpressPosting: "WP Posting",
      includeFaqs: "FAQs",
      includeCompetitorResearch: "Comp. Research",
      includeInterlinks: "Interlinks",
      performKeywordResearch: "Keyword Research",
      includeTableOfContents: "TOC",
      addOutBoundLinks: "Outbound",
      embedYouTubeVideos: "YouTube",
      easyToUnderstand: "Simple Style",
    }
    return Object.entries(options)
      .filter(([key, value]) => value === true && mapping[key])
      .map(([key]) => mapping[key])
  }

  const activeOptions = getTrueOptions(job.options)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-3xl border border-slate-200/60 p-6 flex flex-col shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden h-full"
    >
      {/* Neural Pattern Overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-blue-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900 text-lg tracking-tight truncate capitalize">
              {job.name}
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <Hash size={10} />
            {(job._id || "").toString().slice(-6)}
          </p>
        </div>
        <button
          onClick={handleToggleStatus}
          disabled={isToggling}
          className={`group/btn flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${
            isRunning
              ? "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100"
              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100"
          } shadow-sm active:scale-95`}
          title={isRunning ? "Stop Job" : "Start Job"}
        >
          {isToggling ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isRunning ? (
            <Square size={18} fill="currentColor" className="opacity-80" />
          ) : (
            <Play size={18} fill="currentColor" className="ml-0.5 opacity-80" />
          )}
        </button>
      </div>

      {/* Topics & Keywords - Enhanced Grid */}
      <div className="space-y-4 mb-6 pt-4 border-t border-slate-50 relative z-10 flex-1">
        {job.blogs?.topics?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag size={12} className="text-slate-400" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Topics
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {job.blogs.topics.slice(0, 4).map((topic, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-100 transition-colors"
                >
                  {topic}
                </span>
              ))}
              {job.blogs.topics.length > 4 && (
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                  +{job.blogs.topics.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {job.blogs?.keywords?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={12} className="text-slate-400" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Focus Keywords
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {job.blogs.keywords.slice(0, 4).map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-blue-50/30 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100/30 group-hover:bg-blue-600 group-hover:text-white transition-all"
                >
                  {kw}
                </span>
              ))}
              {job.blogs.keywords.length > 4 && (
                <span className="text-[10px] font-black text-blue-600">
                  +{job.blogs.keywords.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {activeOptions.length > 0 && (
          <div className="pt-2">
            <div className="flex flex-wrap gap-1">
              {activeOptions.slice(0, 3).map((opt, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-tight border border-slate-200"
                >
                  {opt}
                </span>
              ))}
              {activeOptions.length > 3 && (
                <span className="text-[9px] font-black text-slate-400">
                  +{activeOptions.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Intelligence & Schedule - Premium Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 relative z-10">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <Cpu size={10} /> Model
          </span>
          <span className="text-[11px] font-bold text-slate-900 truncate uppercase tracking-tight">
            {job.blogs?.aiModel}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <CalendarDays size={10} /> Frequency
          </span>
          <span className="text-[11px] font-bold text-slate-900 truncate capitalize tracking-tight">
            {job.schedule?.type}
          </span>
        </div>
        <div className="flex flex-col col-span-2 mt-2 pt-2 border-t border-slate-200/10">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <Clock size={10} /> Last Run
          </span>
          <span className="text-[11px] font-bold text-slate-700">{formatDate(job.lastRun)}</span>
        </div>
      </div>

      {/* Footer - Sophisticated Stats & Actions */}
      <div className="mt-auto relative z-10">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${isRunning ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-slate-300"}`}
            />
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${isRunning ? "text-emerald-600" : "text-slate-400"}`}
            >
              {isRunning ? "Active Pipeline" : "Paused"}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
              {job?.createdBlogs?.length || 0} GENERATED
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleEditJob}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all border border-slate-200 active:scale-95 shadow-xs"
          >
            <PenTool size={14} />
            Configure
          </button>
          <button
            onClick={() =>
              handlePopup({
                title: "Terminate Pipeline",
                description: `This will permanently delete the pipeline "${job.name}". This action cannot be undone.`,
                confirmText: "Terminate",
                onConfirm: () => handleDeleteJob(job._id),
                confirmProps: { className: "btn-error" },
              })
            }
            className="aspect-square flex items-center justify-center rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 active:scale-95"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  )
})

export default JobCard
