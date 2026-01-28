import { Modal, Button } from "antd"
import { useNavigate } from "react-router-dom"
import { Lock, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

const UpgradeModal = ({ featureName }) => {
  const navigate = useNavigate()

  const handleClose = () => {
    navigate(-1) // Go back on close
  }

  return (
    <Modal
      open
      closable={false}
      footer={null}
      centered
      maskClosable={false}
      onCancel={handleClose}
      styles={{
        body: {
          padding: 0,
          borderRadius: "12px",
          overflow: "hidden",
        },
        mask: {
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(8px)",
        },
      }}
      width={450}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="text-center p-8 bg-white space-y-6"
        role="dialog"
        aria-labelledby="upgrade-modal-title"
      >
        <div className="flex justify-center">
          <Lock className="w-12 h-12 text-blue-600" aria-hidden="true" />
        </div>
        <h2 id="upgrade-modal-title" className="text-2xl font-semibold text-gray-900">
          Upgrade Required
        </h2>
        <p className="text-gray-600 text-base">
          To unlock <strong>{featureName}</strong>, please upgrade your plan.
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <Button
            type="primary"
            size="large"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 border-none text-white font-medium rounded-lg transition-colors"
            onClick={() => navigate("/pricing")}
            aria-label="Upgrade to a higher plan"
          >
            Upgrade Now
          </Button>
          <Button
            size="large"
            className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors"
            onClick={handleClose}
            aria-label="Cancel and go back"
          >
            <ArrowLeft className="w-4 h-4 mr-2 inline" />
            Cancel
          </Button>
        </div>
      </motion.div>
    </Modal>
  )
}

export default UpgradeModal
