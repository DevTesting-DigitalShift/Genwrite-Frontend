import React from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Coins } from "lucide-react"

const ToolCard = ({ item, onClick, variant = "small" }) => {
  const navigate = useNavigate()

  const handleClick = (e = {}) => {
    e.stopPropagation && e.stopPropagation()
    if (item.type === "navigation") {
      navigate(item.path)
      return
    }
    if (item.type === "modal" && onClick) {
      onClick(item)
    }
  }

  // Large Card (Featured) - Matches the 'AI Blog Writer' look in reference
  if (variant === "large") {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className="group flex flex-col justify-between p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer h-full min-h-[200px] relative"
        onClick={handleClick}
      >
        {item.credit && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-gray-50 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold border border-gray-100 group-hover:bg-yellow-50 group-hover:text-yellow-700 group-hover:border-yellow-100 transition-colors shadow-sm">
            <Coins className="w-3 h-3" />
            {item.credit}
          </div>
        )}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.bgColor || "bg-indigo-50"} ${item.color || "text-indigo-600"}`}
            >
              {item.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{item.title}</h3>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-3">
            {item.description}
          </p>
        </div>

        <button
          onClick={handleClick}
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm text-center"
        >
          {item.title}
        </button>
      </motion.div>
    )
  }

  // Small Card (Standard) - Matches the smaller grid cards
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group flex flex-col justify-between p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer h-full min-h-[140px] relative"
      onClick={handleClick}
    >
      {item.credit && (
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-gray-50 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold border border-gray-100 group-hover:bg-yellow-50 group-hover:text-yellow-700 group-hover:border-yellow-100 transition-colors shadow-sm">
          <Coins className="w-3 h-3" />
          {item.credit}
        </div>
      )}
      <div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${item.bgColor || "bg-gray-50"} ${item.color || "text-gray-600"}`}
        >
          {item.icon}
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1 pr-16">{item.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{item.description}</p>
      </div>
    </motion.div>
  )
}

export default ToolCard
