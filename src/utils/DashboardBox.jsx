import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useSelector } from "react-redux"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { CrownFilled } from "@ant-design/icons"
import { ArrowRight, Eye, Gem } from "lucide-react"
import moment from "moment"

export const DashboardBox = ({ title, content, id, functions, icon, gradient }) => {
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan
  const { handlePopup } = useConfirmPopup()
  const showPopup = () => {
    handlePopup({
      title: "Upgrade Required",
      description: "Bulk blog generation is only available for Pro and Enterprise users.",
      confirmText: "Buy Now",
      cancelText: "Cancel",
      icon: <Gem style={{ fontSize: 50, color: "#a47dab" }} />,
      onConfirm: () => navigate("/pricing"),
    })
  }

  const handleClick = () => {
    if (id === "A") {
      functions.showQuickBlogModal?.()
    } else if (id === 1) {
      functions.showModal?.()
    } else if (id === "B") {
      if (["free", "basic"].includes(userPlan?.toLowerCase())) {
        showPopup()
        return
      }
      functions.showMultiStepModal?.()
    } else if (id === 4) {
      functions.showCompetitiveAnalysis?.()
    } else if (id === 3) {
      functions.showPerformanceMonitoring?.()
    }
  }

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Background hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300 from-blue-500 to-purple-500"></div>

      {/* Icon */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r ${gradient} text-white mb-6 transition-transform duration-300`}
        >
          {icon}
        </div>

        {/* Pro badge for restricted action */}
        {["free", "basic"].includes(userPlan?.toLowerCase?.()) && id === "B" && (
          <span className="flex items-center gap-2 rounded-md text-white font-semibold border p-2 px-3 bg-gradient-to-tr from-blue-500 to-purple-500 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out animate-pulse backdrop-blur-sm text-lg mb-5">
            <Gem className="w-4 h-4 animate-bounce" />
            Pro
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-sm leading-relaxed mb-4">{content}</p>

      {/* CTA */}
      <div className="flex items-center text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
        Get Started
        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  )
}

export const QuickBox = ({
  icon,
  title,
  content,
  id,
  functions,
  bgColor,
  hoverBg,
  color,
  navigate: navigateTo, // NEW PROP
}) => {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan
  const { handlePopup } = useConfirmPopup()

  const showPopup = () => {
    handlePopup({
      title: "Upgrade Required",
      description: "Competitor Analysis is only available for Pro and Enterprise users.",
      confirmText: "Buy Now",
      cancelText: "Cancel",
      onConfirm: () => navigate("/pricing"),
    })
  }

  const handleClick = () => {
    if (navigateTo) {
      navigate(navigateTo)
      return
    }

    if (id === 4 && functions?.showCompetitiveAnalysis) {
      if (["free", "basic"].includes(userPlan?.toLowerCase())) {
        showPopup()
        return
      }
      functions.showCompetitiveAnalysis()
    } else if (id === 3 && functions?.showPerformanceMonitoring) {
      functions.showPerformanceMonitoring()
    } else if (id === 2 && functions?.showSeoAnalysis) {
      functions.showSeoAnalysis()
    } else if (id === 1 && functions?.showKeywordResearch) {
      functions.showKeywordResearch()
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`group p-6 rounded-xl ${bgColor} ${hoverBg} border border-transparent hover:border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer`}
    >
      {/* Icon and badge */}
      <div className="flex items-center justify-between mb-4">
        <motion.div
          whileHover={{ scale: 1.15, rotate: 8 }}
          transition={{ type: "spring", stiffness: 300 }}
          className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white ${color} mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm`}
        >
          {icon}
        </motion.div>

        {/* Pro badge if user is free/basic and accessing restricted tool */}
        {["free", "basic"].includes(userPlan?.toLowerCase?.()) && id === 4 && (
          <span className="flex items-center gap-2 rounded-md text-white font-semibold border p-2 px-3 bg-gradient-to-tr from-blue-500 to-purple-500 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out animate-pulse backdrop-blur-sm text-lg mb-5">
            <Gem className="w-4 h-4 animate-bounce" />
            Pro
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors text-[18px]">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-sm leading-relaxed">{content}</p>
    </div>
  )
}

export const Blogs = ({ title, content, tags, item, time }) => {
  const navigate = useNavigate()

  // Truncate content to 80 characters and add ellipses if it's too long
  const cleanContent = content
    ?.replace(/^#+\s*/gm, "") // Remove markdown headers like "# Heading"
    ?.replace(/#[^\s#]+/g, "") // Remove hashtags like #tag
    ?.replace(/[*_~`>\\=|-]+/g, "") // Remove markdown formatting
    ?.replace(/\n+/g, " ") // Replace newlines with space
    ?.replace(/\s+/g, " ") // Collapse multiple spaces
    ?.trim()

  const truncatedContent =
    cleanContent && cleanContent.length > 40
      ? `${cleanContent.substring(0, 80)}...`
      : cleanContent || ""
  // Default to an empty string if content is null

  const handleBlogClick = () => {
    if (item && item._id) {
      navigate(`/toolbox/${item._id}`, { state: { blog: item } })
    }
  }

  return (
    <div
      onClick={handleBlogClick}
      className="group p-6 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-300 cursor-pointer mb-4"
    >
      <div className="flex lg:items-start lg:justify-between gap-4">
        {/* Left section: content */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-bold capitalize text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {title}
            </h3>

            <span
              className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                item?.isManuallyEdited ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              {item?.isManuallyEdited ? "Manually Generated" : item?.aiModel || "Gemini"}
            </span>

            <span
              className={`px-2 py-1 capitalize text-xs font-medium rounded-full ${
                item?.status === "complete"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {item?.status || ""}
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{truncatedContent}</p>

          <div className="flex flex-wrap gap-2">
            {tags?.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 capitalize bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right section: actions */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <span>View</span>
            <span>{moment(time).fromNow()}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  )
}
