import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const DashboardBox = ({ imageUrl, title, content, id, functions }) => {
  return (
    <div
      className="w-1/2 md:w-1/3 h-44 p-4 break-words rounded-md bg-[#FAFAFA] shadow-md hover:shadow-xl cursor-pointer border hover:border-blue-100 hover:shadow-gray-200 transition duration-200"
      onClick={() => {
        if (id === "A") {
          functions.showQuickBlogModal && functions.showQuickBlogModal();
        } else if (id === 1) {
          functions.showModal && functions.showModal();
        } else if (id === "B") {
          functions.showMultiStepModal && functions.showMultiStepModal();
        } else if (id === 4) {
          functions.showCompetitiveAnalysis && functions.showCompetitiveAnalysis();
        } else if (id === 3) {
          functions.showPerformanceMonitoring && functions.showPerformanceMonitoring();
        }
      }}
    >
      <div className="flex items-center space-x-4">
        <span className="bg-[#E8F1FA] rounded-full p-2">
          <motion.div
            whileHover={{ scale: 1.15, rotate: 8 }}
            animate={{
              y: [0, -4, 0],
              boxShadow: [
                '0 0 0px #a5b4fc',
                '0 0 12px #a5b4fc',
                '0 0 0px #a5b4fc'
              ],
              transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' }
            }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="inline-block"
          >
            <img src={imageUrl} alt={title} className="w-6 h-6 object-contain" />
          </motion.div>
        </span>
      </div>
      <div className="mt-2">
        <h3 className="font-hind text-[#000000] font-[500] text-[18px] pt-3">
          {title}
        </h3>
        <p className="font-hind text-[#454545] font-[400] text-[14px] break-words">
          {content}
        </p>
      </div>
    </div>
  );
};

export default DashboardBox;

export const QuickBox = ({ imageUrl, title, content, id, functions }) => {
  const handleClick = () => {
    if (id === 4 && functions?.showCompetitiveAnalysis) {
      functions.showCompetitiveAnalysis();
    } else if (id === 3 && functions?.showPerformanceMonitoring) {
      functions.showPerformanceMonitoring();
    }
  };

  return (
    <div
      className="rounded-md p-4 shadow-md hover:shadow-xl bg-[#FAFAFA] cursor-pointer border hover:shadow-gray-200 transition duration-200"
      onClick={handleClick}
    >
      <div className="flex items-center space-x-4">
        <span className="bg-[#E8F1FA] rounded-full p-2">
          <motion.div
            whileHover={{ scale: 1.15, rotate: 8 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="inline-block"
          >
            <img src={imageUrl} alt={title} className="w-6 h-6 object-contain" />
          </motion.div>
        </span>
      </div>
      <div className="mt-2">
        <h3 className="text-[#000000] font-[500] text-[18px] pt-3">{title}</h3>
        <p className="text-[#454545] font-[400] text-[14px]">{content}</p>
      </div>
    </div>
  );
};

export const RecentProjects = ({ title, content, tags, item }) => {
  const navigate = useNavigate();

  // Truncate content to 80 characters and add ellipses if it's too long
  const truncatedContent =
    content && content.length > 40
      ? `${content.substring(0, 80)}...`
      : content || ""; // Default to an empty string if content is null

  const handleBlogClick = () => {
    if (item && item._id) {
      navigate(`/toolbox/${item._id}`, { state: { blog: item } });
    }
  };

  return (
    <div
      onClick={handleBlogClick}
      className="p-2 cursor-pointer rounded-xl flex gap-2 flex-col justify-around items-start bg-white shadow-md hover:shadow-xl relative border hover:border-blue-200 hover:shadow-gray-300 transition duration-200"
    >
      {/* AI Model Tag in top right */}
      <div className="absolute top-2 right-2">
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
          {item?.aiModel ? item.aiModel : "Gemini"}
        </span>
      </div>
      <div className="p-1">
        <h3 className="text-[#000000] font-[500] text-[18px] pt-2 mb-2 w-80">
          {title}
        </h3>
        <p className="text-[#454545] font-[400] text-[14px]">
          {truncatedContent}
        </p>
      </div>
      <div className="flex items-center justify-start flex-wrap text-ellipsis gap-3 ml-3">
        {tags?.map((tag, index) => (
          <span
            key={index}
            className="text-md border-2 p-1 rounded-xl bg-blue-50"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};
