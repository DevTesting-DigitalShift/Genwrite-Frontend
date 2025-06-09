import { Button } from "antd"
import { CrownOutlined } from "@ant-design/icons"
import { motion } from "framer-motion"

const GoProButton = ({ onClick }) => {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
      <Button
        type="primary"
        icon={<CrownOutlined size={24} />}
        onClick={onClick}
        size="large"
        className="go-pro-button backdrop-blur-md px-6 py-2 font-semibold text-white text-lg tracking-wider border-none shadow-lg"
      >
        Go Pro
      </Button>
      <div className="shimmer absolute inset-0 rounded-full pointer-events-none" />
    </motion.div>
  )
}

export default GoProButton
