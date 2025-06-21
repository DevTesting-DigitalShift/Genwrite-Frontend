import React from "react"
import { motion } from "framer-motion"
import clsx from "clsx"

const SkeletonLoader = () => {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
      <div className="flex space-x-2 mt-2">
        <div className="h-6 bg-blue-100 rounded-full w-16"></div>
        <div className="h-6 bg-blue-100 rounded-full w-20"></div>
      </div>
    </div>
  )
}

export default SkeletonLoader

export const SkeletonCard = () => (
  <motion.div
    className="animate-pulse bg-white p-6 rounded-xl shadow-md border border-gray-100"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="h-6 bg-gray-200 w-1/3 mb-4 rounded" />
    <div className="h-10 bg-gray-200 w-1/2 mb-6 rounded" />
    <div className="h-4 bg-gray-200 w-full mb-2 rounded" />
    <div className="h-4 bg-gray-200 w-3/4 mb-2 rounded" />
    <div className="h-10 bg-gray-300 w-full rounded mt-4" />
  </motion.div>
)

export const SkeletonDashboardCard = ({ className = "" }) => {
  return (
    <div
      className={clsx(
        " h-44 p-4 rounded-md bg-[#FAFAFA] border shadow-sm animate-pulse flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-10 h-10 bg-gray-200 rounded-full"
        />
      </div>

      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="w-3/4 h-5 bg-gray-200 rounded mb-2"
      />

      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="w-full h-4 bg-gray-200 rounded mb-1"
      />
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="w-5/6 h-4 bg-gray-200 rounded"
      />
    </div>
  )
}

export const SkeletonGridCard = ({ className = "" }) => {
  return (
    <div
      className={clsx(
        "h-44 p-4 mb-8 rounded-md bg-[#FAFAFA] border shadow-sm animate-pulse flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        {/* Icon placeholder */}
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-10 h-10 bg-gray-200 rounded-full"
        />
        {/* Optional badge placeholder */}
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-14 h-6 bg-gray-200 rounded-full"
        />
      </div>

      {/* Title line */}
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="w-3/4 h-5 bg-gray-200 rounded mb-2"
      />

      {/* Content lines */}
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="w-full h-4 bg-gray-200 rounded mb-1"
      />
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="w-5/6 h-4 bg-gray-200 rounded"
      />
    </div>
  )
}

