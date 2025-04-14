import React from "react";

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
  );
};

export default SkeletonLoader;
