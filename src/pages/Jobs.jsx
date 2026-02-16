import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet"
import { Pagination, message } from "antd"
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
import SkeletonLoader from "@components/UI/SkeletonLoader"
import UpgradeModal from "@components/UpgradeModal"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import JobModal from "@/layout/Jobs/JobModal"
import JobCard from "@/layout/Jobs/JobCard"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getSocket } from "@utils/socket"

const PAGE_SIZE = 12 // Adjusted for better grid symmetry

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
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
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
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit Job"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(job)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Job"
                  >
                    <Trash2 size={16} />
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

  // Persistence of view preference
  useEffect(() => {
    localStorage.setItem("jobs_view_mode", viewMode)
  }, [viewMode])

  // Mutations for List View
  const { mutate: toggleStatus, isPending: isToggling } = useToggleJobStatusMutation()
  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteJobMutation()

  const selectedKeywords = useAnalysisStore(state => state.selectedKeywords)
  const user = useAuthStore(state => state.user)
  const userPlan = (user?.plan || user?.subscription?.plan || "free").toLowerCase()
  const [currentPage, setCurrentPage] = useState(1)
  const [isUserLoaded, setIsUserLoaded] = useState(false)

  const usage = user?.usage?.createdJobs || 0
  const usageLimit = user?.usageLimits?.createdJobs || 0
  const credits = user?.credits?.base || 0

  // TanStack Query
  const { data: queryJobs = [], isLoading: queryLoading, refetch } = useJobsQuery(!!user)

  // Real-time Updates
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !user) return

    const handleJobChange = (data, eventType) => {
      if (
        (data?.status === "stop" || data?.status === "stopped") &&
        data?.reason?.toLowerCase().includes("insufficient credits")
      ) {
        message.error({
          content: (
            <div className="text-left">
              <strong className="block">Job Stopped: Insufficient Credits</strong>
              <p className="text-xs mt-1 text-slate-500">
                You don't have enough credits to continue this job.
              </p>
              <button
                onClick={() => navigate("/pricing")}
                className="mt-2 text-indigo-600 font-bold text-xs hover:underline flex items-center gap-1"
              >
                Add Credits <Sparkles size={12} />
              </button>
            </div>
          ),
          duration: 10,
        })
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
    message.success("Jobs list refreshed")
  }

  // Filter & Pagination
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
        <title>Automation Jobs | GenWrite</title>
      </Helmet>

      <div className="p-4 md:p-6 lg:p-10 max-w-[1700px] mx-auto">
        {/* Page Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Automation Jobs</h1>
              <p className="text-slate-500 text-base font-medium">
                Create and manage your automated content generation pipelines.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl mr-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="List View"
                >
                  <List size={18} />
                </button>
              </div>

              <button
                onClick={handleRefresh}
                disabled={queryLoading}
                className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-sm cursor-pointer"
              >
                <RefreshCw
                  size={16}
                  className={`${queryLoading ? "animate-spin" : ""} text-slate-400`}
                />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Stats & Create Job Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Stats Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm lg:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Your Usage Overview</h3>
                <p className="text-slate-500 text-sm">Monthly active job limits.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 mt-2">
              {/* Jobs Limit Stat */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100">
                  <Briefcase size={24} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl font-black text-slate-900">
                      {usage}{" "}
                      <span className="text-base text-slate-400 font-medium">/ {usageLimit}</span>
                    </span>
                    <span className="text-xs font-bold text-slate-500">{usagePercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${usagePercentage > 90 ? "bg-rose-500" : "bg-blue-500"}`}
                      style={{ width: `${usagePercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">
                    Jobs Created
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Create New Job Banner (Replaces the card) */}
          <button
            onClick={handleOpenJobModal}
            disabled={usage >= usageLimit}
            className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 border-2 cursor-pointer ${
              usage >= usageLimit
                ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-80"
                : "bg-indigo-600 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-200"
            }`}
          >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <Sparkles size={140} fill="currentColor" />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center mb-4 backdrop-blur-sm shadow-inner">
                  <Plus size={24} strokeWidth={3} />
                </div>
                <h3
                  className={`text-xl font-black mb-2 ${usage >= usageLimit ? "text-slate-400" : "text-white"}`}
                >
                  Create New Job
                </h3>
                <p
                  className={`text-sm font-medium max-w-[240px] leading-relaxed ${usage >= usageLimit ? "text-slate-400" : "text-indigo-100"}`}
                >
                  Setup a new automated content pipeline for your strategy.
                </p>
              </div>

              {usage >= usageLimit && (
                <div className="flex items-center gap-2 text-rose-600 text-xs font-bold bg-white px-3 py-1.5 rounded-lg w-max mt-4 shadow-sm">
                  <AlertTriangle size={14} /> Limit Reached
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Warning Banner */}
        <AnimatePresence>
          {usage >= usageLimit && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-amber-50 border border-amber-200 p-4 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-bold text-amber-900">Job Creation Limit Reached</h4>
                  <p className="text-amber-700 text-sm">
                    You've used <span className="font-black">{usage}</span> of your{" "}
                    <span className="font-black">{usageLimit}</span> job slots. Consider upgrading
                    for more.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/pricing")}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-2xl font-bold text-xs transition-colors shadow-lg shadow-amber-600/20 whitespace-nowrap cursor-pointer"
                >
                  Upgrade Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Jobs Layout View */}
        {queryLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(PAGE_SIZE)].map((_, index) => (
              <SkeletonLoader key={index} className="rounded-2xl h-[300px]" />
            ))}
          </div>
        ) : filteredJobs.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <Search size={32} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">No Results Found</h3>
            <p className="text-slate-500 text-sm">
              We couldn't find any jobs matching "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
            >
              Clear Search
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            isDeleting={isDeleting}
            onToggleStatus={job => {
              toggleStatus({ jobId: job._id, currentStatus: job.status })
            }}
            onDelete={job => {
              handlePopup({
                title: "Delete Job",
                description: `Are you sure you want to delete "${job.name}"?`,
                confirmText: "Delete",
                onConfirm: () => deleteMutate(job._id),
                confirmProps: { danger: true },
              })
            }}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12 bg-white/50 p-4 rounded-3xl border border-slate-100 shadow-sm backdrop-blur-sm">
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={filteredJobs.length}
              onChange={setCurrentPage}
              showSizeChanger={false}
              responsive
              className="jobs-pagination"
            />
          </div>
        )}

        <JobModal user={user} userPlan={userPlan} isUserLoaded={isUserLoaded} />
      </div>

      <style jsx global>{`
        .jobs-pagination .ant-pagination-item {
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-weight: 600;
        }
        .jobs-pagination .ant-pagination-item-active {
          background: #4f46e5;
          border-color: #4f46e5;
        }
        .jobs-pagination .ant-pagination-item-active a {
          color: white !important;
        }
        .jobs-pagination .ant-pagination-prev .ant-pagination-item-link,
        .jobs-pagination .ant-pagination-next .ant-pagination-item-link {
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
      `}</style>
    </>
  )
}

export default Jobs
