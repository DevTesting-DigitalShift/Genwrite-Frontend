import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet"
import {
  Plus,
  RefreshCw,
  Briefcase,
  Search,
  AlertTriangle,
  Sparkles,
  Zap,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Tag as TagIcon,
  Hash,
  Globe,
  Cpu,
  Image,
  Calendar,
  Clock,
  FileText,
  Layers,
  Settings2,
  Bot,
  Megaphone,
  BookOpen,
  Link2,
  Youtube,
  BarChart2,
  AlignLeft,
  Repeat,
  CheckCircle2,
  XCircle,
  Send,
  Shield,
} from "lucide-react"
import { getJobs, startJob, stopJob, deleteJob } from "@api/jobApi"
import useAuthStore from "@store/useAuthStore"
import useJobStore from "@store/useJobStore"
import useAnalysisStore from "@store/useAnalysisStore"

import {
  useJobsQuery,
  useToggleJobStatusMutation,
  useDeleteJobMutation,
} from "@api/queries/jobQueries"
import SkeletonLoader from "@components/ui/SkeletonLoader"
import UpgradeModal from "@components/UpgradeModal"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import JobModal from "@/layout/Jobs/JobModal"
import JobCard from "@/layout/Jobs/JobCard"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getSocket } from "@utils/socket"
import { toast } from "sonner"

const PAGE_SIZE = 12
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const SectionLabel = ({ children }) => (
  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.12em] mb-2 flex items-center gap-1">
    {children}
  </p>
)

const Pill = ({ on, label }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
      on
        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
        : "bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60"
    }`}
  >
    {on ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
    {label}
  </span>
)

const Tag = ({ children, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[10px] font-medium border whitespace-nowrap ${colors[color]}`}
    >
      {children}
    </span>
  )
}

const TagList = ({ items, color }) => {
  if (!items?.length) return <span className="text-slate-300 text-[11px] italic">None</span>
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <Tag key={i} color={color}>{item}</Tag>
      ))}
    </div>
  )
}

const KV = ({ label, value, valueClass = "text-slate-700" }) => (
  <div className="flex justify-between items-start gap-3 text-[11px]">
    <span className="text-slate-400 shrink-0">{label}</span>
    <span className={`font-semibold text-right capitalize ${valueClass}`}>{value ?? "—"}</span>
  </div>
)

