import { motion } from "framer-motion"
import { FaEdit, FaTimes } from "react-icons/fa"
import { Info, Loader2, Trash, Upload } from "lucide-react"

const BrandVoicesComponent = ({
  id,
  brandName,
  brandVoice,
  onSelect,
  isSelected,
  onEdit,
  onDelete,
}) => {
  return (
    <motion.div
      className={`p-4 mt-2 rounded-xl cursor-pointer transition-all ${
        isSelected
          ? "bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-300 shadow-md"
          : "bg-white border border-gray-200 hover:bg-gray-50"
      }`}
      onClick={onSelect}
      whileHover={{
        y: -2,
        boxShadow: "0 4px 15px rgba(99, 64, 241, 0.1)",
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      aria-label={`Select ${brandName} brand voice`}
    >
      <div className="flex justify-between items-center">
        <h3
          className={`font-medium text-sm ${
            isSelected ? "text-indigo-700" : "text-gray-700"
          } truncate max-w-[70%]`}
        >
          {brandName}
        </h3>
        <div className="flex space-x-2">
          <motion.button
            className="text-indigo-500 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            aria-label={`Edit ${brandName}`}
            title="Edit"
          >
            <FaEdit className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            aria-label={`Delete ${brandName}`}
            title="Delete"
          >
            <Trash className="w-4 h-4 text-red-400" />
          </motion.button>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-1 line-clamp-3">{brandVoice}</p>
    </motion.div>
  )
}

export default BrandVoicesComponent
