import { motion } from "framer-motion"
import { SlidersHorizontal } from "lucide-react"

const FeatureSettingsModal = ({ features }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      <div className="grid grid-cols-1 gap-3">
        {Object.entries(features || {}).length > 0 ? (
          Object.entries(features).map(([key, value]) => {
            const isEnabled = Boolean(value)
            return (
              <motion.div
                key={key}
                whileHover={{ backgroundColor: "#f8fafc" }}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${isEnabled ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {isEnabled ? "Enabled" : "Disabled"}
                </span>
              </motion.div>
            )
          })
        ) : (
          <div className="text-center py-6">
            <SlidersHorizontal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No enhancement features configured</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default FeatureSettingsModal