const JobExpandedPanel = ({ job }) => {
  const blogs = job.blogs || {}
  const options = job.options || {}
  const schedule = job.schedule || {}

  const OPTION_MAP = [
    { key: "wordpressPosting", label: "WordPress", icon: Globe },
    { key: "includeFaqs", label: "FAQs", icon: BookOpen },
    { key: "includeCompetitorResearch", label: "Competitor Research", icon: BarChart2 },
    { key: "includeInterlinks", label: "Interlinks", icon: Link2 },
    { key: "performKeywordResearch", label: "Keyword Research", icon: Hash },
    { key: "includeTableOfContents", label: "Table of Contents", icon: AlignLeft },
    { key: "addOutBoundLinks", label: "Outbound Links", icon: Link2 },
    { key: "embedYouTubeVideos", label: "YouTube Embed", icon: Youtube },
    { key: "easyToUnderstand", label: "Easy Language", icon: BookOpen },
  ]

  const scheduleDays =
    schedule.type === "weekly" && schedule.daysOfWeek?.length
      ? schedule.daysOfWeek.map(d => DAY_NAMES[d]).join(", ")
      : schedule.type === "monthly" && schedule.daysOfMonth?.length
      ? schedule.daysOfMonth.join(", ")
      : null

  const postingTypeLabel = {
    WORDPRESS: "WordPress",
    SERVERENDPOINT: "Server Endpoint",
    MANUAL: "Manual",
  }[blogs.postingType] || blogs.postingType || "—"

  const imageSrcLabel = {
    stock: "Stock Photos",
    ai: "AI Generated",
    custom: "Custom Upload",
    none: "No Images",
  }[blogs.imageSource] || blogs.imageSource || "—"

  return (
    <div className="mx-4 mb-4 mt-1 rounded-2xl border border-indigo-100 bg-white shadow-sm overflow-hidden">
      {/* ── Top accent bar ── */}
      <div className="h-1 w-full bg-linear-to-r from-indigo-400 via-blue-400 to-purple-400" />

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">

        {/* ── Col 1: Topics & Keywords ── */}
        <div className="space-y-4">
          <div>
            <SectionLabel><TagIcon size={9} />Topics</SectionLabel>
            <TagList items={blogs.topics} color="indigo" />
          </div>
          <div>
            <SectionLabel><Hash size={9} />Keywords</SectionLabel>
            <TagList items={blogs.keywords} color="sky" />
          </div>
          <div>
            <SectionLabel><Layers size={9} />Templates</SectionLabel>
            <TagList items={blogs.templates} color="amber" />
          </div>
        </div>

        {/* ── Col 2: Blog Config ── */}
        <div className="space-y-1.5">
          <SectionLabel><Settings2 size={9} />Blog Config</SectionLabel>
          <KV label="Tone" value={blogs.tone} />
          <KV label="Length" value={blogs.userDefinedLength ? `${blogs.userDefinedLength.toLocaleString()} words` : "—"} />
          <KV label="Language" value={blogs.languageToWrite} />
          <KV label="AI Model" value={blogs.aiModel?.toUpperCase()} />
          <KV label="Blogs / Run" value={blogs.numberOfBlogs} />
          <KV label="Images" value={imageSrcLabel} />
          {blogs.numberOfImages > 0 && <KV label="Image Count" value={blogs.numberOfImages} />}
          <KV
            label="Cost Cutter"
            value={blogs.costCutter ? "✓ On" : "Off"}
            valueClass={blogs.costCutter ? "text-emerald-600" : "text-slate-400"}
          />
          <KV
            label="Add CTA"
            value={blogs.addCTA ? "✓ Yes" : "No"}
            valueClass={blogs.addCTA ? "text-blue-600" : "text-slate-400"}
          />
        </div>

        {/* ── Col 3: Schedule & Posting ── */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <SectionLabel><Calendar size={9} />Schedule</SectionLabel>
            <KV label="Type" value={schedule.type} />
            {scheduleDays && <KV label="Days" value={scheduleDays} />}
            {schedule.customDates?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Custom Dates</p>
                <TagList items={schedule.customDates.map(d => new Date(d).toLocaleDateString())} color="slate" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <SectionLabel><Send size={9} />Posting</SectionLabel>
            <KV label="Method" value={postingTypeLabel} />
          </div>

          <div className="space-y-1.5">
            <SectionLabel><FileText size={9} />Metadata</SectionLabel>
            <KV
              label="Created"
              value={new Date(job.createdAt).toLocaleDateString(undefined, {
                month: "short", day: "numeric", year: "numeric",
              })}
            />
            <KV
              label="Last Run"
              value={
                job.lastRun
                  ? new Date(job.lastRun).toLocaleDateString(undefined, {
                      month: "short", day: "numeric",
                    })
                  : "Never"
              }
            />
            <KV label="Blogs Made" value={job.createdBlogs?.length ?? 0} />
            <KV label="ID" value={`#${job._id?.slice(-8)}`} />
          </div>
        </div>

        {/* ── Col 4: Brand & AI ── */}
        <div className="space-y-4">
          <div className="space-y-2">
            <SectionLabel><Megaphone size={9} />Brand Voice</SectionLabel>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
                blogs.useBrandVoice
                  ? "bg-purple-50 border-purple-200 text-purple-700"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              {blogs.useBrandVoice ? (
                <><Shield size={13} className="text-purple-500" /> Brand Voice Active</>
              ) : (
                <><XCircle size={13} /> No Brand Voice</>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <SectionLabel><Bot size={9} />AI Settings</SectionLabel>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-slate-50 border-slate-200">
              <Cpu size={13} className="text-indigo-500" />
              <span className="text-[11px] font-bold text-slate-700">
                {blogs.aiModel?.toUpperCase() || "GEMINI"}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-slate-50 border-slate-200">
              <Globe size={13} className="text-sky-500" />
              <span className="text-[11px] font-semibold text-slate-600">
                {blogs.languageToWrite || "English"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <SectionLabel><Image size={9} />Image Config</SectionLabel>
            <KV label="Source" value={imageSrcLabel} />
            <KV
              label="AI Images"
              value={blogs.isCheckedGeneratedImages ? "✓ Yes" : "No"}
              valueClass={blogs.isCheckedGeneratedImages ? "text-emerald-600" : "text-slate-400"}
            />
            <KV
              label="Custom Images"
              value={blogs.isCheckedCustomImages ? "✓ Yes" : "No"}
              valueClass={blogs.isCheckedCustomImages ? "text-emerald-600" : "text-slate-400"}
            />
          </div>
        </div>

        {/* ── Col 5: Advanced Options ── */}
        <div>
          <SectionLabel><Zap size={9} />Advanced Options</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {OPTION_MAP.map(({ key, label }) => (
              <Pill key={key} on={!!options[key]} label={label} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const JobListView = ({ data, onEdit, onToggleStatus, onDelete, isToggling }) => {
  const [expandedRows, setExpandedRows] = useState(new Set())

  const toggleExpand = id => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const renderTags = (arr, limit = 2) => {
    if (!arr?.length) return <span className="text-slate-300 text-xs">—</span>
    const display = arr.slice(0, limit)
    const remaining = arr.length - limit
    return (
      <div className="flex flex-wrap gap-1">
        {display.map((item, i) => (
          <span
            key={i}
            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-medium border border-indigo-100 whitespace-nowrap"
          >
            {item}
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
            +{remaining}
          </span>
        )}
      </div>
    )
  }

  const formatDate = dateStr => {
    if (!dateStr) return <span className="text-slate-300 italic text-[11px]">Never</span>
    try {
      const d = new Date(dateStr)
      return (
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-slate-700">
            {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
          <span className="text-[10px] text-slate-400">
            {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )
    } catch {
      return <span className="text-slate-300">—</span>
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-100 overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <table className="w-full text-left border-collapse min-w-[860px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="w-10 px-3 py-4" />
              <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Job</th>
              <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Run</th>
              <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule</th>
              <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Topics</th>
              <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">AI / Lang</th>
              <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(job => {
              const isExpanded = expandedRows.has(job._id)
              const schedule = job.schedule || {}
              const scheduleDayStr =
                schedule.type === "weekly" && schedule.daysOfWeek?.length
                  ? schedule.daysOfWeek.map(d => DAY_NAMES[d]).join(", ")
                  : null

              return (
                <>
                  {/* ─── Main row ─── */}
                  <tr
                    key={job._id}
                    className={`transition-colors group border-b border-slate-100 ${
                      isExpanded ? "bg-indigo-50/30" : "hover:bg-slate-50/60"
                    }`}
                  >
                    {/* Expand toggle */}
                    <td className="pl-3 py-4">
                      <button
                        onClick={() => toggleExpand(job._id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        title={isExpanded ? "Collapse" : "Expand all details"}
                      >
                        <ChevronRight
                          size={14}
                          className={`transition-transform duration-200 ${
                            isExpanded ? "rotate-90 text-indigo-500" : ""
                          }`}
                        />
                      </button>
                    </td>

                    {/* Job name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            job.status === "active"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-indigo-50 text-indigo-500"
                          }`}
                        >
                          <Briefcase size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm capitalize leading-tight">
                            {job.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            #{job._id?.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => onToggleStatus(job)}
                        disabled={isToggling}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          job.status === "active"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {job.status === "active" ? "▶ Running" : "⏸ Paused"}
                      </button>
                    </td>

                    {/* Last run */}
                    <td className="px-5 py-4">{formatDate(job.lastRun)}</td>

                    {/* Schedule */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 capitalize">
                          {schedule.type || "Manual"}
                        </span>
                        {scheduleDayStr && (
                          <span className="text-[10px] text-slate-400">{scheduleDayStr}</span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {job.blogs?.numberOfBlogs} blog{job.blogs?.numberOfBlogs !== 1 ? "s" : ""}/run
                        </span>
                      </div>
                    </td>

                    {/* Topics */}
                    <td className="px-5 py-4 max-w-[180px]">{renderTags(job.blogs?.topics, 2)}</td>

                    {/* AI / Lang */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 w-fit">
                          {job.blogs?.aiModel?.toUpperCase() || "GEMINI"}
                        </span>
                        <span className="text-[11px] text-slate-400 pl-0.5">
                          {job.blogs?.languageToWrite || "English"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onEdit(job)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => onDelete(job)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ─── Expanded detail panel ─── */}
                  {isExpanded && (
                    <tr key={`${job._id}-detail`}>
                      <td colSpan={8} className="bg-slate-50/60 p-0 border-b border-indigo-100">
                        <JobExpandedPanel job={job} />
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const Jobs = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { handlePopup } = useConfirmPopup()
  const openJobModal = useJobStore(state => state.openJobModal)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("jobs_view_mode") || "grid"
  })

  useEffect(() => {
    localStorage.setItem("jobs_view_mode", viewMode)
  }, [viewMode])

  const { mutate: toggleStatus, isPending: isToggling } = useToggleJobStatusMutation()
  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteJobMutation()

  const user = useAuthStore(state => state.user)
  const updateUserPartial = useAuthStore(state => state.updateUserPartial)
  const userPlan = (user?.plan || user?.subscription?.plan || "free").toLowerCase()
  const [currentPage, setCurrentPage] = useState(1)
  const [isUserLoaded, setIsUserLoaded] = useState(false)

  const usage = user?.usage?.createdJobs || 0
  const usageLimit = user?.usageLimits?.createdJobs || 0
  const credits = user?.credits?.base || 0

  const { data: queryJobs = [], isLoading: queryLoading, refetch } = useJobsQuery(!!user)

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !user) return

    const handleJobChange = (data, eventType) => {
      if (
        (data?.status === "stop" || data?.status === "stopped") &&
        data?.reason?.toLowerCase().includes("insufficient credits")
      ) {
        toast.error("Job Stopped: Insufficient Credits")
      }
      // Fix: queryKey must match useJobsQuery's key ["jobs"], not ["jobs", user.id]
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    }

    const handleUsageUpdate = data => {
      if (data?.usage) {
        updateUserPartial({ usage: data.usage })
      }
    }

    socket.on("job:statusChanged", data => handleJobChange(data, "statusChanged"))
    socket.on("job:updated", data => handleJobChange(data, "updated"))
    socket.on("job:created", data => handleJobChange(data, "created"))
    socket.on("job:deleted", data => handleJobChange(data, "deleted"))
    socket.on("user:usage", handleUsageUpdate)

    return () => {
      socket.off("job:statusChanged")
      socket.off("job:updated")
      socket.off("job:created")
      socket.off("job:deleted")
      socket.off("user:usage", handleUsageUpdate)
    }
  }, [queryClient, user, navigate, updateUserPartial])

  useEffect(() => {
    if (!user) {
      queryClient.removeQueries({ queryKey: ["jobs"] })
      setCurrentPage(1)
      setIsUserLoaded(false)
    } else {
      setIsUserLoaded(!!(user?.name || user?.credits))
    }
  }, [user, queryClient])

  const checkJobLimit = useCallback(() => {
    if (usage >= usageLimit) {
      openUpgradePopup({ featureName: "Additional Jobs", navigate })
      return false
    }
    return true
  }, [usage, usageLimit, navigate])

  const handleOpenJobModal = useCallback(() => {
    if (!checkJobLimit()) return
    openJobModal(null)
  }, [checkJobLimit, openJobModal])

  const handleEditJob = useCallback(
    job => {
      openJobModal(job)
    },
    [openJobModal]
  )

  const handleRefresh = () => {
    refetch()
    toast.success("Jobs list refreshed")
  }

  const activeJobsCount = queryJobs.filter(j => j.status === "active").length
  const stoppedJobsCount = queryJobs.filter(j => j.status !== "active").length

  const filteredJobs = useMemo(() => {
    return queryJobs.filter(
      job =>
        job.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job._id?.toString().includes(searchQuery)
    )
  }, [queryJobs, searchQuery])

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredJobs.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredJobs, currentPage])

  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE)
  const usagePercentage = Math.min(100, Math.round((usage / usageLimit) * 100))

  if (userPlan === "free") {
    return <UpgradeModal featureName="Content Agent" />
  }

  return (
    <>
      <Helmet>
        <title>Content Agent | GenWrite</title>
      </Helmet>

      <div className="min-h-screen">
        <div className="space-y-10 md:p-6 p-3 md:mt-0 mt-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Jobs Automation
              </h1>
              <p className="text-gray-600 mt-2">Manage your automated content generation jobs</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="join bg-white p-1 gap-1 rounded-xl border border-slate-200 shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`join-item btn btn-ghost btn-sm h-10 w-10 p-0 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "text-slate-400"
                  }`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`join-item btn btn-ghost btn-sm h-10 w-10 p-0 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "text-slate-400"
                  }`}
                >
                  <List size={18} />
                </button>
              </div>

              <button
                onClick={handleRefresh}
                disabled={queryLoading}
                className="btn btn-ghost bg-white rounded-lg hover:bg-slate-100 text-slate-600 font-bold border border-slate-200 h-12 px-6 shadow-sm"
              >
                <RefreshCw
                  size={18}
                  className={`${queryLoading ? "animate-spin" : ""} mr-2 text-slate-400`}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats & Create Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 p-8 rounded-xl border border-slate-200 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-800">Usage Overview</h3>
                    <p className="text-slate-500 font-bold text-sm">Monthly Subscription Metrics</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100 shadow-sm">
                    <Briefcase size={20} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-5xl font-black text-slate-900 tracking-tighter">
                        {usage}
                      </span>
                      <span className="text-xl font-bold text-slate-400 ml-2">/ {usageLimit}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-blue-600 tracking-tight">
                        {usagePercentage}%
                      </span>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        Resource Used
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${usagePercentage}%` }}
                      className={`h-full rounded-full ${usagePercentage > 90 ? "bg-rose-500" : "bg-blue-600"} shadow-lg shadow-blue-200`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenJobModal}
              disabled={usage >= usageLimit}
              className={`relative h-full text-left rounded-xl p-10 overflow-hidden group transition-all duration-500 ${
                usage >= usageLimit
                  ? "bg-slate-100 cursor-not-allowed grayscale"
                  : "bg-linear-to-br from-indigo-600 via-blue-700 to-indigo-800"
              }`}
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                <Sparkles size={160} />
              </div>

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-xl text-white rounded-lg flex items-center justify-center border border-white/20">
                  <Plus size={32} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Create New Job</h3>
                  <p className="text-indigo-100 font-medium leading-relaxed opacity-80">
                    Setup a new automated content generation stream.
                  </p>
                </div>
                {usage >= usageLimit && (
                  <div className="mt-4 flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
                    <AlertTriangle size={14} /> Full Capacity
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Job List/Grid Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pipelines</h2>
                <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200/60 w-fit">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-md shadow-xs border border-slate-200/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-700">
                      {activeJobsCount} Active
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span className="text-xs font-bold text-slate-500">
                      {stoppedJobsCount} Paused
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative group w-72">
                <input
                  type="text"
                  placeholder="Search pipelines..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input input-bordered w-full h-12 pl-12 rounded-lg border-slate-200 outline-0 font-medium"
                />
              </div>
            </div>

            {queryLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-white rounded-[32px] border border-slate-100 animate-pulse p-8 space-y-4"
                  >
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 rounded-full w-3/4" />
                        <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                      </div>
                    </div>
                    <div className="h-24 bg-slate-50 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-24 bg-white rounded-[40px] border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 shadow-xl shadow-slate-200/40">
                <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-[32px] flex items-center justify-center">
                  <Briefcase size={40} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">No pipelines found</h3>
                  <p className="text-slate-400 font-medium">Start automating your content today.</p>
                </div>
                <button
                  onClick={handleOpenJobModal}
                  className="btn btn-primary bg-indigo-600 border-none text-white h-12 px-8 rounded-2xl font-bold mt-4"
                >
                  Deploy Your First Job
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedJobs.map(job => (
                  <JobCard
                    key={job._id}
                    job={job}
                    setCurrentPage={setCurrentPage}
                    paginatedJobs={paginatedJobs}
                    onEdit={handleEditJob}
                  />
                ))}
              </div>
            ) : (
              <JobListView
                data={paginatedJobs}
                onEdit={handleEditJob}
                isToggling={isToggling}
                onToggleStatus={job => {
                  toggleStatus({ jobId: job._id, currentStatus: job.status })
                }}
                onDelete={job => {
                  handlePopup({
                    title: "Terminate Job",
                    description: `This action will permanently remove the pipeline "${job.name}". Are you sure?`,
                    confirmText: "Terminate",
                    onConfirm: () => deleteMutate(job._id),
                    confirmProps: { className: "btn-error" },
                  })
                }}
              />
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-8">
              <div className="join bg-white shadow-xl shadow-slate-200/40 rounded-2xl border border-slate-100 p-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="join-item btn btn-ghost h-12 w-12 rounded-xl p-0 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border-none"
                >
                  <ChevronLeft size={20} />
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`join-item btn h-12 w-12 rounded-xl text-sm font-black transition-all border-none ${
                      currentPage === i + 1
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                        : "btn-ghost text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="join-item btn btn-ghost h-12 w-12 rounded-xl p-0 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border-none"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        <JobModal user={user} userPlan={userPlan} isUserLoaded={isUserLoaded} />
      </div>
    </>
  )
}

export default Jobs
