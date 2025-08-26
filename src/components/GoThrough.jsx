import { Modal } from "antd"
import { X } from "lucide-react"

const GoThrough = ({ onClose }) => {
  return (
    <Modal
      open={true}
      onCancel={onClose}
      centered
      footer={null}
      closeIcon={<X size={24} className="text-gray-500 hover:text-gray-800 transition-colors" />}
      width={900} // Equivalent to Tailwind's max-w-4xl
      bodyStyle={{ padding: 0, borderRadius: "12px", overflow: "hidden" }}
      destroyOnClose // Resets video state when modal is closed
      styles={{ mask: { backdropFilter: "blur(4px)" } }}
    >
      <div className="p-6 pb-0 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Here’s How We Make Things Easy</h2>
        <p className="mt-2 text-md text-gray-600">
          See how each feature helps you get more done, faster.
        </p>
      </div>

      <div className="relative rounded-lg overflow-hidden m-6 mt-4">
        {/* The video will only render when the modal is open */}
        {open && (
          <video
            className="w-full h-auto object-contain bg-black rounded-lg"
            src="/public/all_pages.mp4"
            onError={(e) => (e.target.style.display = "none")}
            autoPlay
            loop
            muted
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        )}
        <div
          className="absolute inset-0 bg-gray-200 flex items-center justify-center rounded-lg"
          style={{ zIndex: -1 }}
        >
          <p className="text-gray-500">Video loading...</p>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-black/80 to-transparent text-white rounded-b-lg">
          <h3 className="text-xl font-bold">Dive Into a Smooth Experience</h3>
          <p className="text-sm opacity-90">
            Take a quick tour and see all the features in action.
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default GoThrough
