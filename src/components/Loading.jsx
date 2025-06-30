import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"

const Loading = ({ message = "Loading...", size = "default" }) => {
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  }

  const getLoaderSize = () => {
    switch (size) {
      case "small":
        return "h-6 w-6"
      case "large":
        return "h-12 w-12"
      default:
        return "h-8 w-8"
    }
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

  return (
    <div className="min-h-screen absolute top-0 right-0 left-0 bottom-0 bg-gray-100 flex flex-col items-center justify-center">
      <img src="/Images/logo_genwrite_2.png" alt="Genwrite logo" className="w-80" />
      <motion.div
        className="flex flex-col items-center justify-center space-y-4 p-4"
        variants={containerVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5 }}
      >
        {/* <Loader2 className={`animate-spin text-blue-600 ${getLoaderSize()}`} /> */}
        {message && <div className={`text-gray-600 font-medium ${getTextSize()}`}>{message}</div>}
        <div className="w-full max-w-md h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-600"
            animate={{
              width: ["0%", "100%"],
              transition: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}

export default Loading
