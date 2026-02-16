import React from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import useAuthStore from "@store/useAuthStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { ArrowRight, Gem } from "lucide-react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useProAction } from "@/hooks/useProAction"

dayjs.extend(relativeTime)
const isValidFunction = o => o && typeof o === "function"

export const DashboardBox = ({ title, content, id, showModal, icon, gradient, dataTour }) => {
  const { user } = useAuthStore()
  const userPlan = user?.plan ?? user?.subscription?.plan
  const navigate = useNavigate()
  const { handleProAction } = useProAction()
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
    handleProAction(() => {
      if (id === "D" && ["free", "basic"].includes(userPlan)) {
        showPopup()
      } else {
        isValidFunction(showModal) && showModal()
      }
    })
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      data-tour={dataTour}
      className={`
        relative group w-full p-6 rounded-2xl text-left overflow-hidden 
        transition-all duration-300 bg-gradient-to-br ${gradient} hover:scale-50
      `}
    >
      {/* Background Decorative Circles */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header with Icon and Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <div className="text-white">{icon}</div>
          </div>

          {/* Pro badge */}
          {["free", "basic"].includes(userPlan?.toLowerCase?.()) && id === "D" && (
            <span className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-white bg-white/20 backdrop-blur-sm animate-pulse">
              <Gem className="w-3.5 h-3.5" />
              Pro
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/80 line-clamp-2">{content}</p>
      </div>

      {/* Hover Arrow */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
      >
        <ArrowRight className="w-4 h-4 text-white" />
      </motion.div>
    </motion.button>
  )
}

export const QuickBox = ({
  icon,
  title,
  content,
  id,
  showModal,
  bgColor,
  hoverBg,
  color,
  navigate: navigateTo, // NEW PROP
}) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const userPlan = user?.plan ?? user?.subscription?.plan
  const { handlePopup } = useConfirmPopup()
  const { handleProAction } = useProAction()

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

    if (id === 4 && ["free", "basic"].includes(userPlan)) {
      showPopup()
    } else if (isValidFunction(showModal)) {
      handleProAction(() => showModal())
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`group p-4 rounded-xl ${bgColor} ${hoverBg} border border-transparent hover:border-gray-200 flex gap-4 hover:shadow-md transition-all duration-300 cursor-pointer`}
    >
      {/* Icon and badge */}
      <div className="flex items-center justify-between mb-4">
        <motion.div
          whileHover={{ scale: 1.15, rotate: 8 }}
          transition={{ type: "spring", stiffness: 300 }}
          className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white ${color} mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm`}
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

      <div>
        {/* Title */}
        <h3 className="font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors text-[18px]">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  )
}

export const Blogs = ({ title, content, tags, item, time }) => {
  const navigate = useNavigate()

  const cleanContent = content
    ?.replace(/^#+\s*/gm, "")
    ?.replace(/#[^\s#]+/g, "")
    ?.replace(/[*_~`>\\=|-]+/g, "")
    ?.replace(/\n+/g, " ")
    ?.replace(/\s+/g, " ")
    ?.trim()

  const handleBlogClick = () => {
    if (item && item._id) {
      navigate(`/blog/${item._id}`, { state: { blog: item } })
    }
  }

  return (
    <div
      onClick={handleBlogClick}
      className="group p-4 sm:p-5 md:p-6 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-300 cursor-pointer mb-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Left */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
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
              className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                item?.status === "complete"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {item?.status || ""}
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{cleanContent}</p>

          <div className="flex flex-wrap gap-2">
            {tags?.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs capitalize bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 ml-auto">
          <span>View</span>
          <span>{dayjs(time).fromNow()}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  )
}
