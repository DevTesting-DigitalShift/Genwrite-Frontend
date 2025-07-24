import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Pagination } from "antd";
import { FiPlus } from "react-icons/fi";
import {
  fetchJobs,
  openJobModal,
} from "@store/slices/jobSlice";
import { fetchBrands } from "@store/slices/brandSlice";
import { selectUser } from "@store/slices/authSlice";
import SkeletonLoader from "@components/Projects/SkeletonLoader";
import UpgradeModal from "@components/UpgradeModal";
import { openUpgradePopup } from "@utils/UpgardePopUp";
import JobModal from "@components/Jobs/JobModal";
import JobCard from "@components/Jobs/JobCard";

const PAGE_SIZE = 15;

const Jobs = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { jobs, loading: isLoading, showJobModal } = useSelector((state) => state.jobs);
  const { selectedKeywords } = useSelector((state) => state.analysis);
  const user = useSelector(selectUser);
  const userPlan = (user?.plan || user?.subscription?.plan || "free").toLowerCase();
  const [currentPage, setCurrentPage] = useState(1);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  const JOB_LIMITS = {
    free: 0,
    basic: 1,
    pro: 5,
    enterprise: Infinity,
  };

  const checkJobLimit = () => {
    const limit = JOB_LIMITS[userPlan] || 0;
    if (jobs.length >= limit) {
      message.error(
        `You have reached the job limit for your ${userPlan} plan (${limit} job${
          limit === 1 ? "" : "s"
        }). ${
          userPlan === "basic"
            ? "Delete an existing job to create a new one."
            : "Please upgrade your plan to create more jobs."
        }`
      );
      if (userPlan !== "basic") {
        openUpgradePopup({ featureName: "Additional Jobs", navigate });
      }
      return false;
    }
    return true;
  };

  const handleOpenJobModal = () => {
    if (!isUserLoaded) {
      message.error("User data is still loading. Please try again.");
      return;
    }
    if (!checkJobLimit()) return;
    dispatch(openJobModal());
  };

  useEffect(() => {
    dispatch(fetchJobs());
    dispatch(fetchBrands());
  }, [dispatch]);

  useEffect(() => {
    setIsUserLoaded(!!(user?.name || user?.credits));
  }, [user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const totalPages = useMemo(() => Math.ceil(jobs.length / PAGE_SIZE), [jobs]);

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return jobs.slice(startIndex, startIndex + PAGE_SIZE);
  }, [jobs, currentPage]);

  if (userPlan === "free") {
    return <UpgradeModal featureName="Content Agent" />;
  }

  return (
    <>
      <Helmet>
        <title>Content Agent | GenWrite</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 p-8">
        <div>
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

          {isLoading ? (
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
  );
};

export default Jobs;