"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet"
import { Pagination, Button } from "antd"
import { FiPlus } from "react-icons/fi"
import { RefreshCcw } from "lucide-react"
import { fetchJobs, openJobModal } from "@store/slices/jobSlice"
import { selectUser } from "@store/slices/authSlice"
import SkeletonLoader from "@components/UI/SkeletonLoader"
import UpgradeModal from "@components/UpgradeModal"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import JobModal from "@/layout/Jobs/JobModal"
import JobCard from "@/layout/Jobs/JobCard"
import { AlertTriangle } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getSocket } from "@utils/socket"

const PAGE_SIZE = 15

const Jobs = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showJobModal } = useSelector((state) => state.jobs)
  const { selectedKeywords } = useSelector((state) => state.analysis)
  const user = useSelector(selectUser)
  const userPlan = (user?.plan || user?.subscription?.plan || "free").toLowerCase()
  const [currentPage, setCurrentPage] = useState(1)
  const [showWarning, setShowWarning] = useState(false)
  const [isUserLoaded, setIsUserLoaded] = useState(false)
  const usage = user?.usage?.createdJobs
  const usageLimit = user?.usageLimits?.createdJobs

  // TanStack Query for fetching jobs
  const { data: queryJobs = [], isLoading: queryLoading } = useQuery({
    queryKey: ["jobs", user?.id],
    queryFn: async () => {
      const response = await dispatch(fetchJobs()).unwrap()
      return response || []
    },
    staleTime: Infinity, // Data never becomes stale
    gcTime: Infinity, // Cache persists for the session
    refetchOnMount: "always", // Fetch only if cache is empty
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    enabled: !!user, // Only fetch if user is logged in
  })

  // Socket for real-time updates
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !user) return

    const handleJobChange = (data, eventType) => {
      console.debug(`Job event: ${eventType}`, data)
      const queryKey = ["jobs", user.id]

      if (eventType === "job:deleted") {
        // Remove from cache if deleted
        queryClient.setQueryData(queryKey, (old = []) =>
          old.filter((job) => job._id !== data.jobId)
        )
        queryClient.removeQueries({ queryKey: ["job", data.jobId] })
      } else if (eventType === "job:created") {
        // Invalidate for new jobs to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ["jobs", user.id], exact: false })
      } else {
        // Update or add the job in the list cache
        queryClient.setQueryData(queryKey, (old = []) => {
          const index = old.findIndex((job) => job._id === data.jobId)
          if (index > -1) {
            // Update existing job
            old[index] = { ...old[index], ...data }
            return [...old]
          } else {
            // Add new job (if not handled by job:created)
            return [data, ...old]
          }
        })
        // Update single job query if exists
        queryClient.setQueryData(["job", data.jobId], (old) => ({ ...old, ...data }))
      }
    }

    socket.on("job:statusChanged", (data) => handleJobChange(data, "job:statusChanged"))
    socket.on("job:updated", (data) => handleJobChange(data, "job:updated"))
    socket.on("job:created", (data) => handleJobChange(data, "job:created"))
    socket.on("job:deleted", (data) => handleJobChange(data, "job:deleted"))

    return () => {
      socket.off("job:statusChanged")
      socket.off("job:updated")
      socket.off("job:created")
      socket.off("job:deleted")
    }
  }, [queryClient, user])

  // Clear cache on user logout
  useEffect(() => {
    if (!user) {
      queryClient.removeQueries({ queryKey: ["jobs"] })
      setCurrentPage(1)
      setShowWarning(false)
      setIsUserLoaded(false)
    } else {
      setIsUserLoaded(!!(user?.name || user?.credits))
    }
  }, [user, queryClient])

  const checkJobLimit = useCallback(() => {
    if (usage >= usageLimit) {
      openUpgradePopup({
        featureName: "Additional Jobs",
        navigate,
      })
      return false
    }
    return true
  }, [usage, usageLimit, navigate])

  const handleOpenJobModal = useCallback(() => {
    if (!checkJobLimit()) return
    dispatch(openJobModal(null)) // Pass null for new job
  }, [dispatch, checkJobLimit])

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["jobs", user?.id] })
  }, [queryClient, user])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  const totalPages = useMemo(() => Math.ceil(queryJobs.length / PAGE_SIZE), [queryJobs])

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return queryJobs.slice(startIndex, startIndex + PAGE_SIZE)
  }, [queryJobs, currentPage])

  if (userPlan === "free") {
    return <UpgradeModal featureName="Content Agent" />
  }

  return (
    <>
      <Helmet>
        <title>Content Agent | GenWrite</title>
      </Helmet>
      <div className="min-h-screen p-6 lg:p-8">
        <div>
          <div className="flex justify-between mt-5 md:mt-0">
            <div className="mb-8">
              <motion.h1
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                Jobs Automation
              </motion.h1>
              <p className="text-gray-600 mt-2">Manage your automated content generation jobs</p>
            </div>
            <div className="flex gap-2">
              {usage >= usageLimit && (
                <button
                  onClick={() => setShowWarning((prev) => !prev)}
                  className="text-yellow-500 hover:text-yellow-600 transition"
                  title="View usage warning"
                >
                  <AlertTriangle className="w-6 h-6" />
                </button>
              )}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="default"
                  icon={<RefreshCcw className="w-4 sm:w-5 h-4 sm:h-5" />}
                  onClick={handleRefresh}
                  disabled={queryLoading}
                  className="text-xs sm:text-sm px-4 py-2"
                >
                  Refresh
                </Button>
              </motion.div>
            </div>
          </div>

          {showWarning && usage >= usageLimit && (
            <div className="flex items-start mb-10 gap-3 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm text-sm">
              <div className="pt-1 text-yellow-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-yellow-900">
                <p className="font-semibold mb-1">Monthly Job Creation Limit Reached</p>
                <p className="mb-1">
                  You've created <span className="font-bold text-black">{usage}</span> out of{" "}
                  <span className="font-bold text-black">{usageLimit}</span> allowed jobs this
                  month. You can't create any more jobs until your next billing cycle.
                </p>
                <p className="text-red-400 text-xs font-semibold">
                  Tip: Update your current job instead of deleting and recreating.
                </p>
              </div>
            </div>
          )}

          <motion.div
            className="w-full md:w-1/2 lg:w-1/3 h-52 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl cursor-pointer mb-8 transition-all duration-300 border border-gray-100"
            onClick={handleOpenJobModal}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="bg-blue-50 rounded-2xl p-4 shadow-inner">
                <FiPlus className="w-7 h-7 text-blue-600" />
              </span>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 tracking-wide">Create New Job</h3>
              <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                Automate content generation with custom templates and scheduling.
              </p>
            </div>
          </motion.div>

          {queryJobs.length > 0 && (
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Active Jobs</h2>
          )}

          {queryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(PAGE_SIZE)].map((_, index) => (
                <SkeletonLoader key={index} />
              ))}
            </div>
          ) : queryJobs.length === 0 ? (
            <div
              className="flex flex-col justify-center items-center"
              style={{ minHeight: "calc(100vh - 250px)" }}
            >
              <p className="text-xl text-gray-600">No jobs available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  setCurrentPage={setCurrentPage}
                  paginatedJobs={paginatedJobs}
                />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={queryJobs.length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                responsive
              />
            </div>
          )}
        </div>
        <JobModal
          showJobModal={showJobModal}
          selectedKeywords={selectedKeywords}
          user={user}
          userPlan={userPlan}
          isUserLoaded={isUserLoaded}
        />
      </div>
    </>
  )
}

export default Jobs
