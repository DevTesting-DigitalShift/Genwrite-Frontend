import React from "react"
import { motion } from "framer-motion"

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
