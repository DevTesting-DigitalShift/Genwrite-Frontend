import { motion, AnimatePresence } from "framer-motion"
import { useState, useCallback } from "react"
import { FaWhatsapp } from "react-icons/fa"

interface WhatsAppFloatButtonProps {
  phoneNumber: string
  message?: string
  tooltipText?: string
  position?: "bottom-right" | "bottom-left"
  className?: string
  size?: "small" | "medium" | "large"
  showPulse?: boolean
  mobileOffset?: { bottom?: string; right?: string; left?: string }
}

const WhatsAppFloatButton = ({
  phoneNumber,
  message = "Hi! I'm interested in learning more about GenWrite.",
  tooltipText = "Chat with us on WhatsApp",
  position = "bottom-right",
  className = "",
  size = "medium",
  showPulse = true,
  mobileOffset,
}: WhatsAppFloatButtonProps) => {
  const [isHovered, setIsHovered] = useState(false)

  const getWhatsAppUrl = useCallback((): string => {
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`
  }, [phoneNumber, message])

  const getSizeClasses = useCallback((): { button: string; icon: string; label: string } => {
    switch (size) {
      case "small":
        return {
          button: "size-10 sm:size-11",
          icon: "text-xl sm:text-2xl",
          label: "left-12 sm:left-14",
        }
      case "large":
        return {
          button: "size-14 sm:size-16",
          icon: "text-3xl sm:text-4xl",
          label: "left-16 sm:left-[4.5rem]",
        }
      case "medium":
      default:
        return {
          button: "size-11 sm:size-12 md:size-14",
          icon: "text-2xl sm:text-2xl md:text-3xl",
          label: "left-14 sm:left-14 md:left-16",
        }
    }
  }, [size])

  const handleClick = useCallback(() => {
    window.open(getWhatsAppUrl(), "_blank", "noopener,noreferrer")
  }, [getWhatsAppUrl])

  const sizeClasses = getSizeClasses()

  return (
    <div
      className="fixed z-50 pointer-events-auto tooltip tooltip-left"
      style={{
        // Manual positioning for floating button
        bottom: mobileOffset?.bottom || (position === "bottom-right" ? "1.5rem" : "1.5rem"),
        [position === "bottom-right" ? "right" : "left"]:
          mobileOffset?.right ||
          mobileOffset?.left ||
          (position === "bottom-right" ? "0.75rem" : "0.75rem"),
      }}
      data-tip={tooltipText}
    >
      <motion.div
        className={`cursor-pointer select-none ${className}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {showPulse && (
          <div
            className={`
              absolute inset-0 rounded-full bg-[#25D366] 
              animate-ping opacity-20
            `}
          />
        )}

        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`
            relative flex items-center justify-center
            ${sizeClasses.button}
            rounded-full
            bg-linear-to-br from-[#25D366] to-[#128C7E]
            text-white
            shadow-lg shadow-[#25D366]/30
            hover:shadow-xl hover:shadow-[#25D366]/40
            active:shadow-md
            transition-shadow duration-300
            focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:ring-offset-2
          `}
          aria-label="Chat on WhatsApp"
        >
          <FaWhatsapp className={sizeClasses.icon} />
        </motion.button>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: position === "bottom-left" ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: position === "bottom-left" ? -10 : 10 }}
              transition={{ duration: 0.2 }}
              className={`
                absolute top-1/2 -translate-y-1/2
                ${
                  position === "bottom-left"
                    ? sizeClasses.label
                    : `-${sizeClasses.label.replace("left-", "right-")}`
                }
                bg-white rounded-lg px-3 py-2
                shadow-lg border border-gray-100
                whitespace-nowrap
                hidden md:block
              `}
              style={{
                [position === "bottom-left" ? "left" : "right"]:
                  size === "small" ? "3rem" : size === "large" ? "4.5rem" : "3.5rem",
              }}
            >
              <span className="text-sm font-medium text-gray-700">Chat with us</span>
              <div
                className={`
                  absolute top-1/2 -translate-y-1/2 
                  ${position === "bottom-left" ? "-left-2" : "-right-2"}
                  w-0 h-0 
                  border-t-[6px] border-t-transparent 
                  border-b-[6px] border-b-transparent 
                  ${
                    position === "bottom-left"
                      ? "border-r-8 border-r-white"
                      : "border-l-8 border-l-white"
                  }
                `}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default WhatsAppFloatButton
