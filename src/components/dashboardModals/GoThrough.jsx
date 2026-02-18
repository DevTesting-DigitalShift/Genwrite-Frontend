import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const GoThrough = ({ onClose, visible = true }) => {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-gray-600 hover:bg-gray-100 z-10"
        >
          <X size={24} />
        </button>

        <div className="p-6 md:p-8 pb-0 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Here’s How We Make Things Easy
          </h2>
          <p className="mt-2 text-base md:text-lg text-gray-500">
            See how each feature helps you get more done, faster.
          </p>
        </div>

        <div className="p-6 md:p-8">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/Yq9WDkzi39U?autoplay=0&mute=1&loop=1&playlist=Yq9WDkzi39U"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default GoThrough
