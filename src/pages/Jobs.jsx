import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet"
import { Pagination } from "antd"
import { FiPlus } from "react-icons/fi"
import { fetchJobs, openJobModal } from "@store/slices/jobSlice"
import { fetchBrands } from "@store/slices/brandSlice"
import { selectUser } from "@store/slices/authSlice"
import SkeletonLoader from "@components/Projects/SkeletonLoader"
import UpgradeModal from "@components/UpgradeModal"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import JobModal from "@components/Jobs/JobModal"
import JobCard from "@components/Jobs/JobCard"
import { AlertTriangle } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

const PAGE_SIZE = 15

const Jobs = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { jobs, loading: isLoading, showJobModal } = useSelector((state) => state.jobs)
  const { selectedKeywords } = useSelector((state) => state.analysis)
  const user = useSelector(selectUser)
  const userPlan = (user?.plan || user?.subscription?.plan || "free").toLowerCase()
  const [currentPage, setCurrentPage] = useState(1)
  const [showWarning, setShowWarning] = useState(false)
  const [isUserLoaded, setIsUserLoaded] = useState(false)
  const usage = user?.usage?.createdJobs
  const usageLimit = user?.usageLimits?.createdJobs

  // TanStack Query for fetching jobs
  const { data: queryJobs, isLoading: queryLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const response = await dispatch(fetchJobs()).unwrap() // Dispatch and unwrap the payload
      return response // Return the jobs data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // TanStack Query for fetching brands
  const { data: queryBrands } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await dispatch(fetchBrands()).unwrap() // Dispatch and unwrap the payload
      return response // Return the brands data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  console.log(queryBrands)

  const checkJobLimit = () => {
    if (usage >= usageLimit) {
      openUpgradePopup({
        featureName: "Additional Jobs",
        navigate,
      })
      return false
    }
    return true
  }

  const handleOpenJobModal = () => {
    if (!checkJobLimit()) return
    dispatch(openJobModal(null)) // Pass null for new job
  }

  useEffect(() => {
    setIsUserLoaded(!!(user?.name || user?.credits))
  }, [user])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  const totalPages = useMemo(() => Math.ceil(jobs.length / PAGE_SIZE), [jobs])

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return jobs.slice(startIndex, startIndex + PAGE_SIZE)
  }, [jobs, currentPage])

  if (userPlan === "free") {
    return <UpgradeModal featureName="Content Agent" />
  }

  return (
    <>
      <Helmet>
        <title>Content Agent | GenWrite</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 p-8">
        <div>
          <div className="flex justify-between">
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
            {usage === usageLimit && (
              <button
                onClick={() => setShowWarning((prev) => !prev)}
                className="text-yellow-500 hover:text-yellow-600 transition"
                title="View usage warning"
              >
                <AlertTriangle className="w-6 h-6" />
              </button>
            )}
          </div>

          {showWarning && usage === usageLimit && (
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
            whileHover={{ y: -2 }}
            className="w-full md:w-1/2 lg:w-1/3 h-48 p-6 bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer mb-8"
            onClick={handleOpenJobModal}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="bg-blue-100 rounded-lg p-3">
                <FiPlus className="w-6 h-6 text-blue-600" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-semibold text-gray-800">Create New Job</h3>
              <p className="text-gray-500 mt-2 text-sm">
                Set up automated content generation with custom templates and scheduling
              </p>
            </div>
          </motion.div>
          {jobs.length > 0 && (
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Active Jobs</h2>
          )}

          {queryLoading || isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(PAGE_SIZE)].map((_, index) => (
                <SkeletonLoader key={index} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
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
                total={jobs.length}
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