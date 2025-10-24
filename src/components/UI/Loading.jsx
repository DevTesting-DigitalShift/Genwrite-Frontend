import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { memo, useEffect } from "react"

const Loading = ({ message = "Loading...", size = "default" }) => {
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  }

  const getTextSize = () => {
    switch (size) {
      case "small":
        return "text-sm"
      case "large":
        return "text-xl"
      default:
        return "text-base"
    }
  }

  // 🔒 Prevent background scroll
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
      <img src="/Images/logo_genwrite_2.png" alt="GenWrite logo" className="w-72 sm:w-80" />

      <motion.div
        className="flex flex-col items-center justify-center space-y-4 p-4"
        variants={containerVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{
            opacity: [0.8, 1, 0.8],
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
          className={`text-gray-600 font-medium ${getTextSize()}`}
        >
          {message}
        </motion.div>

        <div className="w-full max-w-md h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-2 bg-blue-600"
            animate={{
              width: ["0%", "100%", "0%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}

export default memo(Loading)
