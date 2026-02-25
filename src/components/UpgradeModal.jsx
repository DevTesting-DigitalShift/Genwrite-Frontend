import { useNavigate } from "react-router-dom"
import { Lock, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

const UpgradeModal = ({ featureName }) => {
  const navigate = useNavigate()

  const handleClose = () => {
    navigate(-1) // Go back on close
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        role="dialog"
        aria-labelledby="upgrade-modal-title"
      >
        <div className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-50 rounded-full">
              <Lock className="w-10 h-10 text-blue-600" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 id="upgrade-modal-title" className="text-2xl font-bold text-gray-900">
              Upgrade Required
            </h2>
            <p className="text-gray-600">
              To unlock <span className="font-semibold text-blue-600">{featureName}</span>, please
              upgrade your plan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button
              className="btn btn-primary bg-blue-600 border-none hover:bg-blue-700 text-white flex-1"
              onClick={() => navigate("/pricing")}
              aria-label="Upgrade to a higher plan"
            >
              Upgrade Now
            </button>
            <button
              className="btn btn-ghost bg-gray-100 hover:bg-gray-200 text-gray-700 flex-1"
              onClick={handleClose}
              aria-label="Cancel and go back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default UpgradeModal
