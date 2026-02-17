import { Button, Tooltip } from "antd"
import { CalendarOutlined } from "@ant-design/icons"
import { motion } from "framer-motion"
import { getCalApi } from "@calcom/embed-react"
import { useEffect, useCallback, useState } from "react"

/**
 * Props interface for ScheduleDemoButton component
 * @param calLink - Cal.com username/event-type link (e.g., "john/30min-demo")
 * @param buttonText - Custom text for the button (defaults to "Schedule Demo")
 * @param mobileText - Shorter text for mobile screens (optional, falls back to buttonText)
 * @param size - Ant Design button size: 'small' | 'middle' | 'large'
 * @param variant - Button style variant: 'primary' | 'gradient' | 'outline'
 * @param className - Additional CSS classes
 * @param showIcon - Whether to show the calendar icon (defaults to true)
 * @param tooltipText - Tooltip text on hover (optional)
 * @param disabled - Whether the button is disabled
 * @param hideOnMobile - Whether to hide the button completely on mobile
 * @param iconOnly - Whether to show only icon on mobile (no text)
 */
interface ScheduleDemoButtonProps {
  calLink?: string
  buttonText?: string
  mobileText?: string
  size?: "small" | "middle" | "large"
  variant?: "primary" | "gradient" | "outline"
  className?: string
  showIcon?: boolean
  tooltipText?: string
  disabled?: boolean
  hideOnMobile?: boolean
  iconOnly?: boolean
}

/**
 * ScheduleDemoButton Component
 *
 * A premium, animated button for scheduling Cal.com meetings.
 * Uses Cal.com's embed API to open a scheduling modal when clicked.
 *
 * Features:
 * - Multiple visual variants (primary, gradient, outline)
 * - Smooth hover and tap animations via Framer Motion
 * - Cal.com embed integration for seamless scheduling
 * - Fully responsive with mobile-specific options
 * - Fully customizable via props
 *
 * @example
 * // Basic usage
 * <ScheduleDemoButton calLink="your-username/30min" />
 *
 * // With custom styling and mobile responsiveness
 * <ScheduleDemoButton
 *   calLink="your-username/discovery-call"
 *   buttonText="Schedule a Demo"
 *   mobileText="Demo"
 *   variant="gradient"
 *   size="large"
 *   iconOnly={true}
 * />
 */
const ScheduleDemoButton = ({
  calLink = "genwrite/demo", // Default Cal.com link - replace with your actual link
  buttonText = "Schedule Demo",
  mobileText,
  size = "large",
  variant = "gradient",
  className = "",
  showIcon = true,
  tooltipText = "Book a free demo call with our team",
  disabled = false,
  hideOnMobile = false,
  iconOnly = false,
}: ScheduleDemoButtonProps) => {
  const [isCalLoaded, setIsCalLoaded] = useState(false)

  /**
   * Initialize Cal.com embed API on component mount
   * This loads the Cal.com script and prepares the modal UI
   */
  useEffect(() => {
    const initCal = async () => {
      try {
        const cal = await getCalApi({ namespace: "schedule-demo" })

        // Configure Cal.com UI options
        cal("ui", {
          theme: "light",
          styles: {
            branding: {
              brandColor: "#6366f1", // Indigo-500 to match your design
            },
          },
          hideEventTypeDetails: false,
          layout: "month_view",
        })

        setIsCalLoaded(true)
      } catch (error) {
        console.error("Failed to load Cal.com embed:", error)
      }
    }

    void initCal()
  }, [])

  /**
   * Get the appropriate CSS classes based on the selected variant
   * @returns Tailwind CSS class string for the button variant
   */
  const getVariantClasses = useCallback((): string => {
    const baseClasses =
      "font-montserrat font-semibold tracking-wide rounded-lg transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 group"

    switch (variant) {
      case "gradient":
        return `${baseClasses} !bg-gradient-to-r !from-indigo-500 !via-purple-500 !to-pink-500 !text-white !border-0 hover:!from-indigo-600 hover:!via-purple-600 hover:!to-pink-600 hover:shadow-xl hover:shadow-purple-500/25`

      case "outline":
        return `${baseClasses} !bg-transparent !border-2 !border-indigo-500 !text-indigo-600 hover:!bg-indigo-50 hover:!border-indigo-600`

      case "primary":
      default:
        return `${baseClasses} !bg-indigo-600 !text-white !border-0 hover:!bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30`
    }
  }, [variant])

  /**
   * Get padding classes based on button size - responsive
   * @returns Tailwind padding class string
   */
  const getSizeClasses = useCallback((): string => {
    switch (size) {
      case "small":
        return "!py-1 !px-2 sm:!py-1.5 sm:!px-4 !text-xs sm:!text-sm"
      case "large":
        return "!py-2 !px-3 sm:!py-3 sm:!px-6 !text-sm sm:!text-base"
      case "middle":
      default:
        return "!py-1.5 !px-3 sm:!py-2 sm:!px-5 !text-xs sm:!text-sm"
    }
  }, [size])

  /**
   * Get responsive visibility classes
   */
  const getResponsiveClasses = useCallback((): string => {
    if (hideOnMobile) {
      return "hidden sm:block"
    }
    return ""
  }, [hideOnMobile])

  /**
   * Render the button content
   */
  const ButtonContent = () => (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`relative ${getResponsiveClasses()}`}
    >
      <Button
        size={size}
        disabled={disabled || !isCalLoaded}
        data-cal-namespace="schedule-demo"
        data-cal-link={calLink}
        data-cal-config='{"layout":"month_view"}'
        className={`
          ${getVariantClasses()}
          ${getSizeClasses()}
          ${className}
        `}
        icon={
          showIcon ? (
            <CalendarOutlined className="text-base sm:text-lg group-hover:animate-pulse" />
          ) : undefined
        }
      >
        {/* Button Text - responsive */}
        {iconOnly ? (
          // Icon only on mobile, text on desktop
          <span className="relative z-10 hidden sm:inline">{buttonText}</span>
        ) : (
          // Show mobileText on mobile, full text on desktop
          <>
            <span className="relative z-10 hidden sm:inline">{buttonText}</span>
            <span className="relative z-10 sm:hidden">{mobileText || buttonText}</span>
          </>
        )}
      </Button>

      {/* Shimmer effect overlay */}
      {!disabled && (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="shimmer-effect absolute inset-0" />
        </div>
      )}
    </motion.div>
  )

  // Render with or without tooltip
  return tooltipText ? (
    <Tooltip title={tooltipText} placement="top" arrow>
      <span className={getResponsiveClasses()}>
        <ButtonContent />
      </span>
    </Tooltip>
  ) : (
    <ButtonContent />
  )
}

export default ScheduleDemoButton
