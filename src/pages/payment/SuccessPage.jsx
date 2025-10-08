import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"
import Confetti from "react-confetti"

const SuccessPage = () => {
  const navigate = useNavigate()
  const [showConfetti, setShowConfetti] = React.useState(true)

  // Stop confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  // Animation variants for the main content
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  // Animation variants for the icon
  const iconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 15, delay: 0.2 },
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: { duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" },
    },
  }

  // Animation variants for the button
  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0 4px 20px rgba(59, 130, 246, 0.3)" },
    tap: { scale: 0.95 },
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 via-blue-50 to-white relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={200}
          recycle={false}
          colors={["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"]}
        />
      )}

      {/* Background Wave Pattern */}
      <svg
        className="absolute bottom-0 left-0 w-full h-1/3 opacity-20"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill="#22c55e"
          fillOpacity="0.3"
          d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,181.3C672,192,768,160,864,138.7C960,117,1056,107,1152,122.7C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>

      <motion.div
        className="text-center z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Success Icon */}
        <motion.div
          className="mb-6 sm:mb-8"
          variants={iconVariants}
          initial="hidden"
          animate={["visible", "pulse"]}
        >
          <CheckCircle className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 text-green-500 mx-auto" />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 sm:mb-6">
          Payment Completed Successfully
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-10 leading-relaxed max-w-md sm:max-w-lg lg:max-w-xl mx-auto">
          You’re ready to create powerful content with GenWrite AI!
        </p>

        {/* Button */}
        <motion.button
          onClick={() => navigate("/")}
          className="px-8 py-3 sm:px-10 sm:py-4 bg-blue-600 text-white rounded-lg font-semibold text-base sm:text-lg transition-all"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          Go to Dashboard
        </motion.button>
      </motion.div>
    </div>
  )
}

export default SuccessPage
