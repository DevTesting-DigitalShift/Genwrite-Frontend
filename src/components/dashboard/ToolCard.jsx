import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Coins, Lock } from "lucide-react"

const ToolCard = ({ item, onClick, variant = "small", disabled = false, disabledReason }) => {
  const navigate = useNavigate()

  const handleClick = (e = {}) => {
    e.stopPropagation?.()
    if (disabled) return
    if (item.type === "navigation") {
      navigate(item.path)
      return
    }
    if (item.type === "modal" && onClick) {
      onClick(item)
    }
  }

  // Read-only workspaces (and any other locked state) dim the card and swap the credit
  // pill for a lock, so the tool reads as unavailable before it's clicked.
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
  const badge = disabled ? (
    <div className="absolute top-4 right-4 flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold border border-gray-200">
      <Lock className="w-3 h-3" />
      Read-only
    </div>
  ) : null

  // Large Card (Featured) - Matches the 'AI Blog Writer' look in reference
  if (variant === "large") {
    return (
      <motion.div
        whileHover={disabled ? undefined : { y: -4 }}
        aria-disabled={disabled || undefined}
        title={disabled ? disabledReason : undefined}
        className={`group flex flex-col justify-between p-6 bg-white border border-gray-200 rounded-xl shadow-none hover:shadow-lg transition-all h-full min-h-[200px] relative ${disabledClasses}`}
        onClick={handleClick}
      >
        {badge}
        {!disabled && item.credit && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-gray-50 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold border border-gray-100 group-hover:bg-yellow-50 group-hover:text-yellow-700 group-hover:border-yellow-100 transition-colors shadow-none">
            <Coins className="w-3 h-3" />
            {item.credit}
          </div>
        )}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.bgColor || "bg-primary/10"} ${item.color || "text-primary"}`}
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
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-colors shadow-none text-center disabled:cursor-not-allowed"
        >
          {item.title}
        </button>
      </motion.div>
    )
  }

  // Small Card (Standard) - Matches the smaller grid cards
  return (
    <motion.div
      whileHover={disabled ? undefined : { y: -4 }}
      aria-disabled={disabled || undefined}
      title={disabled ? disabledReason : undefined}
      className={`group flex flex-col justify-between p-5 bg-white border border-gray-200 rounded-xl shadow-none hover:shadow-lg transition-all h-full min-h-[140px] relative ${disabledClasses}`}
      onClick={handleClick}
    >
      {badge}
      {!disabled && item.credit && (
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-gray-50 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold border border-gray-100 group-hover:bg-yellow-50 group-hover:text-yellow-700 group-hover:border-yellow-100 transition-colors shadow-none">
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
