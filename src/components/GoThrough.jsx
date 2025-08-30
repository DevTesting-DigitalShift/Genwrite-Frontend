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
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/Yq9WDkzi39U?autoplay=0&mute=1&loop=1&playlist=Yq9WDkzi39U"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-lg"
          ></iframe>
        )}
      </div>
    </Modal>
  )
}

export default GoThrough
