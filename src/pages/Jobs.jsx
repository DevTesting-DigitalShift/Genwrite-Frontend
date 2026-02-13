import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSelector } from "react-redux"
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
} from "lucide-react"
import { getJobs, startJob, stopJob, deleteJob } from "@api/jobApi"
import { selectUser } from "@store/slices/authSlice"
import SkeletonLoader from "@components/UI/SkeletonLoader"
import UpgradeModal from "@components/UpgradeModal"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import JobModal from "@/layout/Jobs/JobModal"
import JobCard from "@/layout/Jobs/JobCard"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getSocket } from "@utils/socket"

const PAGE_SIZE = 12 // Adjusted for better grid symmetry

const CreateNewJobCard = ({ onClick, disabled }) => (
  <motion.button
    whileHover={
      !disabled
        ? { y: -5, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }
        : {}
    }
    whileTap={!disabled ? { scale: 0.98 } : {}}
    onClick={onClick}
    disabled={disabled}
    className={`group flex flex-col items-center justify-center p-6 text-center h-full min-h-[300px] rounded-2xl border-2 border-dashed transition-all duration-300 ${
      disabled
        ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-60"
        : "bg-white border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 cursor-pointer"
    }`}
  >
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 mb-4 ${
        disabled
          ? "bg-slate-100 text-slate-400"
          : "bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white"
      }`}
    >
      <Plus size={24} strokeWidth={2.5} />
    </div>
    <h3
      className={`font-bold text-lg mb-1 transition-colors ${
        disabled ? "text-slate-400" : "text-slate-900"
      }`}
    >
      Create New Job
    </h3>
    <p className="text-slate-400 text-sm max-w-[200px] mx-auto">
      Automate your content generation pipeline.
    </p>
    {disabled && (
      <div className="mt-4 flex items-center gap-1.5 text-rose-500 text-xs font-bold bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
        <AlertTriangle size={14} /> Limit Reached
      </div>
    )}
  </motion.button>
)

const JobListView = ({ data, onEdit, onToggleStatus, onDelete, isToggling }) => {
  const getTrueOptions = options => {
    if (!options) return []
    const mapping = {
      wordpressPosting: "WordPress Posting",
      includeFaqs: "FAQs",
      includeCompetitorResearch: "Competitor Research",
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

  const renderArray = (arr, limit = 5) => {
    if (!arr || arr.length === 0) return <span className="text-slate-300">-</span>
    const display = arr.slice(0, limit)
    const remaining = arr.length - limit
    return (
      <div className="flex flex-wrap gap-1">
        {display.map((item, i) => (
          <span
            key={i}
            className="px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded text-[10px] border border-slate-100 whitespace-nowrap"
          >
            {item}
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-[10px] font-bold text-indigo-500">+{remaining}</span>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
      <table className="w-full text-left border-collapse min-w-[1200px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Job Name
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Schedule & Volume
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Topics
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Keywords
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Settings
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Source
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map(job => (
            <tr key={job._id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-black text-slate-900 text-[15px] mb-0.5">{job.name}</div>
                <div className="flex items-center gap-2">
                  <div className="text-[10px] text-slate-400 font-bold">
                    ID: {job._id.toString().slice(-6)}
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 rounded uppercase">
                    {job.blogs?.aiModel}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => onToggleStatus(job)}
                    disabled={isToggling}
                    className={`w-max px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      job.status === "active"
                        ? "bg-slate-900 text-white"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    }`}
                  >
                    {job.status === "active" ? "Running" : "Start"}
                  </button>
                  <div className="text-[10px] font-bold text-slate-400">
                    {job.createdBlogs?.length || 0} GENERATED
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-slate-700 capitalize">
                  {job.schedule?.type}
                </div>
                <div className="text-xs text-slate-400">{job.blogs?.numberOfBlogs} blogs / day</div>
              </td>
              <td className="px-6 py-4 max-w-[200px]">{renderArray(job.blogs?.topics)}</td>
              <td className="px-6 py-4 max-w-[200px]">{renderArray(job.blogs?.keywords)}</td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {getTrueOptions(job.options).map((opt, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold"
                    >
                      {opt}
                    </span>
                  ))}
                  {getTrueOptions(job.options).length === 0 && (
                    <span className="text-slate-300 text-[10px]">No active extras</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    {job.blogs?.languageToWrite}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium capitalize">
                    {job.blogs?.tone} Tone
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => onEdit(job)}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(job)}
                    className="text-xs font-bold text-rose-500 hover:underline"
                  >
                    Delete
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
  const [showJobModal, setShowJobModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("jobs_view_mode") || "grid"
  })

  // Persistence of view preference
  useEffect(() => {
    localStorage.setItem("jobs_view_mode", viewMode)
  }, [viewMode])

  // Mutations for List View
  const toggleJobStatusMutation = useMutation({
    mutationFn: async ({ jobId, currentStatus }) => {
      if (currentStatus === "active") await stopJob(jobId)
      else await startJob(jobId)
      return { jobId, status: currentStatus === "active" ? "stop" : "active" }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      message.success("Job status updated")
    },
  })

  const deleteJobMutation = useMutation({
    mutationFn: async jobId => {
      await deleteJob(jobId)
      return jobId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      message.success("Job deleted")
    },
  })

  const { selectedKeywords } = useSelector(state => state.analysis)
  const user = useSelector(selectUser)
  const userPlan = (user?.plan || user?.subscription?.plan || "free").toLowerCase()
  const [currentPage, setCurrentPage] = useState(1)
  const [showWarning, setShowWarning] = useState(false)
  const [isUserLoaded, setIsUserLoaded] = useState(false)

  const usage = user?.usage?.createdJobs || 0
  const usageLimit = user?.usageLimits?.createdJobs || 0

  // TanStack Query
  const {
    data: queryJobs = [],
    isLoading: queryLoading,
    refetch,
  } = useQuery({
    queryKey: ["jobs", user?.id],
    queryFn: async () => {
      const response = await getJobs()
      return response || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user,
  })

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
    setSelectedJob(null)
    setShowJobModal(true)
  }, [checkJobLimit])

  const handleEditJob = useCallback(job => {
    setSelectedJob(job)
    setShowJobModal(true)
  }, [])

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

  if (userPlan === "free") {
    return <UpgradeModal featureName="Content Agent" />
  }

  return (
    <>
      <Helmet>
        <title>Automation Jobs | GenWrite</title>
      </Helmet>

      <div className="p-4 md:p-6 lg:p-10 max-w-[1800px] mx-auto">
        {/* Page Header */}
        <header className="mb-10">
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
                className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-sm"
              >
                <RefreshCw
                  size={16}
                  className={`${queryLoading ? "animate-spin" : ""} text-slate-400`}
                />
                Refresh
              </button>

              <button
                onClick={handleOpenJobModal}
                disabled={usage >= usageLimit}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-200"
              >
                <Plus size={18} /> New Job
              </button>
            </div>
          </div>

          {/* Warning Banner */}
          <AnimatePresence>
            {usage >= usageLimit && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 bg-amber-50 border border-amber-200 p-4 rounded-3xl">
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
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-2xl font-bold text-xs transition-colors shadow-lg shadow-amber-600/20 whitespace-nowrap"
                  >
                    Upgrade Now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Jobs Layout View */}
        {queryLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <CreateNewJobCard onClick={handleOpenJobModal} disabled={usage >= usageLimit} />
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
            isToggling={toggleJobStatusMutation.isPending}
            isDeleting={deleteJobMutation.isPending}
            onToggleStatus={job => {
              toggleJobStatusMutation.mutate({ jobId: job._id, currentStatus: job.status })
            }}
            onDelete={job => {
              handlePopup({
                title: "Delete Job",
                description: `Are you sure you want to delete "${job.name}"?`,
                confirmText: "Delete",
                onConfirm: () => deleteJobMutation.mutate(job._id),
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

        <JobModal
          showJobModal={showJobModal}
          setShowJobModal={setShowJobModal}
          selectedJob={selectedJob}
          selectedKeywords={selectedKeywords}
          user={user}
          userPlan={userPlan}
          isUserLoaded={isUserLoaded}
        />
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
