import { Button } from "antd"
import { CrownOutlined } from "@ant-design/icons"
import { motion } from "framer-motion"
import { useSelector } from "react-redux"
import { useEffect, useState } from "react"

const GoProButton = ({ onClick }) => {
  const { user } = useSelector((state) => state.auth)
  const [userPlan, setUserPlan] = useState("")

  useEffect(() => {
    setUserPlan(user?.subscription?.plan || "")
  }, [user])

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative"
      hidden={userPlan === "enterprise"}
    >
      <Button
        type="primary"
        icon={<CrownOutlined size={24} />}
        onClick={onClick}
        size="large"
        className="go-pro-button backdrop-blur-md px-6 py-2 font-semibold text-white tracking-wider border-none shadow-lg"
      >
        {userPlan === "pro" ? "Upgrade" : "Go Pro"}
      </Button>
      <div className="shimmer absolute inset-0 rounded-full pointer-events-none" />
    </motion.div>
  )
}

export default GoProButton
