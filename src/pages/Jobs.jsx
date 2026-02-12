import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet"
import { Pagination, message } from "antd"
import { Plus, RefreshCw, Briefcase, Search, AlertTriangle, Sparkles, Zap } from "lucide-react"
import useAuthStore from "@store/useAuthStore"
import useJobStore from "@store/useJobStore"
import useAnalysisStore from "@store/useAnalysisStore"
import SkeletonLoader from "@components/UI/SkeletonLoader"
import UpgradeModal from "@components/UpgradeModal"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import JobModal from "@/layout/Jobs/JobModal"
import JobCard from "@/layout/Jobs/JobCard"
import { useJobsQuery } from "@api/queries/jobQueries"
import { getSocket } from "@utils/socket"
import { useQueryClient } from "@tanstack/react-query"

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
    className={`group flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px] rounded-3xl border-2 border-dashed transition-all duration-300 ${
      disabled
        ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-60"
        : "bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer"
    }`}
  >
    <div
      className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 mb-6 ${
        disabled
          ? "bg-slate-100 text-slate-400"
          : "bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white"
      }`}
    >
      <Plus size={32} strokeWidth={2.5} />
    </div>
    <h3
      className={`font-bold text-xl mb-2 transition-colors ${
        disabled ? "text-slate-400" : "text-slate-900 group-hover:text-indigo-700"
      }`}
    >
      Create New Job
    </h3>
    <p className="text-slate-500 text-sm max-w-[220px] mx-auto leading-relaxed">
      Automate content generation with custom templates and intelligent scheduling.
    </p>
    {disabled && (
      <div className="mt-4 flex items-center gap-1.5 text-rose-500 text-xs font-bold bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
        <AlertTriangle size={14} /> Limit Reached
      </div>
    )}
  </motion.button>
)

const Jobs = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { showJobModal, openJobModal, closeJobModal } = useJobStore()
  const { selectedKeywords } = useAnalysisStore()
  const [searchQuery, setSearchQuery] = useState("")

  const userPlan = (user?.plan || user?.subscription?.plan || "free").toLowerCase()
  const [currentPage, setCurrentPage] = useState(1)
  const [isUserLoaded, setIsUserLoaded] = useState(false)

  const usage = user?.usage?.createdJobs || 0
  const usageLimit = user?.usageLimits?.createdJobs || 0

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

  if (userPlan === "free") {
    return <UpgradeModal featureName="Content Agent" />
  }

  return (
    <>
      <Helmet>
        <title>Automation Jobs | GenWrite</title>
      </Helmet>

      <div className="p-4 md:p-6 lg:p-8">
        {/* Page Header */}
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200/60">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Jobs Automation
              </h1>
              <p className="text-slate-500 text-sm max-w-md">
                Manage and monitor your automated content generation streams effortlessly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={queryLoading}
                className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-sm active:scale-95"
              >
                <RefreshCw
                  size={16}
                  className={`${queryLoading ? "animate-spin" : ""} text-slate-400`}
                />
                Refresh
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

        {/* Jobs Grid */}
        {queryLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(PAGE_SIZE)].map((_, index) => (
              <SkeletonLoader key={index} className="rounded-3xl h-[400px]" />
            ))}
          </div>
        ) : filteredJobs.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
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
        ) : (
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
