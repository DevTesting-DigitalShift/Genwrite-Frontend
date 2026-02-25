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

const JobListView = ({ data, onEdit, onToggleStatus, onDelete, isToggling }) => {
  const getTrueOptions = options => {
    if (!options) return []
    const mapping = {
      wordpressPosting: "WordPress",
      includeFaqs: "FAQs",
      includeCompetitorResearch: "Competitor",
      includeInterlinks: "Interlinks",
      performKeywordResearch: "Keywords",
      includeTableOfContents: "TOC",
      addOutBoundLinks: "Outbound",
      embedYouTubeVideos: "YouTube",
      easyToUnderstand: "Simple",
    }
    return Object.entries(options)
      .filter(([key, value]) => value === true && mapping[key])
      .map(([key]) => mapping[key])
  }

  const renderArray = (arr, limit = 3) => {
    if (!arr || arr.length === 0) return <span className="text-slate-300">-</span>
    const display = arr.slice(0, limit)
    const remaining = arr.length - limit
    return (
      <div className="flex flex-wrap gap-1">
        {display.map((item, i) => (
          <span
            key={i}
            className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-medium border border-slate-100 whitespace-nowrap"
          >
            {item}
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
            +{remaining}
          </span>
        )}
      </div>
    )
  }

  const formatLastRun = dateStr => {
    if (!dateStr) return <span className="text-slate-300 italic text-[11px]">Never run</span>
    try {
      const date = new Date(dateStr)
      return (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-700">
            {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
          <span className="text-[10px] text-slate-400">
            {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )
    } catch (e) {
      return <span className="text-slate-300">-</span>
    }
  }

  return (
    <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-100">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200">
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Job Details
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Intelligence
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Last Run
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Schedule
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Topics
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Config
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map(job => (
            <tr key={job._id} className="hover:bg-slate-50/60 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{job.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">
                      ID: {job._id?.toString().slice(-6)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start gap-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {job.blogs?.aiModel?.toUpperCase() || "AI"}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium pl-0.5">
                    {job.blogs?.languageToWrite}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start gap-1">
                  <button
                    onClick={() => onToggleStatus(job)}
                    disabled={isToggling}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      job.status === "active"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {job.status === "active" ? "Running" : "Paused"}
                  </button>
                </div>
              </td>
              <td className="px-6 py-4">{formatLastRun(job.lastRun)}</td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700 capitalize">
                    {job.schedule?.type || "Manual"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {job.blogs?.numberOfBlogs} {job.blogs?.numberOfBlogs === 1 ? "blog" : "blogs"}
                    /day
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 max-w-[200px]">{renderArray(job.blogs?.topics, 2)}</td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {getTrueOptions(job.options).length > 0 ? (
                    getTrueOptions(job.options)
                      .slice(0, 3)
                      .map((opt, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 bg-white text-slate-500 rounded text-[10px] font-medium border border-slate-200 shadow-xs"
                        >
                          {opt}
                        </span>
                      ))
                  ) : (
                    <span className="text-slate-300 text-[10px]">Basic</span>
                  )}
                  {getTrueOptions(job.options).length > 3 && (
                    <span className="text-[10px] text-slate-400 px-1">+More</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(job)}
                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit Job"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(job)}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Job"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
      queryClient.invalidateQueries({ queryKey: ["jobs", user.id] })
    }

    socket.on("job:statusChanged", data => handleJobChange(data, "statusChanged"))
    socket.on("job:updated", data => handleJobChange(data, "updated"))
    socket.on("job:created", data => handleJobChange(data, "created"))
    socket.on("job:deleted", data => handleJobChange(data, "deleted"))

    return () => {
      socket.off("job:statusChanged")
      socket.off("job:updated")
      socket.off("job:created")
      socket.off("job:deleted")
    }
  }, [queryClient, user, navigate])

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
        <div className="space-y-10 p-6">
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
                  : "bg-linear-to-br from-indigo-600 via-blue-700 to-indigo-800 shadow-2xl shadow-indigo-200"
              }`}
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                <Sparkles size={160} />
              </div>

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-xl text-white rounded-lg flex items-center justify-center border border-white/20 shadow-2xl">
                  <Plus size={32} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Create New Pipeline</h3>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Jobs</h2>
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
