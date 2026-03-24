import { useRef, useEffect } from "react"
import { Calendar } from "lucide-react"
import { motion } from "framer-motion"
import { getCalApi } from "@calcom/embed-react"

interface ScheduleDemoButtonProps {
  calLink?: string
  buttonText?: string
  mobileText?: string
  size?: "sm" | "md" | "lg" | "middle" | "large"
  variant?: "primary" | "gradient" | "outline" | "ghost" | "linear"
  className?: string
  showIcon?: boolean
  disabled?: boolean
  hideOnMobile?: boolean
  iconOnly?: boolean
  width?: "auto" | "full"
}

const ScheduleDemoButton = ({
  calLink = "genwrite/demo",
  buttonText = "Schedule Demo",
  mobileText,
  size = "md",
  variant = "gradient",
  className = "",
  showIcon = true,
  disabled = false,
  hideOnMobile = false,
  iconOnly = false,
  width = "auto",
}: ScheduleDemoButtonProps) => {
  const isCalLoaded = useRef(false)

  useEffect(() => {
    void (async function () {
      const cal = await getCalApi({ namespace: "schedule-demo" })
      cal("ui", {
        theme: "light",
        styles: { branding: { brandColor: "#6366f1" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      })
      isCalLoaded.current = true
    })()
  }, [])

  const sizeClasses = {
    sm: "btn-sm text-xs px-3",
    md: "btn-md text-sm px-3",
    middle: "btn-md text-sm px-3 h-10",
    lg: "btn-md text-base px-4 h-11",
    large: "btn-md text-base px-4 h-11",
  }

  const getVariantClasses = () => {
    switch (variant) {
      case "linear":
      case "gradient":
        return "border-none bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-md"
      case "outline":
        return "btn-outline border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50"
      case "ghost":
        return "btn-ghost text-gray-600 hover:bg-gray-100"
      case "primary":
      default:
        return "btn-primary bg-indigo-600 border-none hover:bg-indigo-700 text-white"
    }
  }

  const responsiveClass = hideOnMobile ? "hidden sm:inline-flex" : "inline-flex"
  const widthClass = width === "full" ? "w-full" : ""

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      data-cal-namespace="schedule-demo"
      data-cal-link={calLink}
      data-cal-config='{"layout":"month_view"}'
      disabled={disabled}
      className={`
        btn ${sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md} ${widthClass} ${responsiveClass}
        rounded-lg font-semibold tracking-tight capitalize 
        transition-all duration-300 gap-2 group relative overflow-hidden
        ${getVariantClasses()}
        ${className}
      `}
    >
      {/* Shimmer Overlay */}
      <div className="shimmer-effect absolute inset-0 pointer-events-none z-0"></div>

      {showIcon && (
        <Calendar
          className={`w-4 h-4 sm:w-5 sm:h-5 ${iconOnly ? "block sm:hidden" : ""} ${
            !iconOnly ? "mr-1" : ""
          } group-hover:scale-110 transition-transform duration-300 relative z-10`}
        />
      )}

      {!iconOnly && (
        <>
          <span className="hidden sm:inline text-base font-bold relative z-10">{buttonText}</span>
          <span className="sm:hidden relative z-10">{mobileText || buttonText}</span>
        </>
      )}

      {iconOnly && <span className="hidden sm:inline relative z-10">{buttonText}</span>}
    </motion.button>
  )
}

export default ScheduleDemoButton
